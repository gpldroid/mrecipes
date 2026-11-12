#!/usr/bin/env python3
"""Normalize Recipe JSON-LD identity and publisher fields across all locales."""
from __future__ import annotations
import json
import re
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
            and rel != "recipes/recipe-template.html") or any(
        rel.startswith(f"{locale}/article/") and rel.endswith(".html")
        for locale in LOCALES
    )

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
            raise SystemExit(f"{page}: missing Recipe JSON-LD")
        page.write_text(html, encoding="utf-8")
        updated_pages += 1
        updated_nodes += page_nodes
    print(f"Recipe schema identity/publisher enhancement passed: {updated_nodes} Recipe nodes across {updated_pages} pages.")
    if updated_pages == 0:
        raise SystemExit("No recipe pages were found.")

if __name__ == "__main__":
    main()
