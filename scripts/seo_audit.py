#!/usr/bin/env python3
"""Static SEO preflight for MRecipes. Uses only Python's standard library."""
from __future__ import annotations
import json
import re
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote

ROOT = Path(__file__).resolve().parents[1]
DOMAIN = "https://mrecipes.online"
SITEMAP = ROOT / "sitemap.xml"
IGNORED_DIRS = {".git", "node_modules", ".github"}
errors: list[str] = []
warnings: list[str] = []
stats = Counter()

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title_parts = []
        self.in_title = False
        self.meta = {}
        self.canonicals = []
        self.alternates = []
        self.h1_count = 0
        self.images = []
        self.links = []
        self.jsonld = []
        self._script_type = None
        self._script_parts = []
        self.noindex = False
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "title":
            self.in_title = True
        elif tag == "meta":
            key = (a.get("name") or a.get("property") or "").lower()
            if key:
                self.meta[key] = a.get("content", "")
                if key == "robots" and "noindex" in a.get("content", "").lower():
                    self.noindex = True
        elif tag == "link":
            rel = (a.get("rel") or "").lower().split()
            if "canonical" in rel and a.get("href"):
                self.canonicals.append(a["href"])
            if "alternate" in rel and a.get("hreflang") and a.get("href"):
                self.alternates.append((a["hreflang"].lower(), a["href"]))
        elif tag == "h1":
            self.h1_count += 1
        elif tag == "img" and a.get("src"):
            self.images.append(a["src"])
        elif tag in {"a", "script", "link"}:
            href = a.get("href")
            if href and tag == "a":
                self.links.append(href)
        if tag == "script" and a.get("type", "").lower() == "application/ld+json":
            self._script_type = "jsonld"
            self._script_parts = []
    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        elif tag == "script" and self._script_type == "jsonld":
            self.jsonld.append("".join(self._script_parts))
            self._script_type = None
            self._script_parts = []
    def handle_data(self, data):
        if self.in_title:
            self.title_parts.append(data)
        if self._script_type == "jsonld":
            self._script_parts.append(data)
    @property
    def title(self):
        return " ".join(" ".join(self.title_parts).split())

def html_files():
    for p in ROOT.rglob("*.html"):
        if not any(part in IGNORED_DIRS for part in p.parts):
            yield p

def repo_path_for_url(url: str):
    parsed = urlparse(url)
    if parsed.netloc and parsed.netloc not in {"mrecipes.online", "www.mrecipes.online"}:
        return None
    if parsed.scheme and parsed.scheme not in {"http", "https"}:
        return None
    path = unquote(parsed.path or "/")
    if path == "/":
        return ROOT / "index.html"
    candidate = ROOT / path.lstrip("/")
    if candidate.is_dir():
        candidate = candidate / "index.html"
    return candidate

def main():
    pages = {}
    for file in html_files():
        # 404 pages should not be indexed and are intentionally outside normal SEO requirements.
        if file.name == "404.html":
            continue
        parser = PageParser()
        try:
            parser.feed(file.read_text(encoding="utf-8"))
        except Exception as exc:
            errors.append(f"{file.relative_to(ROOT)}: cannot parse HTML ({exc})")
            continue
        rel = file.relative_to(ROOT).as_posix()
        pages[rel] = parser
        stats["html_files"] += 1
        if not parser.title:
            errors.append(f"{rel}: missing <title>")
        elif len(parser.title) > 65:
            warnings.append(f"{rel}: title is long ({len(parser.title)} chars)")
        desc = parser.meta.get("description", "").strip()
        if not desc:
            errors.append(f"{rel}: missing meta description")
        elif len(desc) > 170:
            warnings.append(f"{rel}: meta description is long ({len(desc)} chars)")
        if len(parser.canonicals) != 1:
            errors.append(f"{rel}: expected exactly one canonical, found {len(parser.canonicals)}")
        if parser.h1_count != 1:
            warnings.append(f"{rel}: expected one H1, found {parser.h1_count}")
        for raw in parser.images:
            target = repo_path_for_url(raw)
            if target and not target.exists():
                warnings.append(f"{rel}: local image missing: {raw}")
        for raw in parser.jsonld:
            try:
                data = json.loads(raw)
                nodes = data if isinstance(data, list) else [data]
                for node in nodes:
                    if isinstance(node, dict) and node.get("@type") == "Recipe":
                        required = ("name", "image", "description", "recipeIngredient", "recipeInstructions")
                        missing = [k for k in required if not node.get(k)]
                        if missing:
                            warnings.append(f"{rel}: Recipe JSON-LD missing {', '.join(missing)}")
                        stats["recipe_schema_blocks"] += 1
            except Exception:
                errors.append(f"{rel}: invalid JSON-LD JSON")
    if not SITEMAP.exists():
        errors.append("sitemap.xml is missing")
        sitemap_urls = []
    else:
        try:
            tree = ET.parse(SITEMAP)
            sitemap_urls = [e.text.strip() for e in tree.findall(".//{*}loc") if e.text]
        except Exception as exc:
            errors.append(f"sitemap.xml is invalid XML: {exc}")
            sitemap_urls = []
    duplicates = [u for u, count in Counter(sitemap_urls).items() if count > 1]
    for u in duplicates:
        errors.append(f"sitemap.xml: duplicate URL: {u}")
    stats["sitemap_urls"] = len(sitemap_urls)
    for url in sitemap_urls:
        path = repo_path_for_url(url)
        if path is None:
            warnings.append(f"sitemap.xml: external or unsupported URL: {url}")
            continue
        if not path.exists():
            errors.append(f"sitemap.xml: URL has no matching file: {url}")
        else:
            try:
                p = PageParser()
                p.feed(path.read_text(encoding="utf-8"))
                if p.noindex:
                    errors.append(f"sitemap.xml: noindex page included: {url}")
            except Exception:
                pass
    # hreflang reciprocity: every target should point back to the source URL.
    for rel, parser in pages.items():
        if rel == "index.html":
            source = DOMAIN + "/"
        elif rel.endswith("/index.html"):
            source = DOMAIN + "/" + rel[:-10].strip("/") + "/"
        else:
            source = DOMAIN + "/" + rel
        for lang, target_url in parser.alternates:
            target_path = repo_path_for_url(target_url)
            if target_path and target_path.exists():
                target_rel = target_path.relative_to(ROOT).as_posix()
                target_parser = pages.get(target_rel)
                if target_parser and not any(href == source for _, href in target_parser.alternates):
                    warnings.append(f"{rel}: hreflang {lang} target does not link back: {target_url}")
    print("MRecipes SEO audit")
    print("==================")
    print(f"HTML files checked: {stats['html_files']}")
    print(f"Sitemap URLs: {stats['sitemap_urls']}")
    print(f"Recipe JSON-LD blocks: {stats['recipe_schema_blocks']}")
    print(f"Errors: {len(errors)}")
    print(f"Warnings: {len(warnings)}")
    for item in errors:
        print("ERROR: " + item)
    for item in warnings:
        print("WARN: " + item)
    # Warnings are surfaced without failing the workflow; hard structural errors fail it.
    return 1 if errors else 0

if __name__ == "__main__":
    sys.exit(main())
