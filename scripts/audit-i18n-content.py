#!/usr/bin/env python3
"""Audit multilingual article completeness without modifying any source files.

Run from the repository root:
    python3 scripts/audit-i18n-content.py
The report is written to stdout. This is a diagnostic tool; it intentionally
does not rewrite, delete, or normalize existing HTML.
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter, defaultdict
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SITEMAP = ROOT / "sitemap.xml"
DOMAIN = "https://mrecipes.online"
LOCALES = ("en", "ar", "fr", "es", "ru")
MIN_TEXT_RATIO = 0.55
ENGLISH_RESIDUE = re.compile(
    r"\b(?:light|divided|for apples|cold|cubed|peeled and diced small|"
    r"primary keyword|home baking|recipe at a glance|serves|prep time|"
    r"cook time|helpful tips|storage and make-ahead|what to serve with it)\b",
    re.IGNORECASE,
)


class VisibleText(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.hidden_depth = 0

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag in ("script", "style", "noscript", "template"):
            self.hidden_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if tag in ("script", "style", "noscript", "template") and self.hidden_depth:
            self.hidden_depth -= 1

    def handle_data(self, data: str) -> None:
        if not self.hidden_depth:
            self.parts.append(data)


def visible_text(html: str) -> str:
    parser = VisibleText()
    parser.feed(html)
    return re.sub(r"\s+", " ", " ".join(parser.parts)).strip()


def get_attr(html: str, pattern: str) -> str:
    match = re.search(pattern, html, re.IGNORECASE | re.DOTALL)
    return match.group(1).strip() if match else ""


def recipe_schema(html: str) -> dict:
    for match in re.finditer(
        r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        html,
        re.IGNORECASE | re.DOTALL,
    ):
        try:
            data = json.loads(match.group(1))
        except json.JSONDecodeError:
            continue
        candidates = data if isinstance(data, list) else [data]
        for candidate in candidates:
            if isinstance(candidate, dict) and candidate.get("@type") == "Recipe":
                return candidate
            if isinstance(candidate, dict) and isinstance(candidate.get("@graph"), list):
                for item in candidate["@graph"]:
                    if isinstance(item, dict) and item.get("@type") == "Recipe":
                        return item
    return {}


def local_path(url: str) -> Path:
    path = urlparse(url).path.lstrip("/")
    if not path:
        path = "index.html"
    return ROOT / path


def route_for(locale: str, slug: str) -> str:
    return f"recipes/{slug}.html" if locale == "en" else f"{locale}/article/{slug}.html"


def main() -> int:
    if not SITEMAP.exists():
        print("ERROR: sitemap.xml not found", file=sys.stderr)
        return 2

    tree = ET.parse(SITEMAP)
    urls = [
        node.text.strip()
        for node in tree.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc")
        if node.text and node.text.strip().startswith(DOMAIN)
    ]
    paths = {urlparse(url).path.lstrip("/") or "index.html": url for url in urls}
    recipe_paths: dict[str, dict[str, str]] = defaultdict(dict)
    locale_counts: Counter[str] = Counter()
    issues: list[tuple[str, str]] = []

    for path, url in paths.items():
        if path.startswith(("ar/", "fr/", "es/", "ru/")):
            locale = path.split("/", 1)[0]
        else:
            locale = "en"
        locale_counts[locale] += 1
        match = re.fullmatch(r"(?:recipes/|(?:ar|fr|es|ru)/article/)([^/]+)\.html", path)
        if match:
            slug = match.group(1)
            recipe_paths[slug][locale] = path

    print("# Multilingual content audit")
    print()
    print(f"- Sitemap URLs checked: **{len(urls)}**")
    print("- Supported locales: **EN, AR, FR, ES, RU**")
    print("- This script is read-only; it never changes HTML.")
    print()
    print("## Sitemap coverage")
    print()
    print("| Locale | URLs in sitemap | Recipe articles |")
    print("|---|---:|---:|")
    for locale in LOCALES:
        article_count = sum(locale in entries for entries in recipe_paths.values())
        print(f"| {locale.upper()} | {locale_counts[locale]} | {article_count} |")
    print()

    print("## Article completeness")
    print()
    print("| Slug | Locale | Visible text chars | vs EN | Ingredients | Steps | Findings |")
    print("|---|---|---:|---:|---:|---:|---|")
    missing_pages = 0
    low_text_pages = 0
    residue_pages = 0
    schema_mismatch_pages = 0

    for slug in sorted(recipe_paths):
        source_path = ROOT / recipe_paths[slug].get("en", route_for("en", slug))
        source_html = source_path.read_text(encoding="utf-8") if source_path.exists() else ""
        source_len = len(visible_text(source_html))
        source_schema = recipe_schema(source_html)
        source_ingredients = len(source_schema.get("recipeIngredient", []))
        source_steps = len(source_schema.get("recipeInstructions", []))

        for locale in LOCALES:
            rel = recipe_paths[slug].get(locale)
            if not rel:
                missing_pages += 1
                issues.append((f"{locale.upper()} {slug}", "missing page from sitemap mapping"))
                print(f"| {slug} | {locale.upper()} | 0 | — | 0 | 0 | MISSING PAGE |")
                continue

            path = ROOT / rel
            if not path.exists():
                missing_pages += 1
                issues.append((f"{locale.upper()} {slug}", "file missing from checkout"))
                print(f"| {slug} | {locale.upper()} | 0 | — | 0 | 0 | FILE MISSING |")
                continue

            html = path.read_text(encoding="utf-8")
            text = visible_text(html)
            ratio = (len(text) / source_len) if source_len else 0
            schema = recipe_schema(html)
            ingredients = len(schema.get("recipeIngredient", []))
            steps = len(schema.get("recipeInstructions", []))
            findings = []

            lang = get_attr(html, r"<html[^>]*\blang=[\"']([^\"']+)")
            direction = get_attr(html, r"<html[^>]*\bdir=[\"']([^\"']+)")
            canonical = get_attr(html, r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)')
            if lang.lower() != locale:
                findings.append("lang")
            if direction != ("rtl" if locale == "ar" else "ltr"):
                findings.append("dir")
            if canonical and not canonical.startswith(DOMAIN + "/"):
                findings.append("canonical")
            if locale != "en" and ratio < MIN_TEXT_RATIO:
                findings.append("short body")
                low_text_pages += 1
                issues.append((f"{locale.upper()} {slug}", f"body length {ratio:.0%} of EN"))
            if locale != "en" and ENGLISH_RESIDUE.search(html):
                findings.append("English residue")
                residue_pages += 1
                issues.append((f"{locale.upper()} {slug}", "English wording remains in localized HTML"))
            if source_schema and (ingredients != source_ingredients or steps != source_steps):
                findings.append("recipe schema count differs")
                schema_mismatch_pages += 1
                issues.append((f"{locale.upper()} {slug}", f"ingredients {ingredients}/{source_ingredients}, steps {steps}/{source_steps}"))
            if not schema:
                findings.append("Recipe JSON-LD missing")
            if not findings:
                findings.append("no heuristic flags")

            print(
                f"| {slug} | {locale.upper()} | {len(text)} | "
                f"{ratio:.0%} | {ingredients} | {steps} | {', '.join(findings)} |"
            )

    print()
    print("## Summary")
    print()
    print(f"- Missing article pages/files: **{missing_pages}**")
    print(f"- Localized bodies below {MIN_TEXT_RATIO:.0%} of the English visible-text length: **{low_text_pages}**")
    print(f"- Localized pages with known English-residue patterns: **{residue_pages}**")
    print(f"- Recipe JSON-LD ingredient/step count mismatches: **{schema_mismatch_pages}**")
    print()
    print("These are triage signals, not proof of translation quality. Similar text length does not establish linguistic accuracy; every article still requires content-level review.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
