#!/usr/bin/env python3
from pathlib import Path
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
import re, datetime

ROOT=Path(__file__).resolve().parents[1]; DOMAIN='https://mrecipes.online'
LOCALES={
'en':('/', '/recipes/', '/pages/', 'ltr'),
'ar':('/ar/', '/ar/article/', '/ar/pages/', 'rtl'),
'es':('/es/', '/es/article/', '/es/pages/', 'ltr'),
'fr':('/fr/', '/fr/article/', '/fr/pages/', 'ltr'),
'ru':('/ru/', '/ru/article/', '/ru/pages/', 'ltr')}

class P(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True); self.title=''; self.h1=''; self.h2=[]; self.h3=[]; self.desc=''; self.it=None; self.buf=[]
 def handle_starttag(self,t,a):
  d=dict(a)
  if t in ('title','h1','h2','h3'): self.it=t; self.buf=[]
  if t=='meta' and d.get('name','').lower()=='description': self.desc=d.get('content','').strip()
 def handle_endtag(self,t):
  if t==self.it:
   s=re.sub(r'\s+',' ',' '.join(self.buf)).strip()
   if t=='title': self.title=s
   elif t=='h1': self.h1=s
   elif t=='h2' and s: self.h2.append(s)
   elif t=='h3' and s: self.h3.append(s)
   self.it=None
 def handle_data(self,d):
  if self.it: self.buf.append(d)

def pages(): return sorted(p for p in ROOT.rglob('*.html') if '.git' not in p.parts and p.name!='404.html')
def pathof(p):
 r=p.relative_to(ROOT).as_posix()
 if r=='index.html': return '/'
 if r.endswith('/index.html'): return '/'+r[:-10].strip('/')+'/'
 return '/'+r
def locale(path):
 for k in ('ar','es','fr','ru'):
  if path.startswith('/'+k+'/'): return k
 return 'en'
def info(path,k):
 home,art,pagesp,_=LOCALES[k]
 if path==home:return 'home',''
 if path.startswith(art) and path.endswith('.html'):return 'article',path[len(art):-5]
 if path.startswith(pagesp) and path.endswith('.html'):return 'page',path[len(pagesp):-5]
 if path==('/recipes.html' if k=='en' else f'/{k}/recipes.html'):return 'recipes',''
 return 'other',''
def target(k,kind,slug):
 home,art,pagesp,_=LOCALES[k]
 if kind=='home':return DOMAIN+home
 if kind=='article':return DOMAIN+art+slug+'.html'
 if kind=='page':return DOMAIN+pagesp+slug+'.html'
 if kind=='recipes':return DOMAIN+('/recipes.html' if k=='en' else f'/{k}/recipes.html')
 return None
def trim(s,n=155):
 s=re.sub(r'\s+',' ',s).strip()
 if len(s)<=n:return s
 return s[:n-1].rsplit(' ',1)[0].rstrip('.,;:—-')+'…'
def meta(html,name,val):
 tag=f'<meta name="{name}" content="{escape(val,quote=True)}">'; pat=re.compile(r'<meta\s+[^>]*name=["\']'+re.escape(name)+r'["\'][^>]*>',re.I)
 return pat.sub(tag,html,count=1) if pat.search(html) else re.sub(r'</head>',tag+'\n</head>',html,count=1,flags=re.I)
def prop(html,name,val):
 tag=f'<meta property="{name}" content="{escape(val,quote=True)}">'; pat=re.compile(r'<meta\s+[^>]*property=["\']'+re.escape(name)+r'["\'][^>]*>',re.I)
 return pat.sub(tag,html,count=1) if pat.search(html) else re.sub(r'</head>',tag+'\n</head>',html,count=1,flags=re.I)
def link(html,rel,href):
 tag=f'<link rel="{rel}" href="{escape(href,quote=True)}">'; pat=re.compile(r'<link\s+[^>]*rel=["\']'+re.escape(rel)+r'["\'][^>]*>',re.I)
 return pat.sub(tag,html,count=1) if pat.search(html) else re.sub(r'</head>',tag+'\n</head>',html,count=1,flags=re.I)
def hreflang(html,kind,slug,existing):
 html=re.sub(r'\s*<link\s+[^>]*rel=["\']alternate["\'][^>]*hreflang=["\'][^"\']+["\'][^>]*>','',html,flags=re.I)
 tags=[]
 for k,(home,art,pagesp,_) in LOCALES.items():
  path=home if kind=='home' else art+slug+'.html' if kind=='article' else pagesp+slug+'.html' if kind=='page' else ('/recipes.html' if k=='en' else f'/{k}/recipes.html') if kind=='recipes' else None
  if path and path in existing: tags.append(f'<link rel="alternate" hreflang="{k}" href="{DOMAIN}{path}">')
 if kind in ('home','article','page','recipes'):
  home,art,pagesp,_=LOCALES['en']; ep=home if kind=='home' else art+slug+'.html' if kind=='article' else pagesp+slug+'.html' if kind=='page' else '/recipes.html'
  if ep in existing: tags.append(f'<link rel="alternate" hreflang="x-default" href="{DOMAIN}{ep}">')
 return re.sub(r'</head>','\n'.join(tags)+'\n</head>',html,count=1,flags=re.I)
