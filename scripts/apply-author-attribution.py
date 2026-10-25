#!/usr/bin/env python3
"""Add the requested visible author credit beneath each page's summary.

This build-time transform is idempotent and does not delete or replace article
content. It writes only the generated working tree used by the Pages build.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LABELS = {
    "en": "By Imad Limrani",
    "ar": "بقلم Imad Limrani",
    "fr": "Par Imad Limrani",
    "es": "Por Imad Limrani",
    "ru": "Автор: Imad Limrani",
}
SUMMARY_MARKERS = {
    "en": ("recipe at a glance", "in summary", "summary"),
    "ar": ("نظرة سريعة", "الخلاصة", "ملخص"),
    "fr": ("en bref", "résumé", "en résumé"),
    "es": ("resumen de la receta", "resumen"),
    "ru": ("кратко о рецепте", "краткое содержание", "итог"),
}
AUTHOR_RE = re.compile(r'class=["\'][^"\']*\bi18n-author-credit\b', re.I)
MAIN_RE = re.compile(r"<main\b[^>]*>(.*?)</main\s*>", re.I | re.S)
PARA_RE = re.compile(r"<p\b[^>]*>.*?</p\s*>", re.I | re.S)
LANG_RE = re.compile(r"""<html\b[^>]*\blang=["']([^"']+)""", re.I)
TAG_RE = re.compile(r"<[^>]+>")
SCRIPT_STYLE_RE = re.compile(r"<(script|style)\b[^>]*>.*?</\1\s*>", re.I | re.S)


def plain(fragment: str) -> str:
    return re.sub(r"\s+", " ", TAG_RE.sub(" ", SCRIPT_STYLE_RE.sub(" ", fragment))).strip().lower()


def locale_for(path: Path, html: str) -> str:
    match = LANG_RE.search(html)
    if match and match.group(1).lower() in LABELS:
        return match.group(1).lower()
    if path.parts and path.parts[0] in LABELS:
        return path.parts[0]
    return "en"


def transform(path: Path) -> bool:
    if path.name == "404.html" or ".git" in path.parts:
        return False
    html = path.read_text(encoding="utf-8")
    if AUTHOR_RE.search(html):
        return False
    locale = locale_for(path, html)
    label = LABELS[locale]
    main = MAIN_RE.search(html)
    if not main:
        return False
    body = main.group(1)
    paragraphs = list(PARA_RE.finditer(body))
    credit = f'<p class="i18n-author-credit"><strong>{label}</strong></p>'
    if paragraphs:
        markers = SUMMARY_MARKERS[locale]
        target = next(
            (p for p in paragraphs if any(marker in plain(p.group(0)) for marker in markers)),
            paragraphs[0],
        )
        body = body[:target.end()] + "\n" + credit + body[target.end():]
    else:
        body = "\n" + credit + body
    html = html[:main.start(1)] + body + html[main.end(1):]
    path.write_text(html, encoding="utf-8")
    return True


def main() -> int:
    pages = sorted(p for p in ROOT.rglob("*.html") if ".git" not in p.parts)
    changed = sum(transform(page) for page in pages)
    print(f"Added Imad Limrani attribution beneath the summary/first content paragraph on {changed} HTML pages.")
    missing = []
    for page in pages:
        if page.name == "404.html":
            continue
        text = page.read_text(encoding="utf-8")
        if "<main" in text.lower() and "Imad Limrani" not in text:
            missing.append(str(page.relative_to(ROOT)))
    if missing:
        raise SystemExit("Author credit missing from pages: " + ", ".join(missing[:30]))
    print("Author attribution coverage check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
