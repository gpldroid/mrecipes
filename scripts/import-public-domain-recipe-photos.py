#!/usr/bin/env python3
"""Fetch public-domain recipe photos and switch local SVG illustration references to local WebP files."""
from pathlib import Path
from urllib.request import Request, urlopen
import re

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://raw.githubusercontent.com/ronaldl29/public-domain-recipes/main/static/pix/"
DEST = ROOT / "assets/images/recipes"

# The upstream repository explicitly dedicates its content to the public domain (Unlicense).
# Every source filename below exists in its static/pix directory.
PHOTO_MAP = {
    "avocado-toast": "guacamole.webp",
    "beef-vegetable-stir-fry": "teriyaki-beef.webp",
    "blueberry-muffins": "banana-muffins.webp",
    "cauliflower-cheese-bake": "baked-pasta-with-broccoli.webp",
    "chicken-broccoli-mash": "lemon-and-oregano-chicken-traybake.webp",
    "chicken-curry-rice": "butter-chicken-masala.webp",
    "chicken-fried-rice": "arroz-chaufa.webp",
    "chicken-tomato-stew": "apple-chicken.webp",
    "chocolate-chip-cookies": "chocolate-chip-cookies.webp",
    "classic-pancakes": "pancake.webp",
    "creamy-garlic-chicken": "pan-seared-chicken.webp",
    "creamy-garlic-parmesan-chicken": "pan-seared-chicken.webp",
    "creamy-pasta": "cacio-e-pepe.webp",
    "creamy-tomato-tortellini-soup": "stracciatella-soup.webp",
    "crispy-baked-chicken-thighs": "honey-sriracha-chicken-thighs.webp",
    "crispy-oven-potato-wedges": "sweet-potato-fries.webp",
    "easy-chickpea-curry": "fall-vegetable-and-chickpea-curry.webp",
    "easy-fudgy-brownies": "lavacake.webp",
    "easy-shakshuka": "shakshouka.webp",
    "fresh-greek-salad": "csalad.webp",
    "garlic-butter-pasta": "pasta-arrabbiata.webp",
    "ground-beef-tacos": "quesadilla.webp",
    "homemade-margherita-pizza": "herbs-pizza.webp",
    "juicy-baked-chicken-breast": "pan-seared-chicken.webp",
    "lemon-garlic-shrimp-pasta": "pasta-navy-style.webp",
    "lemon-herb-lentil-salad": "lenten-lentil-curry.webp",
    "marry-me-chicken": "lemon-and-oregano-chicken-traybake.webp",
    "mediterranean-pasta": "baked-mostaccioli.webp",
    "moist-banana-bread": "coconutbread-lufemas.webp",
    "no-bake-chocolate-oat-bars": "tahini-short-bread.webp",
    "one-pot-chicken-orzo": "chicken-pasta-casserole.webp",
    "overnight-oats": "hearty-breakfast-oatmeal.webp",
    "roasted-chickpea-bowl": "hummus.webp",
    "roasted-vegetable-salad": "stuffed-vegetables.webp",
    "scrambled-eggs-on-toast": "eggs-benedict.webp",
    "spaghetti-pasta": "spaghetti-all-amatriciana.webp",
    "stuffed-bell-peppers": "ardei-umpluti.webp",
    "tomato-pasta-soup": "tomato-flavored-hamburger-macaroni.webp",
}

def main():
    DEST.mkdir(parents=True, exist_ok=True)
    for slug, source_name in PHOTO_MAP.items():
        target = DEST / f"{slug}.webp"
        if not target.exists():
            req = Request(BASE + source_name, headers={"User-Agent": "MRecipes-image-import/1.0"})
            with urlopen(req, timeout=30) as response:
                data = response.read()
            if not data.startswith(b"RIFF") or data[8:12] != b"WEBP":
                raise RuntimeError(f"Downloaded file is not valid WebP: {source_name}")
            target.write_bytes(data)
        if target.stat().st_size < 1000:
            raise RuntimeError(f"Image unexpectedly small: {target}")

    # Replace image references throughout published HTML and data files.
    candidates = []
    for pattern in ("*.html", "*.js", "*.json", "*.xml"):
        candidates.extend(p for p in ROOT.rglob(pattern) if ".git" not in p.parts and "scripts" not in p.parts)
    for page in candidates:
        try:
            original = page.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        updated = original
        for slug in PHOTO_MAP:
            updated = updated.replace(f"/assets/images/recipes/{slug}.svg", f"/assets/images/recipes/{slug}.webp")
            updated = updated.replace(f"assets/images/recipes/{slug}.svg", f"assets/images/recipes/{slug}.webp")
        updated = re.sub(r"Original illustration of ", "Photo of ", updated, flags=re.I)
        if updated != original:
            page.write_text(updated, encoding="utf-8")

    print(f"Downloaded/verified {len(PHOTO_MAP)} public-domain WebP recipe photos and rewrote local references.")

if __name__ == "__main__":
    main()
