#!/usr/bin/env python3
"""Create a lightweight, local SVG illustration for one recipe without external APIs."""
import html
import json
import os
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
SVG_NS = "http://www.w3.org/2000/svg"


def fail(message):
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def esc(value):
    return html.escape(str(value), quote=True)


def recipe_svg(name, description, ingredients):
    """Draw generic editorial food artwork; this is an illustration, not a photo."""
    text = " ".join([name, description, *ingredients]).lower()
    if any(word in text for word in ("pancake", "waffle", "crepe", "french toast")):
        palette = ("#fff4dc", "#d6a04d", "#b87938", "#8c512c", "#6b8e46")
        dish = "stack"
    elif any(word in text for word in ("salad", "lettuce", "kale", "spinach")):
        palette = ("#edf5df", "#79a95a", "#4f7d42", "#e7b85c", "#cf6f55")
        dish = "salad"
    elif any(word in text for word in ("soup", "stew", "broth", "chowder", "curry")):
        palette = ("#fff0d8", "#d98942", "#b95f35", "#e8bd62", "#71935a")
        dish = "bowl"
    elif any(word in text for word in ("cake", "brownie", "cookie", "muffin", "dessert")):
        palette = ("#f9e9df", "#b87859", "#8b503b", "#e8b76b", "#7b9655")
        dish = "cake"
    elif any(word in text for word in ("pasta", "spaghetti", "noodle", "macaroni")):
        palette = ("#fff1d9", "#e3b653", "#c9783b", "#b94d3e", "#66864a")
        dish = "pasta"
    else:
        palette = ("#f6eddf", "#d7a45d", "#b87948", "#71965a", "#c96f55")
        dish = "plate"

    bg, food, food_dark, accent, green = palette
    title = esc(name[:64])
    desc = esc((description or "Illustrated recipe artwork")[:180])
    garnish = []
    for i, (x, y, rx, ry, rotate) in enumerate([
        (510, 214, 48, 25, -18), (625, 198, 48, 24, 22),
        (570, 266, 54, 25, -8), (680, 250, 42, 22, 28),
        (465, 267, 38, 20, 16), (610, 305, 42, 19, -22),
        (530, 176, 35, 18, 30), (655, 292, 31, 16, -14),
    ]):
        fill = food if i % 3 else food_dark
        garnish.append(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" transform="rotate({rotate} {x} {y})" fill="{fill}"/>')
    greens = ''.join(
        f'<ellipse cx="{x}" cy="{y}" rx="15" ry="7" transform="rotate({a} {x} {y})" fill="{green}"/>'
        for x, y, a in [(490, 198, -30), (635, 235, 38), (550, 290, 22), (600, 170, -48), (680, 280, -20)]
    )
    if dish == "stack":
        food_art = (
            f'<ellipse cx="575" cy="323" rx="205" ry="42" fill="{food_dark}"/>'
            f'<ellipse cx="575" cy="293" rx="205" ry="44" fill="{food}"/>'
            f'<ellipse cx="575" cy="257" rx="190" ry="43" fill="{food_dark}"/>'
            f'<ellipse cx="575" cy="228" rx="190" ry="43" fill="{food}"/>'
            f'<ellipse cx="575" cy="194" rx="172" ry="39" fill="{food_dark}"/>'
            f'<ellipse cx="575" cy="168" rx="172" ry="39" fill="{food}"/>'
            f'<path d="M540 132 Q570 120 605 139 L592 172 L551 165Z" fill="#fff0b4"/>'
        )
    elif dish == "salad":
        food_art = ''.join(
            f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" transform="rotate({a} {x} {y})" fill="{c}"/>'
            for x, y, rx, ry, a, c in [
                (520, 220, 80, 34, -28, green), (610, 200, 83, 36, 28, food),
                (575, 258, 92, 38, -8, green), (660, 252, 65, 30, 25, accent),
                (485, 270, 52, 27, 30, food_dark), (590, 294, 65, 28, -20, green),
            ]
        ) + greens
    elif dish == "bowl":
        food_art = f'<path d="M390 215 Q575 145 760 215 L720 320 Q575 390 430 320Z" fill="{food_dark}"/><ellipse cx="575" cy="214" rx="185" ry="65" fill="{food}"/>' + ''.join(
            f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>'
            for x, y, r, c in [(500, 205, 18, accent), (550, 185, 13, green), (610, 220, 22, food_dark), (660, 192, 14, green), (580, 235, 12, "#fff0b4"), (530, 228, 10, food_dark)]
        )
    elif dish == "cake":
        food_art = f'<path d="M425 180 L690 180 L735 310 L470 310Z" fill="{food_dark}"/><path d="M425 180 L690 180 L690 220 L440 220Z" fill="{food}"/><path d="M440 220 L690 220 L710 270 L458 270Z" fill="{accent}"/><path d="M458 270 L710 270 L735 310 L470 310Z" fill="{food}"/><circle cx="565" cy="160" r="28" fill="{accent}"/><path d="M565 132 Q590 112 604 140" fill="none" stroke="{green}" stroke-width="10" stroke-linecap="round"/>'
    elif dish == "pasta":
        food_art = f'<ellipse cx="575" cy="240" rx="185" ry="105" fill="{food_dark}"/>' + ''.join(
            f'<path d="M{x} {y} q40 -45 75 0 t75 0" fill="none" stroke="{c}" stroke-width="17" stroke-linecap="round"/>'
            for x, y, c in [(445, 205, food), (470, 250, accent), (510, 180, food), (525, 280, food), (565, 220, accent), (590, 270, food), (620, 190, food), (635, 245, accent)]
        ) + greens
    else:
        food_art = ''.join(garnish) + greens

    svg = f'''<svg xmlns="{SVG_NS}" width="1200" height="525" viewBox="0 0 1200 525" role="img" aria-labelledby="title desc">
<title id="title">{title} — illustrated recipe artwork</title>
<desc id="desc">{desc}. Decorative vector illustration, not a photograph.</desc>
<defs><linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fffdf8"/><stop offset="1" stop-color="{bg}"/></linearGradient><linearGradient id="plate" x1="0" y1="0" x2="0.8" y2="1"><stop stop-color="#ffffff"/><stop offset="1" stop-color="#e7dfd2"/></linearGradient></defs>
<rect width="1200" height="525" rx="26" fill="url(#background)"/>
<circle cx="575" cy="244" r="218" fill="{food_dark}" opacity=".08"/>
<ellipse cx="575" cy="270" rx="226" ry="190" fill="url(#plate)" stroke="#e3d8c8" stroke-width="10"/>
<ellipse cx="575" cy="258" rx="190" ry="155" fill="{bg}" stroke="#eee3d2" stroke-width="5"/>
{food_art}
<path d="M100 70h120M100 88h70M980 75h120M1030 93h70" stroke="{accent}" stroke-width="5" stroke-linecap="round" opacity=".55"/>
<rect x="45" y="420" width="1110" height="72" rx="18" fill="#fffdf8" opacity=".96"/>
<text x="600" y="452" text-anchor="middle" font-family="Arial,sans-serif" font-size="25" font-weight="700" fill="#44382d">{title}</text>
<text x="600" y="475" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" letter-spacing="2.4" fill="#796b5b">ILLUSTRATED RECIPE ART</text>
</svg>'''
    # Ensure generated XML is well-formed before returning it.
    ET.fromstring(svg)
    return svg


def main():
    slug = os.environ.get("RECIPE_SLUG", "classic-pancakes").strip()
    force = os.environ.get("FORCE_REGENERATE", "false").lower() == "true"
    if not SLUG_RE.fullmatch(slug):
        fail("RECIPE_SLUG must be a lowercase recipe slug, e.g. classic-pancakes.")
    page = ROOT / "recipes" / f"{slug}.html"
    if not page.is_file():
        fail(f"Recipe page not found: recipes/{slug}.html")

    image_dir = ROOT / "assets" / "images" / "recipes"
    image_dir.mkdir(parents=True, exist_ok=True)
    image_path = image_dir / f"{slug}.svg"
    source = page.read_text(encoding="utf-8")
    if image_path.exists() and not force:
        print(f"SKIP: {image_path.relative_to(ROOT)} already exists; set FORCE_REGENERATE=true to replace it.")
        return

    match = re.search(
        r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        source, re.I | re.S
    )
    if not match:
        fail("Recipe page has no application/ld+json Recipe metadata.")
    try:
        recipe = json.loads(html.unescape(match.group(1)))
    except json.JSONDecodeError as exc:
        fail(f"Recipe JSON-LD is invalid: {exc}")
    if isinstance(recipe, list):
        recipe = next((item for item in recipe if isinstance(item, dict) and item.get("@type") == "Recipe"), None)
    if not isinstance(recipe, dict) or recipe.get("@type") != "Recipe":
        fail("JSON-LD does not contain a top-level Recipe object.")

    name = str(recipe.get("name", "")).strip()
    description = str(recipe.get("description", "")).strip()
    ingredients = recipe.get("recipeIngredient", [])
    if not name:
        fail("Recipe JSON-LD is missing its name.")
    ingredients = [str(item) for item in ingredients[:12]] if isinstance(ingredients, list) else []
    try:
        svg_text = recipe_svg(name, description, ingredients)
        svg_bytes = svg_text.encode("utf-8")
        ET.fromstring(svg_bytes)
    except Exception as exc:
        fail(f"SVG generation/validation failed: {exc}. No files were changed.")

    old_extensions = ("svg", "png", "jpg", "jpeg", "webp")
    updated = source
    for extension in old_extensions:
        updated = updated.replace(f"{slug}.{extension}", f"{slug}.svg")
    if updated == source and not image_path.exists():
        fail(f"No image reference for {slug} was found in recipes/{slug}.html; image not saved.")
    updated_match = re.search(
        r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        updated, re.I | re.S
    )
    try:
        json.loads(html.unescape(updated_match.group(1)))
    except (AttributeError, json.JSONDecodeError) as exc:
        fail(f"Updated recipe metadata failed validation: {exc}. No files were changed.")

    # Write only after recipe data, SVG XML, and updated JSON-LD have all validated.
    image_path.write_bytes(svg_bytes)
    page.write_text(updated, encoding="utf-8")
    print(f"SUCCESS: created {image_path.relative_to(ROOT)} ({len(svg_bytes)} bytes)")
    if updated != source:
        print(f"SUCCESS: updated image references in recipes/{slug}.html")
    print("NOTE: this is local vector artwork, not an AI-generated photograph.")


if __name__ == "__main__":
    main()
