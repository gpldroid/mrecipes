#!/usr/bin/env python3
"""Validate locale catalogs, translated page coverage, and SEO routing for MRecipes."""
from __future__ import annotations

import json
import sys
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DOMAIN = "https://mrecipes.online"
LOCALES = ("en", "ar", "fr", "es", "ru")
RTL = {"ar"}
SITEMAP = ROOT / "sitemap.xml"


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.lang = ""
        self.direction = ""
        self.title = ""
        self._in_title = False
        self._title_parts: list[str] = []
        self.description = ""
        self.canonicals: list[str] = []
        self.alternates: dict[str, str] = {}

    def handle_starttag(self, tag: str, attrs) -> None:
        attrs = dict(attrs)
        if tag == "html":
            self.lang = (attrs.get("lang") or "").lower()
            self.direction = (attrs.get("dir") or "").lower()
        elif tag == "title":
            self._in_title = True
            self._title_parts = []
        elif tag == "meta" and (attrs.get("name") or "").lower() == "description":
            self.description = (attrs.get("content") or "").strip()
        elif tag == "link":
            rel = (attrs.get("rel") or "").lower().split()
            if "canonical" in rel and attrs.get("href"):
                self.canonicals.append(attrs["href"].strip())
            if "alternate" in rel and attrs.get("hreflang") and attrs.get("href"):
                self.alternates[attrs["hreflang"].lower()] = attrs["href"].strip()

    def handle_endtag(self, tag: str) -> None:
        if tag == "title" and self._in_title:
            self.title = " ".join("".join(self._title_parts).split())
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self._title_parts.append(data)


def locale_for(path: str) -> str:
    for locale in LOCALES:
        if locale != "en" and (path == f"/{locale}" or path.startswith(f"/{locale}/")):
            return locale
    return "en"


def page_kind(path: str) -> tuple[str, str]:
    if path in ("/",) or any(path == f"/{locale}/" for locale in LOCALES if locale != "en"):
        return "home", ""
    if path == "/recipes.html" or any(path == f"/{locale}/recipes.html" for locale in LOCALES if locale != "en"):
        return "recipes_index", ""
    if path.startswith("/recipes/") and path.endswith(".html"):
        return "recipe", path[len("/recipes/"):-len(".html")]
    for locale in LOCALES:
        prefix = f"/{locale}/article/" if locale != "en" else None
        if prefix and path.startswith(prefix) and path.endswith(".html"):
            return "recipe", path[len(prefix):-len(".html")]
    if path.startswith("/pages/") and path.endswith(".html"):
        return "page", path[len("/pages/"):-len(".html")]
    for locale in LOCALES:
        prefix = f"/{locale}/pages/" if locale != "en" else None
        if prefix and path.startswith(prefix) and path.endswith(".html"):
            return "page", path[len(prefix):-len(".html")]
    return "other", ""


def path_for(locale: str, kind: str, slug: str) -> str | None:
    if kind == "home":
        return "/" if locale == "en" else f"/{locale}/"
    if kind == "recipes_index":
        return "/recipes.html" if locale == "en" else f"/{locale}/recipes.html"
    if kind == "recipe":
        return f"/recipes/{slug}.html" if locale == "en" else f"/{locale}/article/{slug}.html"
    if kind == "page":
        return f"/pages/{slug}.html" if locale == "en" else f"/{locale}/pages/{slug}.html"
    return None


def local_file(path: str) -> Path:
    if path == "/":
        return ROOT / "index.html"
    relative = path.lstrip("/")
    if path.endswith("/"):
        relative += "index.html"
    return ROOT / relative


def flatten_keys(value, prefix=""):
    keys = set()
    if isinstance(value, dict):
        for key, child in value.items():
            path = f"{prefix}.{key}" if prefix else key
            keys.add(path)
            keys.update(flatten_keys(child, path))
    return keys


