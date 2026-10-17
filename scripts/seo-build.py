#!/usr/bin/env python3
"""Build-time SEO normalization for MRecipes.

Keeps page content/design intact while making metadata, hreflang, robots,
Open Graph/Twitter tags, breadcrumbs and a semantic table of contents consistent.
Also generates a complete sitemap from the actual HTML files.
"""
from __future__ import annotations

from html import escape
from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DOMAIN = "https://mrecipes.online"
LOCALES = {
    "en": {"prefix": "", "dir": "ltr", "home": "/", "article": "/recipes/", "pages": "/pages/"},
    "ar": {"prefix": "/ar", "dir": "rtl", "home": "/ar/", "article": "/ar/article/", "pages": "/ar/pages/"},
    "es": {"prefix": "/es", "dir": "ltr", "home": "/es/", "article": "/es/article/", "pages": "/es/pages/"},
    "fr": {"prefix": "/fr", "dir": "ltr", "home": "/fr/", "article": "/fr/article/", "pages": "/fr/pages/"},
    "ru": {"prefix": "/ru", "dir": "ltr", "home": "/ru/", "article": "/ru/article/", "pages": "/ru/pages/"},
}

LOCALE_LABELS = {"en": "English", "ar": "العربية", "es": "Español", "fr": "Français", "ru": "Русский"}

class Parser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.h1 = ""
        self.h2 = []
        self.h3 = []
        self.description = ""
        self.lang = ""
        self.in_title = False
        self.in_h1 = False
        self.in_h2 = False
        self.in_h3 = False
        self.buf = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "html": self.lang = a.get("lang", "")
        if tag == "title": self.in_title = True; self.buf = []
        if tag == "h1": self.in_h1 = True; self.buf = []
        if tag == "h2": self.in_h2 = True; self.buf = []
        if tag == "h3": self.in_h3 = True; self.buf = []
        if tag == "meta" and a.get("name", "").lower() == "description": self.description = a.get("content", "").strip()
    def handle_endtag(self, tag):
        text = re.sub(r"\s+", " ", "".join(self.buf)).strip()
        if tag == "title": self.title = text; self.in_title = False
        if tag == "h1": self.h1 = text; self.in_h1 = False
        if tag == "h2" and text: self.h2.append(text); self.in_h2 = False
        if tag == "h3" and text: self.h3.append(text); self.in_h3 = False
    def handle_data(self, data):
        if self.in_title or self.in_h1 or self.in_h2 or self.in_h3: self.buf.append(data)

def all_pages():
    return sorted(p for p in ROOT.rglob("*.html") if ".git" not in p.parts and "node_modules" not in p.parts)

def page_path(page: Path) -> str:
    rel = page.relative_to(ROOT).as_posix()
    if rel == "index.html": return "/"
    if rel.endswith("/index.html"): return "/" + rel[:-10].strip("/") + "/"
    return "/" + rel

def locale_for(path: str) -> str:
    for key in ("ar", "es", "fr", "ru"):
        if path == f"/{key}/" or path.startswith(f"/{key}/"): return key
    return "en"

def kind_and_slug(path: str, locale: str):
    if path == LOCALES[locale]["home"]: return "home", ""
    article_prefix = LOCALES[locale]["article"]
    page_prefix = LOCALES[locale]["pages"]
    if path.startswith(article_prefix) and path.endswith(".html"):
        return "article", path[len(article_prefix):-5]
    if path.startswith(page_prefix) and path.endswith(".html"):
        return "page", path[len(page_prefix):-5]
    if path == LOCALES[locale]["recipes" if "recipes" in LOCALES[locale] else "article"]: return "recipes", ""
    return "other", ""

def target_for(locale: str, kind: str, slug: str) -> str | None:
    if kind == "home": return DOMAIN + LOCALES[locale]["home"]
    if kind == "article": return DOMAIN + LOCALES[locale]["article"] + slug + ".html"
    if kind == "page": return DOMAIN + LOCALES[locale]["pages"] + slug + ".html"
    if kind == "recipes": return DOMAIN + (LOCALES[locale]["prefix"] + "/recipes.html" if locale != "en" else "/recipes.html")
    return None

def trim(text: str, limit=155):
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= limit: return text
    cut = text[:limit-1].rsplit(" ", 1)[0]
    return cut.rstrip(".,;:—-") + "…"

def upsert_meta(html: str, name: str, content: str):
    pattern = re.compile(r'<meta\s+name=["\']' + re.escape(name) + r'["\'][^>]*>', re.I)
    tag = f'<meta name="{name}" content="{escape(content, quote=True)}">'
    if pattern.search(html): return pattern.sub(tag, html, count=1)
    return re.sub(r"</head>", "  " + tag + "\n</head>", html, count=1, flags=re.I)