def toc(html,p,k):
 if len(p.h2)<2 or 'table-of-contents' in html:return html
 labels={'en':'Table of contents','ar':'جدول المحتويات','es':'Tabla de contenidos','fr':'Sommaire','ru':'Содержание'}; title=labels[k]
 used=set(); items=[]
 for tag in ('h2','h3'):
  for m in re.finditer(r'<'+tag+r'([^>]*)>(.*?)</'+tag+r'>',html,re.I|re.S):
   text=re.sub(r'<[^>]+>','',m.group(2)); text=re.sub(r'\s+',' ',text).strip(); base=re.sub(r'[^\w\u00C0-\uFFFF-]+','-',text.lower()).strip('-') or 'section'; ident=base; n=2
   while ident in used: ident=f'{base}-{n}'; n+=1
   used.add(ident); items.append((tag,ident,text))
 # Add ids only to headings without an id, in document order.
 n=0
 def repl(m):
  nonlocal n
  tag,attrs,body=m.group(1),m.group(2),m.group(3)
  if ' id=' in attrs.lower():return m.group(0)
  text=re.sub(r'<[^>]+>','',body); base=re.sub(r'[^\w\u00C0-\uFFFF-]+','-',text.lower()).strip('-') or f'section-{n+1}'; ident=base; x=2
  while re.search(rf'\bid=["\']{re.escape(ident)}["\']',html,re.I): ident=f'{base}-{x}'; x+=1
  n+=1; return f'<{tag}{attrs} id="{escape(ident,quote=True)}">{body}</{tag}>'
 html=re.sub(r'<(h2|h3)([^>]*)>(.*?)</\1>',repl,html,re.I|re.S)
 rows=[]
 for m in re.finditer(r'<h([23])\s+[^>]*id=["\']([^"\']+)["\'][^>]*>(.*?)</h\1>',html,re.I|re.S):
  text=re.sub(r'<[^>]+>','',m.group(3)); text=re.sub(r'\s+',' ',text).strip(); cls=' class="toc-subitem"' if m.group(1)=='3' else ''; rows.append(f'<li{cls}><a href="#{escape(m.group(2),quote=True)}">{escape(text)}</a></li>')
 nav=f'<nav class="table-of-contents" aria-label="{escape(title)}"><strong>{escape(title)}</strong><ol>{"".join(rows)}</ol></nav>'
 return re.sub(r'(<article\b[^>]*>)',nav+'\n\\1',html,count=1,flags=re.I) if re.search(r'<article\b',html,re.I) else re.sub(r'(<main\b[^>]*>)',r'\\1\n'+nav,html,count=1,flags=re.I)

allp=pages(); existing={pathof(p) for p in allp}
for page in allp:
 raw=page.read_text(encoding='utf-8'); p=P(); p.feed(raw); path=pathof(page); k=locale(path); kind,slug=info(path,k)
 raw=re.sub(r'<meta\s+[^>]*name=["\']robots["\'][^>]*>','',raw,flags=re.I); raw=meta(raw,'robots','index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1')
 raw=re.sub(r'<html\b[^>]*>',f'<html lang="{k}" dir="{LOCALES[k][3]}">',raw,count=1,flags=re.I)
 title=trim(p.title or p.h1 or ('MRecipes — Easy Recipes' if kind in ('home','recipes') else 'MRecipes'), 60)
 if re.search(r'<title\b',raw,re.I): raw=re.sub(r'<title>.*?</title>',f'<title>{escape(title)}</title>',raw,count=1,flags=re.I|re.S)
 else: raw=re.sub(r'</head>',f'<title>{escape(title)}</title>\n</head>',raw,count=1,flags=re.I)
 desc=p.desc
 if len(desc)<70:
  for x in re.findall(r'<p\b[^>]*>(.*?)</p>',raw,re.I|re.S):
   x=re.sub(r'<[^>]+>','',x); x=re.sub(r'\s+',' ',x).strip()
   if len(x)>=70: desc=trim(x); break
 if not desc: desc=trim(f'{title}. Discover easy homemade recipes, cooking ideas, ingredients, tips and step-by-step instructions on MRecipes.')
 raw=meta(raw,'description',trim(desc)); raw=meta(raw,'keywords',', '.join(re.findall(r'[\w\u00C0-\uFFFF][\w\u00C0-\uFFFF\'’-]{2,}',(title+' '+p.h1).lower())[:12]))
 canonical=target(k,kind,slug) or DOMAIN+path; raw=link(raw,'canonical',canonical); raw=hreflang(raw,kind,slug,existing)
 raw=prop(raw,'og:type','article' if kind in ('article','page') else 'website'); raw=prop(raw,'og:title',title); raw=prop(raw,'og:description',trim(desc)); raw=prop(raw,'og:url',canonical)
 raw=meta(raw,'twitter:card','summary_large_image'); raw=meta(raw,'twitter:title',title); raw=meta(raw,'twitter:description',trim(desc))
 if kind in ('article','page'): raw=toc(raw,p,k)
 if 'assets/css/seo-enhancements.css' not in raw: raw=re.sub(r'</head>','<link rel="stylesheet" href="/assets/css/seo-enhancements.css">\n</head>',raw,count=1,flags=re.I)
 page.write_text(raw,encoding='utf-8')

# Complete sitemap from real HTML files; exclude 404 and recipe template.
urls=[]
for p in allp:
 path=pathof(p)
 if path=='/recipes/recipe-template.html':continue
 urls.append(path)
today=datetime.date.today().isoformat(); out=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for u in sorted(set(urls)): out += ['  <url>',f'    <loc>{DOMAIN}{escape(u)}</loc>',f'    <lastmod>{today}</lastmod>','  </url>']
out.append('</urlset>'); (ROOT/'sitemap.xml').write_text('\n'.join(out)+'\n',encoding='utf-8')
print(f'SEO build complete: {len(allp)} HTML pages; sitemap URLs: {len(set(urls))}.')
