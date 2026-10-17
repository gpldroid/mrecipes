#!/usr/bin/env python3
"""Fetch public-domain food photography and replace recipe image assets/references."""
from pathlib import Path
from urllib.request import Request, urlopen
import re

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://raw.githubusercontent.com/ronaldl29/public-domain-recipes/main/static/pix/"
# Both upstream recipe-photo collections are public domain (Unlicense). Prefer a
# filename matching the recipe slug; fall back to the curated source map if absent.
EXACT_PHOTO_SOURCES = (
    "https://raw.githubusercontent.com/lukesmithxyz/based.cooking/master/pix/",
    "https://raw.githubusercontent.com/lukesmithxyz/based.cooking/main/pix/",
    BASE,
)
DEST = ROOT / "assets/images/recipes"

# The upstream repository explicitly dedicates its content to the public domain (Unlicense).
# Every source filename below exists in its static/pix directory.
PHOTO_MAP = {
    # Exact or closest available dish photo from the upstream Unlicense/public-domain collection.
    "avocado-toast": "guacamole.webp",
    "beef-vegetable-stir-fry": "teriyaki-beef.webp",
    "blueberry-muffins": "banana-muffins.webp",
    "cauliflower-cheese-bake": "baked-pasta-with-broccoli.webp",
    "chicken-broccoli-mash": "pan-seared-chicken.webp",
    "chicken-curry-rice": "butter-chicken-masala.webp",
    "chicken-fried-rice": "arroz-chaufa.webp",
    "chicken-tomato-stew": "apple-chicken.webp",
    "chocolate-chip-cookies": "chocolate-chip-cookies.webp",
    "classic-pancakes": "pancake.webp",
    "creamy-garlic-chicken": "lemon-and-oregano-chicken-traybake.webp",
    "creamy-garlic-parmesan-chicken": "asian-style-chicken-sticky-sauce.webp",
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
    "marry-me-chicken": "chicken-pasta-casserole.webp",
    "mediterranean-pasta": "baked-mostaccioli.webp",
    "moist-banana-bread": "coconutbread-lufemas.webp",
    "no-bake-chocolate-oat-bars": "tahini-short-bread.webp",
    "one-pot-chicken-orzo": "baked-rice.webp",
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
        # Prefer exact recipe-named photos from a second public-domain source.
        # If unavailable, try the explicitly curated photo mapping and then the
        # direct slug in the first collection. Failed candidates never break the
        # build while a valid mapped image is available.
        candidates = [base + f"{slug}.webp" for base in EXACT_PHOTO_SOURCES[:2]]
        candidates.extend([BASE + source_name, BASE + f"{slug}.webp"])
        data = None
        failures = []
        for url in dict.fromkeys(candidates):
            try:
                req = Request(url, headers={"User-Agent": "MRecipes-image-import/1.0"})
                with urlopen(req, timeout=20) as response:
                    candidate_data = response.read()
                if candidate_data.startswith(b"RIFF") and candidate_data[8:12] == b"WEBP" and len(candidate_data) >= 1000:
                    data = candidate_data
                    break
                failures.append(f"{url}: invalid WebP")
            except Exception as exc:
                failures.append(f"{url}: {exc}")
        if data is None:
            raise RuntimeError(f"No valid public-domain photo found for {slug}: " + " | ".join(failures))
        target.write_bytes(data)

    # Make real photos visible in recipe cards throughout the site, not only on
    # the full recipe article. Filenames always use the local recipe slug.
    card_pattern = re.compile(
        r"(<a\b(?=[^>]*class=['\"][^'\"]*\brecipe-image\b[^'\"]*['\"])"
        r"(?=[^>]*href=['\"][^'\"]*/recipes/([^/'\"]+)\.html['\"])[^>]*>)(.*?)(</a>)",
        re.I | re.S,
    )
    for page in ROOT.rglob("*.html"):
        if ".git" in page.parts or "scripts" in page.parts:
            continue
        try:
            original = page.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        def card_image(match):
            opening, slug, inner, closing = match.groups()
            if slug not in PHOTO_MAP:
                return match.group(0)
            label_match = re.search(r"aria-label=['\"]([^'\"]+)['\"]", opening, re.I)
            alt = label_match.group(1) if label_match else slug.replace("-", " ").title()
            alt = re.sub(r"\s+recipe$", "", alt, flags=re.I)
            image = (f'<img src="/assets/images/recipes/{slug}.webp" '
                     f'alt="{alt}" width="1200" height="900" loading="lazy" decoding="async">')
            return opening + image + closing
        updated = card_pattern.sub(card_image, original)
        if updated != original:
            page.write_text(updated, encoding="utf-8")

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

    print(f"Downloaded/replaced {len(PHOTO_MAP)} public-domain WebP recipe photos and rewrote local references.")

if __name__ == "__main__":
    main()
