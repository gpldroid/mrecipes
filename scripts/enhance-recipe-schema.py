#!/usr/bin/env python3
"""Normalize Recipe JSON-LD identity and publisher fields across all locales."""
from __future__ import annotations
import json
import re
from html import unescape
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOMAIN = "https://mrecipes.online"
LOCALES = {"ar", "fr", "es", "ru"}

class Metadata(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.canonical = ""
    def handle_starttag(self, tag, attrs) -> None:
        attrs = dict(attrs)
        if tag == "link" and "canonical" in (attrs.get("rel") or "").lower().split():
            self.canonical = (attrs.get("href") or "").strip()

def walk(value):
    if isinstance(value, list):
        for item in value:
            yield from walk(item)
    elif isinstance(value, dict):
        types = value.get("@type", [])
        if isinstance(types, str):
            types = [types]
        if "Recipe" in types:
            yield value
        for key, child in value.items():
            if key != "@context":
                yield from walk(child)

def locale_for(path: Path) -> str:
    parts = path.relative_to(ROOT).parts
    return parts[0] if parts and parts[0] in LOCALES else "en"

def is_recipe_page(path: Path) -> bool:
    rel = path.relative_to(ROOT).as_posix()
    return (rel.startswith("recipes/") and rel.endswith(".html")
            and rel not in ("recipes/recipe-template.html", "recipes/index.html")) or rel.startswith("ar/article/") and rel.endswith(".html")

def clean_text(value: str) -> str:
    return unescape(re.sub(r"\\s+", " ", re.sub(r"<[^>]+>", " ", value))).strip()

def list_after_heading(html: str, heading_terms: tuple[str, ...], list_tag: str) -> list[str]:
    pattern = re.compile(
        r"<h[23]\\b[^>]*>(.*?)</h[23]>\\s*<" + re.escape(list_tag) + r"\\b[^>]*>(.*?)</" + re.escape(list_tag) + r">",
        re.IGNORECASE | re.DOTALL,
    )
    for match in pattern.finditer(html):
        heading = clean_text(match.group(1)).casefold()
        if not any(term.casefold() in heading for term in heading_terms):
            continue
        items = [clean_text(item) for item in re.findall(r"<li\\b[^>]*>(.*?)</li>", match.group(2), re.I | re.S)]
        items = [item for item in items if item]
        if items:
            return items
    return []

def enrich_from_visible_content(node: dict, html: str, page: Path) -> None:
    if not node.get("recipeIngredient"):
        ingredients = list_after_heading(html, ("ingredients", "المكونات", "المقادير"), "ul")
        if ingredients:
            node["recipeIngredient"] = ingredients
    if not node.get("recipeInstructions"):
        steps = list_after_heading(html, ("instructions", "method", "طريقة التحضير", "الطريقة"), "ol")
        if steps:
            node["recipeInstructions"] = [
                {"@type": "HowToStep", "position": index + 1, "text": step}
                for index, step in enumerate(steps)
            ]
    meta = re.search(r'<[^>]+class=["\\'][^"\\']*recipe-meta[^"\\']*["\\'][^>]*>(.*?)</div>', html, re.I | re.S)
    meta_text = clean_text(meta.group(1)) if meta else ""
    if not node.get("prepTime"):
        match = re.search(r"(?:prep(?:aration)?\\s*:?\\s*)(\\d+)\\s*(?:min|minutes?)", meta_text, re.I)
        if match:
            node["prepTime"] = f"PT{match.group(1)}M"
    if not node.get("cookTime"):
        match = re.search(r"(?:cook(?:ing)?\\s*:?\\s*)(\\d+)\\s*(?:min|minutes?)", meta_text, re.I)
        if match:
            node["cookTime"] = f"PT{match.group(1)}M"
    if not node.get("totalTime") and node.get("prepTime") and node.get("cookTime"):
        prep = int(re.search(r"(\\d+)", node["prepTime"]).group(1))
        cook = int(re.search(r"(\\d+)", node["cookTime"]).group(1))
        node["totalTime"] = f"PT{prep + cook}M"
    if not node.get("recipeYield"):
        match = re.search(r"(?:serves|yield|makes)\\s*:?\\s*(\\d+)", meta_text, re.I)
        if match:
            node["recipeYield"] = f"{match.group(1)} servings"
    if not node.get("recipeCategory"):
        eyebrow = re.search(r'<span[^>]*class=["\\'][^"\\']*eyebrow[^"\\']*["\\'][^>]*>(.*?)</span>', html, re.I | re.S)
        if eyebrow:
            category = clean_text(eyebrow.group(1)).split("·", 1)[0].strip()
            if category:
                node["recipeCategory"] = category

def main() -> None:
    updated_pages = 0
    updated_nodes = 0
    pattern = re.compile(
        r'(<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>)(.*?)(</script\s*>)',
        re.IGNORECASE | re.DOTALL,
    )
    for page in sorted(ROOT.rglob("*.html")):
        if ".git" in page.parts or not is_recipe_page(page):
            continue
        html = page.read_text(encoding="utf-8")
        metadata = Metadata()
        metadata.feed(html)
        canonical = metadata.canonical
        if not canonical or not canonical.startswith(DOMAIN + "/"):
            raise SystemExit(f"{page}: missing or invalid canonical URL")
        page_nodes = 0
        def replace(match: re.Match[str]) -> str:
            nonlocal page_nodes
            try:
                data = json.loads(match.group(2).strip())
            except json.JSONDecodeError as exc:
                raise SystemExit(f"{page}: invalid JSON-LD: {exc}") from exc
            nodes = list(walk(data))
            if not nodes:
                return match.group(0)
            for node in nodes:
                if locale_for(page) == "ar":
                    enrich_from_visible_content(node, html, page)
                node["author"] = {"@type": "Person", "name": "Imad Limrani"}
                node["publisher"] = {
                    "@type": "Organization",
                    "@id": DOMAIN + "/#organization",
                    "name": "MRecipes",
                    "url": DOMAIN + "/",
                }
                node["url"] = canonical
                node["mainEntityOfPage"] = {"@type": "WebPage", "@id": canonical}
                node["inLanguage"] = locale_for(page)
            page_nodes += len(nodes)
            return match.group(1) + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + match.group(3)
        html = pattern.sub(replace, html)
        if not page_nodes:
            if page.relative_to(ROOT).as_posix().startswith("ar/article/"):
                # Arabic article pages generate their Recipe node in ar-recipes.js.
                continue
            raise SystemExit(f"{page}: missing Recipe JSON-LD")
        page.write_text(html, encoding="utf-8")
        updated_pages += 1
        updated_nodes += page_nodes
    # Arabic recipe pages inject JSON-LD from this shared browser-side generator.
    # Enrich that generator instead of falsely expecting a static script in each HTML file.
    arabic_js = ROOT / "assets" / "js" / "ar-recipes.js"
    if not arabic_js.is_file():
        raise SystemExit("Missing Arabic dynamic Recipe JSON-LD generator: assets/js/ar-recipes.js")
    js = arabic_js.read_text(encoding="utf-8")
    marker = "'author':{'@type':'Person','name':'Imad Limrani'},\n'inLanguage':'ar',"
    replacement = (
        "'author':{'@type':'Person','name':'Imad Limrani'},\n"
        "'publisher':{'@type':'Organization','@id':DOMAIN_PLACEHOLDER,'name':'MRecipes','url':'https://mrecipes.online/'},\n"
        "'url':canonical,\n"
        "'inLanguage':'ar',"
    ).replace("DOMAIN_PLACEHOLDER", "'https://mrecipes.online/#organization'")
    if marker in js:
        js = js.replace(marker, replacement, 1)
        arabic_js.write_text(js, encoding="utf-8")
    elif "'publisher':{'@type':'Organization'" not in js or "'url':canonical" not in js:
        raise SystemExit("Arabic dynamic Recipe JSON-LD generator has an unexpected schema shape.")
    print(f"Recipe schema identity/publisher enhancement passed: {updated_nodes} static Recipe nodes across {updated_pages} pages; Arabic dynamic schema generator checked.")
    if updated_pages == 0:
        raise SystemExit("No recipe pages were found.")

if __name__ == "__main__":
    main()
