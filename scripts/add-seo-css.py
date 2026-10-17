from pathlib import Path
import re
ROOT = Path(__file__).resolve().parents[1]
LINK = '<link rel="stylesheet" href="/assets/css/seo-enhancements.css">'
for page in sorted(ROOT.rglob('*.html')):
    if '.git' in page.parts or page.name == '404.html':
        continue
    text = page.read_text(encoding='utf-8')
    if 'assets/css/seo-enhancements.css' in text:
        continue
    text = re.sub(r'(</head>)', '  ' + LINK + r'\n\1', text, count=1, flags=re.I)
    page.write_text(text, encoding='utf-8')
print('SEO CSS linked on all indexable HTML pages.')
