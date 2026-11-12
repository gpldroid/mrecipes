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
        self.schemas: list[dict] = []
        self._json = False
        self._parts: list[str] = []
    def handle_starttag(self, tag, attrs) -> None:
        attrs = dict(attrs)
        if tag == "link" and "canonical" in (attrs.get("rel") or "").lower().split():
            self.canonical = (attrs.get("href") or "").strip()
        if tag == "script" and (attrs.get("type") or "").lower() == "application/ld+json":
            self._json = True
            self._parts = []
    def handle_data(self, data: str) -> None:
        if self._json:
            self._parts.append(data)
    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self._json:
            raw = "".join(self._parts).strip()
            if raw:
                try:
                    self.schemas.append(json.loads(raw))
                except json.JSONDecodeError as exc:
                    raise SystemExit(f"Invalid JSON-LD: {exc}") from exc
            self._json = False
            self._parts = []

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
    updated = 0
    for page in sorted(ROOT.rglob("*.html")):
        if ".git" in page.parts or not is_recipe_page(page):
            continue
        html = page.read_text(encoding="utf-8")
        parser = Metadata()
        parser.feed(html)
        if not parser.canonical or not parser.canonical.startswith(DOMAIN + "/"):
            raise SystemExit(f"{page}: missing or invalid canonical URL")
        recipe_nodes = [node for schema in parser.schemas for node in walk(schema)]
        if not recipe_nodes:
            raise SystemExit(f"{page}: missing Recipe JSON-LD")
        for node in recipe_nodes:
            node["author"] = {"@type": "Person", "name": "Imad Limrani"}
            node["publisher"] = {
                "@type": "Organization",
                "@id": DOMAIN + "/#organization",
                "name": "MRecipes",
                "url": DOMAIN + "/",
            }
            node["url"] = parser.canonical
            node["mainEntityOfPage"] = {"@type": "WebPage", "@id": parser.canonical}
            node["inLanguage"] = locale_for(page)
        pattern = re.compile(
            r'(<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>)(.*?)(</script\s*>)',
            re.IGNORECASE | re.DOTALL,
        )
        def replace(match: re.Match[str]) -> str:
            data = json.loads(match.group(2).strip())
            if list(walk(data)):
                return match.group(1) + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + match.group(3)
            return match.group(0)
        html = pattern.sub(replace, html)
        page.write_text(html, encoding="utf-8")
        updated += 1
    print(f"Recipe schema identity/publisher enhancement passed: {updated} recipe pages.")
    if updated == 0:
        raise SystemExit("No recipe pages were found.")

if __name__ == "__main__":
    main()
