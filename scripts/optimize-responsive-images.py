#!/usr/bin/env python3
"""Generate responsive recipe image derivatives and rewrite HTML image markup for deployment.

Source recipe images remain untouched. Derivatives are build artifacts, so the repository
keeps its canonical WebP assets while the deployed site gets responsive WebP plus JPEG fallback.
"""
from __future__ import annotations

from html import escape
from pathlib import Path
import re
from urllib.parse import unquote, urlparse

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
IMAGE_ROOT = ROOT / "assets" / "images" / "recipes"
IMG_RE = re.compile(r"<img\b[^>]*>", re.IGNORECASE | re.DOTALL)
ATTR_RE = re.compile(r"""([^\s=/>]+)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?""")
ROLES = {
    "card": {"sizes": [(320, 213), (600, 400)], "fallback": (600, 400),
             "sizes_attr": "(max-width: 600px) calc(100vw - 2rem), (max-width: 1000px) 50vw, 300px"},
    "featured": {"sizes": [(480, 270), (800, 450), (1200, 675)], "fallback": (1200, 675),
                 "sizes_attr": "(max-width: 760px) calc(100vw - 2rem), (max-width: 1200px) 90vw, 1200px"},
    "step": {"sizes": [(400, 300), (800, 600)], "fallback": (800, 600),
             "sizes_attr": "(max-width: 760px) calc(100vw - 2rem), 800px"},
}


def parse_attrs(tag: str) -> dict[str, str]:
    inside = re.sub(r"^<img\b|/?>$", "", tag.strip(), flags=re.IGNORECASE).strip()
    result: dict[str, str] = {}
    for match in ATTR_RE.finditer(inside):
        key = match.group(1).lower()
        value = next((v for v in match.groups()[1:] if v is not None), "")
        result[key] = value
    return result


def replace_attr(tag: str, name: str, value: str) -> str:
    pattern = re.compile(r"(\s" + re.escape(name) + r"\s*=\s*)(?:\"[^\"]*\"|'[^']*'|[^\s>]+)", re.I)
    quoted = f'{name}="{escape(value, quote=True)}"'
    if pattern.search(tag):
        return pattern.sub(lambda m: m.group(1) + f'"{escape(value, quote=True)}"', tag, count=1)
    return tag[:-1].rstrip() + " " + quoted + ">"


def add_attr(tag: str, name: str, value: str) -> str:
    return replace_attr(tag, name, value)


def local_recipe_image(src: str, page: Path) -> Path | None:
    parsed = urlparse(src)
    if parsed.scheme or parsed.netloc or not parsed.path.lower().endswith(".webp"):
        return None
    path = unquote(parsed.path)
    candidate = ROOT / path.lstrip("/") if path.startswith("/") else (page.parent / path).resolve()
    try:
        candidate.relative_to(IMAGE_ROOT)
    except ValueError:
        return None
    return candidate if candidate.is_file() else None


def derivative_path(source: Path, role: str, width: int | None = None) -> Path:
    suffix = f"-{role}" if width is None else f"-{role}-{width}"
    return source.with_name(source.stem + suffix + (".jpg" if width is None else ".webp"))


def make_image(source: Path, destination: Path, size: tuple[int, int], fmt: str) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGB")
        image = ImageOps.fit(image, size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.45))
        if fmt == "WEBP":
            image.save(destination, "WEBP", quality=82, method=6)
        else:
            image.save(destination, "JPEG", quality=84, optimize=True, progressive=True)


def ensure_derivatives(source: Path, role: str) -> None:
    roles = {role, "card"}  # card variants are also used when the article-image sync updates a card.
    for current_role in roles:
        config = ROLES[current_role]
        for width, height in config["sizes"]:
            make_image(source, derivative_path(source, current_role, width), (width, height), "WEBP")
        make_image(source, derivative_path(source, current_role), config["fallback"], "JPEG")


