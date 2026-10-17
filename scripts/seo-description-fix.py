from pathlib import Path
from html import escape
from html.parser import HTMLParser
import re
ROOT=Path(__file__).resolve().parents[1]
class P(HTMLParser):
 def __init__(self): super().__init__(convert_charrefs=True); self.title=''; self.on=False; self.buf=[]
 def handle_starttag(self,t,a):
  if t=='title': self.on=True; self.buf=[]
 def handle_endtag(self,t):
  if t=='title': self.title=re.sub(r'\s+',' ',''.join(self.buf)).strip(); self.on=False
 def handle_data(self,d):
  if self.on:self.buf.append(d)
for page in sorted(ROOT.rglob('*.html')):
 if '.git' in page.parts or page.name=='404.html': continue
 raw=page.read_text(encoding='utf-8'); p=P(); p.feed(raw)
 m=re.search(r'<meta\s+[^>]*name=["\']description["\'][^>]*>',raw,re.I)
 current=''
 if m:
  x=re.search(r'content=["\']([^"\']*)["\']',m.group(0),re.I); current=x.group(1).strip() if x else ''
 if len(current)>=50: continue
 paras=[]
 for x in re.findall(r'<p\b[^>]*>(.*?)</p>',raw,re.I|re.S):
  x=re.sub(r'<[^>]+>','',x); x=re.sub(r'\s+',' ',x).strip()
  if len(x)>=40: paras.append(x)
 desc=(paras[0] if paras else '')
 if len(desc)<50: desc=f"{p.title or 'MRecipes'}. Discover easy homemade recipes, cooking ideas, useful ingredients, practical tips, and step-by-step instructions for everyday meals."
 desc=re.sub(r'\s+',' ',desc).strip()
 if len(desc)>155: desc=desc[:154].rsplit(' ',1)[0].rstrip('.,;:—-')+'…'
 tag=f'<meta name="description" content="{escape(desc,quote=True)}">'
 if m: raw=raw[:m.start()]+tag+raw[m.end():]
 else: raw=re.sub(r'</head>',tag+'\n</head>',raw,count=1,flags=re.I)
 page.write_text(raw,encoding='utf-8')
print('Meta descriptions normalized to at least 50 characters.')
