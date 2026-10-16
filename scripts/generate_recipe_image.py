#!/usr/bin/env python3
"""Generate one recipe image with Cloudflare Workers AI and update its page."""
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
MODEL_DEFAULT = "@cf/black-forest-labs/flux-1-schnell"


def fail(message):
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def request_image(url, payload, token):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=240) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")[:1000]
        if token:
            detail = detail.replace(token, "[REDACTED]")
        fail(f"Cloudflare Workers AI returned HTTP {exc.code}: {detail}")
    except (urllib.error.URLError, TimeoutError) as exc:
        fail(f"Cloudflare Workers AI request failed: {exc}")

    if not result.get("success", False):
        errors = json.dumps(result.get("errors", []), ensure_ascii=False)[:1000]
        fail(f"Cloudflare Workers AI reported an error: {errors}")
    image_data = (result.get("result") or {}).get("image")
    if not isinstance(image_data, str) or not image_data:
        fail("Cloudflare returned no image data. No files were changed.")
    try:
        image_bytes = base64.b64decode(image_data, validate=True)
    except ValueError:
        fail("Cloudflare returned invalid base64 image data. No files were changed.")
    if len(image_bytes) < 10 or not image_bytes.startswith(b"\xff\xd8\xff"):
        fail("Cloudflare image bytes were not a valid JPEG signature. No files were changed.")
    return image_bytes


def main():
    slug = os.environ.get("RECIPE_SLUG", "classic-pancakes").strip()
    force = os.environ.get("FORCE_REGENERATE", "false").lower() == "true"
    token = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()
    account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()
    if not SLUG_RE.fullmatch(slug):
        fail("RECIPE_SLUG must be a lowercase recipe slug, e.g. classic-pancakes.")
    if not token or not account_id:
        fail("Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID GitHub Actions secret.")
    page = ROOT / "recipes" / f"{slug}.html"
    if not page.is_file():
        fail(f"Recipe page not found: recipes/{slug}.html")

    image_dir = ROOT / "assets" / "images" / "recipes"
    image_dir.mkdir(parents=True, exist_ok=True)
    image_path = image_dir / f"{slug}.jpg"
    source = page.read_text(encoding="utf-8")
    if image_path.exists() and not force:
        print(f"SKIP: {image_path.relative_to(ROOT)} already exists; set FORCE_REGENERATE=true to replace it.")
        return

    match = re.search(
        r"""<script\b[^>]*type=["']application/ld\+json["'][^>]*>(.*?)</script>""",
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
    ingredients_text = "; ".join(str(x) for x in ingredients[:12]) if isinstance(ingredients, list) else ""
    prompt = (
        "Create a premium, photorealistic editorial food photograph for a recipe website. "
        f"Dish: {name}. Description: {description}. Ingredients: {ingredients_text}. "
        "Show only the finished edible dish, accurately reflecting the named recipe and ingredients. "
        "Natural soft window light, appetizing realistic food texture, tasteful neutral tabletop, "
        "professional food photography, wide landscape composition with the dish centered and "
        "safe margins for responsive cropping. No text, no letters, no watermark, no logo, no collage, "
        "no hands, no packaging, no decorative ingredients that contradict the recipe."
    )
    model = os.environ.get("CLOUDFLARE_IMAGE_MODEL", MODEL_DEFAULT).strip()
    endpoint = (
        "https://api.cloudflare.com/client/v4/accounts/"
        f"{account_id}/ai/run/{model}"
    )
    print(f"Generating one image with Cloudflare Workers AI model {model}...")
    image_bytes = request_image(endpoint, {"prompt": prompt, "steps": 4}, token)

    target = image_dir / f"{slug}.jpg"
    if target.exists() and not force:
        fail(f"Refusing to overwrite existing {target.relative_to(ROOT)} without FORCE_REGENERATE=true.")
    old_refs = [f"{slug}.{ext}" for ext in ("svg", "png", "jpg", "jpeg", "webp")]
    updated = source
    for old_ref in old_refs:
        updated = updated.replace(old_ref, f"{slug}.jpg")
    if updated == source:
        fail(f"No image reference for {slug} was found in the recipe page; image not saved.")
    updated_match = re.search(
        r"""<script\b[^>]*type=["']application/ld\+json["'][^>]*>(.*?)</script>""",
        updated, re.I | re.S
    )
    try:
        json.loads(html.unescape(updated_match.group(1)))
    except (AttributeError, json.JSONDecodeError) as exc:
        fail(f"Updated recipe metadata failed validation: {exc}")

    # Write only after successful generation and all validation checks.
    target.write_bytes(image_bytes)
    page.write_text(updated, encoding="utf-8")
    print(f"SUCCESS: generated {target.relative_to(ROOT)} ({len(image_bytes)} bytes)")
    print(f"SUCCESS: updated image references in recipes/{slug}.html")
    print("Review the image before merging the pull request.")


if __name__ == "__main__":
    main()