def choose_role(html: str, start: int, image_counts: dict[str, int]) -> str:
    prefix = html[max(0, start - 2500):start]
    last_card_open = prefix.rfind('class="recipe-card"')
    last_card_close = prefix.rfind("</article>")
    if last_card_open > last_card_close:
        return "card"
    content_pos = prefix.rfind('class="content-page"')
    if content_pos >= 0:
        image_counts["article"] = image_counts.get("article", 0) + 1
        return "featured" if image_counts["article"] == 1 else "step"
    if 'class="recipe-image"' in prefix[-500:]:
        return "featured"
    return "card"


def transform_page(page: Path) -> tuple[int, int]:
    html = page.read_text(encoding="utf-8")
    original = html
    image_counts: dict[str, int] = {}
    transformed = 0
    lazy_added = 0
    replacements: list[tuple[int, int, str]] = []

    for match in IMG_RE.finditer(html):
        original_tag = match.group(0)
        tag = original_tag
        attrs = parse_attrs(tag)
        src = attrs.get("src", "")
        if not src:
            continue

        priority = attrs.get("fetchpriority", "").lower() == "high"
        if "loading" not in attrs:
            tag = add_attr(tag, "loading", "eager" if priority else "lazy")
            lazy_added += 0 if priority else 1
        if "decoding" not in attrs:
            tag = add_attr(tag, "decoding", "async")
        if priority and attrs.get("loading", "").lower() != "eager":
            tag = add_attr(tag, "loading", "eager")

        source = local_recipe_image(src, page)
        if source is None:
            if tag != original_tag:
                replacements.append((match.start(), match.end(), tag))
            continue

        role = choose_role(html, match.start(), image_counts)
        ensure_derivatives(source, role)
        config = ROLES[role]
        variants = ", ".join(
            f"/assets/images/recipes/{source.stem}-{role}-{width}.webp {width}w"
            for width, _height in config["sizes"]
        )
        fallback = f"/assets/images/recipes/{source.stem}-{role}.jpg"
        tag = replace_attr(tag, "src", fallback)
        width, height = config["fallback"]
        tag = replace_attr(tag, "width", str(width))
        tag = replace_attr(tag, "height", str(height))
        tag = add_attr(tag, "sizes", config["sizes_attr"])
        source_tag = (
            f'<source data-mrecipes-responsive="true" type="image/webp" '
            f'srcset="{escape(variants, quote=True)}" sizes="{escape(config["sizes_attr"], quote=True)}">'
        )
        prefix = html[max(0, match.start() - 250):match.start()].lower()
        already_in_picture = bool(re.search(r"<picture\b[^>]*>\s*$", prefix, re.I))
        if already_in_picture:
            picture_start = html.lower().rfind("<picture", 0, match.start())
            picture_chunk = html[picture_start:match.start()].lower()
            if "data-mrecipes-responsive" not in picture_chunk:
                replacements.append((match.start(), match.end(), tag))
                replacements.append((picture_start, picture_start, source_tag))
            else:
                replacements.append((match.start(), match.end(), tag))
        else:
            replacements.append((match.start(), match.end(), f"<picture>{source_tag}{tag}</picture>"))
        transformed += 1

    for start, end, value in sorted(replacements, reverse=True):
        html = html[:start] + value + html[end:]
    if html != original:
        page.write_text(html, encoding="utf-8")
    return transformed, lazy_added


def main() -> None:
    if not IMAGE_ROOT.is_dir():
        raise SystemExit(f"Missing recipe image directory: {IMAGE_ROOT}")
    pages = sorted(p for p in ROOT.rglob("*.html") if ".git" not in p.parts)
    total_images = 0
    lazy_images = 0
    for page in pages:
        count, lazy = transform_page(page)
        total_images += count
        lazy_images += lazy
    print(f"Responsive image build complete: optimized {total_images} local WebP references across {len(pages)} HTML pages; added lazy loading to {lazy_images} images.")


if __name__ == "__main__":
    main()
