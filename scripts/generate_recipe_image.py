#!/usr/bin/env python3
"""Generate one recipe image using Gemini, then update only that recipe page."""
import base64
import html
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def fail(message):
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def request_json(url, payload, api_key):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        # Do not print request headers or secrets.
        detail = exc.read().decode("utf-8", "replace")[:1200]
        fail(f"Gemini API returned HTTP {exc.code}: {detail}")
    except (urllib.error.URLError, TimeoutError) as exc:
        fail(f"Gemini API request failed: {exc}")


def main():
    slug = os.environ.get("RECIPE_SLUG", "classic-pancakes").strip()
    force = os.environ.get("FORCE_REGENERATE", "false").lower() == "true"
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not SLUG_RE.fullmatch(slug):
        fail("RECIPE_SLUG must be a lowercase recipe slug, e.g. classic-pancakes.")
    if not api_key:
        fail("Missing GEMINI_API_KEY. Add it in GitHub repository Actions secrets.")
    page = ROOT / "recipes" / f"{slug}.html"
    if not page.is_file():
        fail(f"Recipe page not found: recipes/{slug}.html")

    image_dir = ROOT / "assets" / "images" / "recipes"
    image_dir.mkdir(parents=True, exist_ok=True)
    image_path = image_dir / f"{slug}.png"
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
        recipe = next((item for item in recipe if item.get("@type") == "Recipe"), None)
    if not isinstance(recipe, dict) or recipe.get("@type") != "Recipe":
        fail("JSON-LD does not contain a top-level Recipe object.")

    name = str(recipe.get("name", "")).strip()
    description = str(recipe.get("description", "")).strip()
    ingredients = recipe.get("recipeIngredient", [])
    if not name:
        fail("Recipe JSON-LD is missing its name.")
    ingredients_text = "; ".join(str(x) for x in ingredients[:12]) if isinstance(ingredients, list) else ""
    prompt = (
        "Create a premium, photorealistic editorial food photograph for a recipe website. "
        f"Dish: {name}. Description: {description}. Ingredients: {ingredients_text}. "
        "Show only the finished edible dish, accurately reflecting the named recipe and ingredients. "
        "Natural soft window light, appetizing realistic food texture, tasteful neutral tabletop, "
        "professional food photography, 16:7 wide landscape composition with the dish centered and "
        "safe margins for responsive cropping. No text, no letters, no watermark, no logo, no collage, "
        "no hands, no packaging, no decorative ingredients that contradict the recipe."
    )
    model = os.environ.get("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image").strip()
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    result = request_json(endpoint, {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }, api_key)

    candidates = result.get("candidates") or []
    parts = (candidates[0].get("content") or {}).get("parts") or [] if candidates else []
    image_part = next((p.get("inlineData") or p.get("inline_data")
                       for p in parts if p.get("inlineData") or p.get("inline_data")), None)
    if not image_part:
        fail("Gemini returned no image data. No files were changed.")
    mime = image_part.get("mimeType") or image_part.get("mime_type") or ""
    if mime not in ("image/png", "image/jpeg", "image/webp"):
        fail(f"Unexpected image MIME type: {mime or 'missing'}. No files were changed.")
    try:
        image_bytes = base64.b64decode(image_part["data"], validate=True)
    except (KeyError, ValueError):
        fail("Gemini image payload was invalid. No files were changed.")
    signatures = {
        "image/png": b"\x89PNG\r\n\x1a\n",
        "image/jpeg": b"\xff\xd8\xff",
        "image/webp": b"RIFF",
    }
    if len(image_bytes) < 10 or not image_bytes.startswith(signatures[mime]):
        fail("Image bytes failed signature validation. No files were changed.")
    # Normalize the extension to the actual returned format.
    extension = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp"}[mime]
    target = image_dir / f"{slug}.{extension}"
    if target.exists() and not force:
        fail(f"Refusing to overwrite existing {target.relative_to(ROOT)} without FORCE_REGENERATE=true.")
    old_extensions = ("svg", "png", "jpg", "jpeg", "webp")
    old_refs = [f"{slug}.{ext}" for ext in old_extensions]
    updated = source
    for old_ref in old_refs:
        updated = updated.replace(old_ref, f"{slug}.{extension}")
    if updated == source:
        fail(f"No image reference for {slug} was found in the recipe page; image not saved.")
    # Validate JSON-LD remains parseable after changing the image reference.
    updated_match = re.search(
        r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        updated, re.I | re.S
    )
    try:
        json.loads(html.unescape(updated_match.group(1)))
    except (AttributeError, json.JSONDecodeError) as exc:
        fail(f"Updated recipe metadata failed validation: {exc}")

    # Only write after generation and all validation checks succeed.
    image_path = target
    image_path.write_bytes(image_bytes)
    page.write_text(updated, encoding="utf-8")
    print(f"SUCCESS: generated {image_path.relative_to(ROOT)} ({len(image_bytes)} bytes)")
    print(f"SUCCESS: updated image references in recipes/{slug}.html")
    print("Review the image before merging the pull request.")


if __name__ == "__main__":
    main()