def upsert_property(html: str, prop: str, content: str):
    pattern = re.compile(r'<meta\s+property=["\']' + re.escape(prop) + r'["\'][^>]*>', re.I)
    tag = f'<meta property="{prop}" content="{escape(content, quote=True)}">'
    if pattern.search(html): return pattern.sub(tag, html, count=1)
    return re.sub(r"</head>", "  " + tag + "\n</head>", html, count=1, flags=re.I)

def remove_noindex(html: str):
    return re.sub(r'<meta\s+[^>]*name=["\']robots["\'][^>]*content=["\'][^"\']*noindex[^"\']*["\'][^>]*>\s*', "", html, flags=re.I)

def replace_or_add_link(html: str, rel: str, href: str, extra=""):
    pattern = re.compile(r'<link\s+[^>]*rel=["\']' + re.escape(rel) + r'["\'][^>]*>', re.I)
    tag = f'<link rel="{rel}" href="{escape(href, quote=True)}"{extra}>'
    if pattern.search(html): return pattern.sub(tag, html, count=1)
    return re.sub(r"</head>", "  " + tag + "\n</head>", html, count=1, flags=re.I)

def inject_hreflang(html: str, locale: str, kind: str, slug: str, existing_paths: set[str]):
    # Remove stale hreflang annotations, then rebuild only valid alternates.
    html = re.sub(r'\s*<link\s+[^>]*rel=["\']alternate["\'][^>]*hreflang=["\'][^"\']+["\'][^>]*>\s*', "\n", html, flags=re.I)
    tags = []
    for key in LOCALES:
        path = LOCALES[key]["home"] if kind == "home" else (LOCALES[key]["article"] + slug + ".html" if kind == "article" else LOCALES[key]["pages"] + slug + ".html" if kind == "page" else None)
        if not path or path not in existing_paths: continue
        tags.append(f'<link rel="alternate" hreflang="{key}" href="{DOMAIN}{path}">')
    if kind in {"home", "article", "page"} and "/" in existing_paths:
        # x-default follows English when the English counterpart exists.
        en_path = LOCALES["en"]["home"] if kind == "home" else (LOCALES["en"]["article"] + slug + ".html" if kind == "article" else LOCALES["en"]["pages"] + slug + ".html")
        if en_path in existing_paths: tags.append(f'<link rel="alternate" hreflang="x-default" href="{DOMAIN}{en_path}">')
    return re.sub(r"</head>", "  " + "\n  ".join(tags) + "\n</head>", html, count=1, flags=re.I)

def inject_toc(html: str, parser: Parser, locale: str):
    if len(parser.h2) < 2 or re.search(r'class=["\'][^"\']*table-of-contents', html, re.I): return html
    headings = parser.h2 + parser.h3
    labels = {
        "en": ("Table of contents", "On this page"),
        "ar": ("جدول المحتويات", "في هذه الصفحة"),
        "es": ("Tabla de contenidos", "En esta página"),
        "fr": ("Sommaire", "Sur cette page"),
        "ru": ("Содержание", "На этой странице"),
    }
    title = labels[locale][0]
    # Match actual heading texts in order and add stable ids to h2/h3.
    index = 0
    def add_id(m):
        nonlocal index
        tag, attrs, text = m.group(1), m.group(2), m.group(3)
        if tag not in ("h2", "h3"): return m.group(0)
        clean = re.sub(r"<[^>]+>", "", text)
        slug = re.sub(r"[^\w\u00C0-\uFFFF-]+", "-", clean.lower()).strip("-") or f"section-{index+1}"
        base = slug; n = 2
        while re.search(rf'id=["\']{re.escape(slug)}["\']', html, re.I): slug = f"{base}-{n}"; n += 1
        index += 1
        attrs = re.sub(r'\s+id=["\'][^"\']*["\']', "", attrs, flags=re.I)
        return f"<{tag}{attrs} id=\"{slug}\">{text}</{tag}>"
    html = re.sub(r'<(h2|h3)([^>]*)>(.*?)</\1>', add_id, html, flags=re.I|re.S)
    # Re-parse ids from the resulting document.
    id_parser = HTMLParser()
    items = []
    for m in re.finditer(r'<h([23])\s+[^>]*id=["\']([^"\']+)["\'][^>]*>(.*?)</h\1>', html, flags=re.I|re.S):
        text = re.sub(r"<[^>]+>", "", m.group(3)); text = re.sub(r"\s+", " ", text).strip()
        items.append((int(m.group(1)), m.group(2), text))
    links = []
    for level, ident, text in items:
        cls = " toc-subitem" if level == 3 else ""
        links.append(f'<li class="{cls}"><a href="#{escape(ident, quote=True)}">{escape(text)}</a></li>')
    toc = f'<nav class="table-of-contents" aria-label="{escape(title)}"><strong>{escape(title)}</strong><ol>{"".join(links)}</ol></nav>'
    # Insert immediately before the main article/content container, after the page hero if present.
    if re.search(r'<article\b', html, re.I):
        html = re.sub(r'(<article\b[^>]*>)', toc + r'\n\1', html, count=1, flags=re.I)
    else:
        html = re.sub(r'(<main\b[^>]*>)', r'\1\n' + toc, html, count=1, flags=re.I)
    return html

