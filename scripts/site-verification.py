#!/usr/bin/env python3
"""Inject optional Google Search Console and Bing verification tags."""
from __future__ import annotations
import os
import re
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HOME = ROOT / "index.html"
TOKENS = {
    "google-site-verification": os.environ.get("GOOGLE_SITE_VERIFICATION", "").strip(),
    "msvalidate.01": os.environ.get("BING_SITE_VERIFICATION", "").strip(),
}

def main() -> None:
    if not HOME.is_file():
        raise SystemExit("index.html is missing; cannot configure webmaster verification.")
    html = HOME.read_text(encoding="utf-8")
    for name, token in TOKENS.items():
        pattern = re.compile(r'<meta\b(?=[^>]*\bname=["\']' + re.escape(name) + r'["\'])[^>]*>', re.IGNORECASE)
        html = pattern.sub("", html)
        if token:
            tag = f'<meta name="{name}" content="{escape(token, quote=True)}">'
            if re.search(r"</head\s*>", html, re.IGNORECASE):
                html = re.sub(r"</head\s*>", tag + "\n</head>", html, count=1, flags=re.IGNORECASE)
    HOME.write_text(html, encoding="utf-8")
    configured = [name for name, token in TOKENS.items() if token]
    missing = [name for name, token in TOKENS.items() if not token]
    print("Webmaster verification tags configured: " + (", ".join(configured) if configured else "none"))
    if missing:
        print("Awaiting owner-provided verification values for: " + ", ".join(missing))
    print("No verification tokens are stored in source control.")

if __name__ == "__main__":
    main()