def main() -> int:
    errors: list[str] = []
    config_path = ROOT / "i18n" / "config.json"
    try:
        config = json.loads(config_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"ERROR: cannot read i18n/config.json: {exc}")
        return 1

    if config.get("defaultLocale") != "en":
        errors.append("i18n/config.json: defaultLocale must remain en for compatibility.")
    if set(config.get("supportedLocales", [])) != set(LOCALES):
        errors.append(f"i18n/config.json: supportedLocales must be exactly {', '.join(LOCALES)}.")
    if config.get("domain") != DOMAIN:
        errors.append(f"i18n/config.json: domain must be {DOMAIN}.")

    catalogs: dict[str, dict] = {}
    catalog_keys: dict[str, set[str]] = {}
    for locale in LOCALES:
        path = ROOT / "i18n" / "locales" / f"{locale}.json"
        try:
            catalogs[locale] = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            errors.append(f"{path.relative_to(ROOT)}: invalid or missing JSON ({exc}).")
            continue
        catalog_keys[locale] = flatten_keys(catalogs[locale])
        if catalogs[locale].get("locale", {}).get("code") != locale:
            errors.append(f"{path.relative_to(ROOT)}: locale.code does not match filename.")
        expected_dir = "rtl" if locale in RTL else "ltr"
        if catalogs[locale].get("locale", {}).get("dir") != expected_dir:
            errors.append(f"{path.relative_to(ROOT)}: locale.dir must be {expected_dir}.")
    if catalog_keys:
        base_locale = "en" if "en" in catalog_keys else next(iter(catalog_keys))
        for locale, keys in catalog_keys.items():
            missing = sorted(catalog_keys[base_locale] - keys)
            extra = sorted(keys - catalog_keys[base_locale])
            if missing or extra:
                errors.append(
                    f"i18n/locales/{locale}.json: key mismatch vs {base_locale}; "
                    f"missing={missing}, extra={extra}."
                )

    if not SITEMAP.exists():
        errors.append("sitemap.xml is missing.")
        sitemap_paths: set[str] = set()
    else:
        try:
            tree = ET.parse(SITEMAP)
            ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
            sitemap_paths = {
                urlparse(node.text.strip()).path
                for node in tree.findall(".//sm:loc", ns)
                if node.text and urlparse(node.text.strip()).netloc == "mrecipes.online"
            }
        except ET.ParseError as exc:
            errors.append(f"sitemap.xml is not valid XML: {exc}")
            sitemap_paths = set()

    pages_by_locale: dict[str, dict[str, set[str]]] = {
        locale: defaultdict(set) for locale in LOCALES
    }
    parsed_pages: dict[str, PageParser] = {}
    for path in sorted(sitemap_paths):
        file_path = local_file(path)
        if not file_path.is_file():
            errors.append(f"sitemap target has no local HTML file: {path}")
            continue
        parser = PageParser()
        try:
            parser.feed(file_path.read_text(encoding="utf-8"))
        except (OSError, UnicodeDecodeError) as exc:
            errors.append(f"{path}: cannot read HTML ({exc}).")
            continue
        parsed_pages[path] = parser
        locale = locale_for(path)
        kind, slug = page_kind(path)
        if kind != "other":
            pages_by_locale[locale][kind].add(slug or "__index__")
        if parser.lang != locale:
            errors.append(f"{path}: html lang={parser.lang!r}; expected {locale!r}.")
        expected_dir = "rtl" if locale in RTL else "ltr"
        if locale in RTL and parser.direction != expected_dir:
            errors.append(f"{path}: Arabic pages must declare dir=\"rtl\".")
        if parser.direction == "rtl" and locale not in RTL:
            errors.append(f"{path}: non-Arabic page unexpectedly declares dir=\"rtl\".")
        if not parser.title:
            errors.append(f"{path}: missing or empty <title>.")
        if not parser.description:
            errors.append(f"{path}: missing meta description.")
        expected_canonical = DOMAIN + path
        if parser.canonicals != [expected_canonical]:
            errors.append(
                f"{path}: expected exactly one canonical {expected_canonical}; "
                f"found {parser.canonicals}."
            )
        expected_alternates = {
            locale_code: DOMAIN + target
            for locale_code in LOCALES
            if (target := path_for(locale_code, kind, slug)) and target in sitemap_paths
        }
        for alternate_locale, alternate_url in expected_alternates.items():
            if parser.alternates.get(alternate_locale) != alternate_url:
                errors.append(
                    f"{path}: hreflang={alternate_locale!r} should point to {alternate_url}; "
                    f"found {parser.alternates.get(alternate_locale)!r}."
                )
        for alternate_locale, alternate_url in parser.alternates.items():
            if alternate_url not in {DOMAIN + p for p in sitemap_paths}:
                errors.append(f"{path}: hreflang={alternate_locale!r} points outside the sitemap: {alternate_url}.")

    # Every locale must expose the same recipe and policy/page slug inventory.
    base = pages_by_locale.get("en", {})
    for locale in LOCALES:
        if locale not in pages_by_locale:
            errors.append(f"No sitemap pages found for locale {locale}.")
            continue
        for kind in ("home", "recipes_index", "recipe", "page"):
            expected = base.get(kind, set())
            actual = pages_by_locale[locale].get(kind, set())
            if actual != expected:
                missing = sorted(expected - actual)
                extra = sorted(actual - expected)
                errors.append(
                    f"Locale {locale}: {kind} inventory differs from en; "
                    f"missing={missing}, extra={extra}."
                )

    if errors:
        print(f"i18n validation failed with {len(errors)} issue(s):")
        for error in errors:
            print(f" - {error}")
        return 1

    counts = {
        locale: {
            kind: len(pages_by_locale[locale].get(kind, set()))
            for kind in ("home", "recipes_index", "recipe", "page")
        }
        for locale in LOCALES
    }
    print("i18n validation passed.")
    print(f"Locales: {', '.join(LOCALES)}")
    print(f"Sitemap URLs checked: {len(sitemap_paths)}")
    print("Page inventory per locale: " + json.dumps(counts, ensure_ascii=False, sort_keys=True))
    print("Catalog structure: matching keys across all locale JSON files.")
    print("SEO checks: language, Arabic RTL, title, description, canonical, hreflang.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