def process(page: Path, existing_paths: set[str]):
    if page.name == "404.html": return
    raw = page.read_text(encoding="utf-8")
    p = Parser(); p.feed(raw)
    path = page_path(page); locale = locale_for(path)
    kind, slug = kind_and_slug(path, locale)
    if kind == "other" and page.name == "recipes.html": kind = "recipes"
    # Never block indexable content. 404 is deliberately excluded above.
    raw = remove_noindex(raw)
    raw = upsert_meta(raw, "robots", "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1")
    # Ensure document language/direction matches the URL.
    raw = re.sub(r'<html\b[^>]*>', f'<html lang="{locale}" dir="{LOCALES[locale]["dir"]}">', raw, count=1, flags=re.I)
    title = p.title or p.h1 or ("MRecipes — Recipes" if kind == "recipes" else "MRecipes")
    title = re.sub(r"\s+", " ", title).strip()
    raw = re.sub(r'<title>.*?</title>', f'<title>{escape(title)}</title>', raw, count=1, flags=re.I|re.S)
    desc = p.description
    if len(desc) < 70:
        # Prefer the first substantive paragraph, otherwise derive a concise description from the heading.
        candidates = re.findall(r'<p\b[^>]*>(.*?)</p>', raw, flags=re.I|re.S)
        for candidate in candidates:
            text = re.sub(r"<[^>]+>", "", candidate)
            text = re.sub(r"\s+", " ", text).strip()
            if len(text) >= 70:
                desc = trim(text); break
    if not desc: desc = trim(f"{title}. Discover easy homemade recipes, cooking ideas, ingredients, tips, and step-by-step instructions on MRecipes.")
    raw = upsert_meta(raw, "description", trim(desc))
    keywords = ", ".join(dict.fromkeys(re.findall(r"[\w\u00C0-\uFFFF][\w\u00C0-\uFFFF'’-]{2,}", f"{title} {p.h1}".lower())))
    raw = upsert_meta(raw, "keywords", ", ".join(keywords.split(", ")[:12]))
    canonical = target_for(locale, kind, slug) or DOMAIN + path
    raw = replace_or_add_link(raw, "canonical", canonical)
    raw = inject_hreflang(raw, locale, kind, slug, existing_paths)
    ogtype = "article" if kind in {"article", "page"} else "website"
    raw = upsert_property(raw, "og:type", ogtype)
    raw = upsert_property(raw, "og:title", title)
    raw = upsert_property(raw, "og:description", trim(desc))
    raw = upsert_property(raw, "og:url", canonical)
    raw = upsert_meta(raw, "twitter:card", "summary_large_image")
    raw = upsert_meta(raw, "twitter:title", title)
    raw = upsert_meta(raw, "twitter:description", trim(desc))
    # Keep existing images; do not invent an image URL when a page has none.
    if "og:image" not in raw.lower():
        m = re.search(r'<img\b[^>]*src=["\']([^"\']+)["\'][^>]*>', raw, flags=re.I)
        if m and not m.group(1).startswith("data:"):
            image = m.group(1)
            image = DOMAIN + image if image.startswith("/") else DOMAIN + "/" + image.lstrip("./")
            raw = upsert_property(raw, "og:image", image)
            raw = upsert_meta(raw, "twitter:image", image)
    if kind in {"article", "page"}:
        raw = inject_toc(raw, p, locale)
    page.write_text(raw, encoding="utf-8")

def build_sitemap(existing_paths: set[str]):
    import datetime
    today = datetime.date.today().isoformat()
    excluded = {"/404.html", "/recipes/recipe-template.html"}
    urls = sorted(p for p in existing_paths if p not in excluded and not p.endswith("/404.html"))
    body = ["<?xml version=\"1.0\" encoding=\"UTF-8\"?>", '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path in urls:
        if path.endswith(".html") or path.endswith("/"):
            body += ["  <url>", f"    <loc>{DOMAIN}{escape(path)}</loc>", f"    <lastmod>{today}</lastmod>", "  </url>"]
    body.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(body) + "\n", encoding="utf-8")

pages = all_pages()
existing = {page_path(p) for p in pages}
for page in pages: process(page, existing)
build_sitemap(existing)
print(f"SEO build complete: processed {len(pages)} HTML files and generated sitemap.xml with {len(existing)} discovered paths.")
