#!/usr/bin/env python3
"""Localize recipe keyword targeting and Recipe structured data for all MRecipes locales."""
from pathlib import Path
from html import escape
from html.parser import HTMLParser
import json
import re

ROOT = Path(__file__).resolve().parents[1]
LOCALES = {"en", "ar", "fr", "es", "ru"}
CATEGORY = {
    "en": {"dinner":"dinner","breakfast":"breakfast","lunch":"lunch","dessert":"dessert","baking":"baking","soup":"soup","snack":"snack","salad":"salad","main course":"main course","side dish":"side dish"},
    "ar": {"dinner":"العشاء","breakfast":"الفطور","lunch":"الغداء","dessert":"الحلويات","baking":"المخبوزات","soup":"الشوربات","snack":"الوجبات الخفيفة","salad":"السلطات","main course":"الأطباق الرئيسية","side dish":"الأطباق الجانبية"},
    "fr": {"dinner":"dîner","breakfast":"petit-déjeuner","lunch":"déjeuner","dessert":"desserts","baking":"pâtisserie","soup":"soupes","snack":"collations","salad":"salades","main course":"plats principaux","side dish":"accompagnements"},
    "es": {"dinner":"cena","breakfast":"desayuno","lunch":"almuerzo","dessert":"postres","baking":"repostería","soup":"sopas","snack":"aperitivos","salad":"ensaladas","main course":"platos principales","side dish":"guarniciones"},
    "ru": {"dinner":"ужин","breakfast":"завтрак","lunch":"обед","dessert":"десерты","baking":"выпечка","soup":"супы","snack":"закуски","salad":"салаты","main course":"основные блюда","side dish":"гарниры"},
}
HOME_KEYWORDS = {
    "en": ["easy homemade recipes","quick dinner recipes","simple breakfast ideas","easy lunch recipes","homemade dessert recipes","step-by-step cooking recipes"],
    "ar": ["وصفات منزلية سهلة","وصفات عشاء سريعة","أفكار فطور سهلة","وصفات غداء منزلية","وصفات حلويات منزلية","وصفات طبخ خطوة بخطوة"],
    "fr": ["recettes faciles et maison","recettes rapides pour le dîner","idées de petit-déjeuner","recettes simples pour le déjeuner","recettes de desserts maison","recettes étape par étape"],
    "es": ["recetas caseras fáciles","recetas rápidas para la cena","ideas para el desayuno","recetas fáciles para el almuerzo","recetas de postres caseros","recetas paso a paso"],
    "ru": ["простые домашние рецепты","быстрые рецепты на ужин","идеи для завтрака","простые рецепты обеда","домашние десерты","пошаговые рецепты"],
}
INDEX_KEYWORDS = {
    "en": ["all recipes","easy recipes","quick meals","homemade cooking","family dinner ideas","breakfast lunch and dinner recipes"],
    "ar": ["جميع الوصفات","وصفات سهلة","وجبات سريعة","طبخ منزلي","أفكار عشاء للعائلة","وصفات الفطور والغداء والعشاء"],
    "fr": ["toutes les recettes","recettes faciles","repas rapides","cuisine maison","idées de dîner en famille","recettes du petit-déjeuner et du déjeuner"],
    "es": ["todas las recetas","recetas fáciles","comidas rápidas","cocina casera","ideas de cenas familiares","recetas de desayuno y almuerzo"],
    "ru": ["все рецепты","простые рецепты","быстрые блюда","домашняя кухня","идеи семейного ужина","рецепты завтрака и обеда"],
}

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.h1 = []
        self.meta_keywords = ""
        self.in_h1 = False
        self.schemas = []
        self.in_json = False
        self.json_parts = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta" and attrs.get("name", "").lower() == "keywords":
            self.meta_keywords = attrs.get("content", "").strip()
        if tag == "h1":
            self.in_h1 = True
        if tag == "script" and attrs.get("type", "").lower() == "application/ld+json":
            self.in_json = True
            self.json_parts = []
    def handle_data(self, data):
        if self.in_h1:
            self.h1.append(data)
        if self.in_json:
            self.json_parts.append(data)
    def handle_endtag(self, tag):
        if tag == "h1":
            self.in_h1 = False
        if tag == "script" and self.in_json:
            raw = "".join(self.json_parts).strip()
            if raw:
                try:
                    self.schemas.append(json.loads(raw))
                except json.JSONDecodeError:
                    pass
            self.in_json = False
            self.json_parts = []

def locale_for(path):
    parts = path.parts
    # These FR/ES/RU article URLs currently serve English duplicate content.
    # Keep their HTML and Recipe schema language truthful until real translations ship.
    if len(parts) > 1 and parts[0] in {"fr", "es", "ru"} and parts[1] == "article":
        return "en"
    return parts[0] if parts and parts[0] in {"ar","fr","es","ru"} else "en"

def text_content(value):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", value)).strip()

def recipe_nodes(value):
    if isinstance(value, list):
        for item in value:
            yield from recipe_nodes(item)
    elif isinstance(value, dict):
        types = value.get("@type", [])
        if isinstance(types, str):
            types = [types]
        if "Recipe" in types:
            yield value
        for key, child in value.items():
            if key not in {"@context"}:
                yield from recipe_nodes(child)

def phrases_for(locale, dish, category):
    category_value = str(category or "").strip().lower()
    localized_values = {value.lower() for value in CATEGORY[locale].values()}
    c = CATEGORY[locale].get(category_value, category_value if category_value in localized_values else "")
    dish = re.sub(r"\s+", " ", str(dish or "")).strip(" .|—-")
    if not dish:
        return []
    templates = {
        "en": [f"{dish} recipe", f"easy {dish} recipe", f"homemade {dish}", f"how to make {dish}", f"easy {c} recipes" if c else ""],
        "ar": [f"وصفة {dish}", f"طريقة {dish}", f"طريقة تحضير {dish}", f"وصفة {dish} سهلة", f"وصفات {c}" if c else ""],
        "fr": [f"recette {dish}", f"recette facile {dish}", f"comment préparer {dish}", f"{dish} fait maison", f"recettes faciles de {c}" if c else ""],
        "es": [f"receta de {dish}", f"receta fácil de {dish}", f"cómo preparar {dish}", f"{dish} casero", f"recetas fáciles de {c}" if c else ""],
        "ru": [f"рецепт {dish}", f"простой рецепт {dish}", f"как приготовить {dish}", f"{dish} по-домашнему", f"простые рецепты: {c}" if c else ""],
    }
    return templates[locale]

def clean_keywords(items, limit=8):
    result, seen = [], set()
    for item in items:
        item = re.sub(r"\s+", " ", str(item or "")).strip(" ,;.")
        key = item.casefold()
        if item and key not in seen and len(item) <= 90:
            seen.add(key)
            result.append(item)
        if len(result) >= limit:
            break
    return result

def replace_meta(html, name, values):
    content = escape(", ".join(values), quote=True)
    tag = f'<meta name="{name}" content="{content}">'
    pattern = re.compile(r'<meta\b(?=[^>]*\bname=["\']' + re.escape(name) + r'["\'])[^>]*>', re.I)
    if pattern.search(html):
        return pattern.sub(tag, html, count=1)
    return re.sub(r"</head\s*>", tag + "\n</head>", html, count=1, flags=re.I)

def localized_category(locale, category):
    return CATEGORY[locale].get(str(category or "").strip().lower(), category)

def update_jsonld(html, locale):
    pattern = re.compile(r'(<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>)(.*?)(</script\s*>)', re.I | re.S)
    changed = False
    def replace(match):
        nonlocal changed
        try:
            data = json.loads(match.group(2).strip())
        except json.JSONDecodeError:
            return match.group(0)
        nodes = list(recipe_nodes(data))
        if not nodes:
            return match.group(0)
        for node in nodes:
            dish = node.get("name", "")
            category = node.get("recipeCategory", "")
            localized = localized_category(locale, category)
            node["recipeCategory"] = localized
            node["inLanguage"] = locale
            node["keywords"] = ", ".join(clean_keywords(phrases_for(locale, dish, category), 8))
            # The repository's editorial specification requires a named human author.
            node["author"] = {"@type": "Person", "name": "Imad Limrani"}
        changed = True
        return match.group(1) + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + match.group(3)
    return pattern.sub(replace, html), changed

def main():
    pages = sorted(p for p in ROOT.rglob("*.html") if ".git" not in p.parts and p.name != "404.html")
    recipe_count = 0
    landing_count = 0
    for page in pages:
        relative = page.relative_to(ROOT)
        locale = locale_for(relative)
        html = page.read_text(encoding="utf-8")
        parser = PageParser()
        parser.feed(html)
        h1 = text_content(" ".join(parser.h1))
        path = "/" + relative.as_posix()
        is_home = path in {"/index.html", "/ar/index.html", "/fr/index.html", "/es/index.html", "/ru/index.html"}
        is_index = path in {"/recipes.html", "/ar/recipes.html", "/fr/recipes.html", "/es/recipes.html", "/ru/recipes.html"}
        html, has_recipe = update_jsonld(html, locale)
        if has_recipe:
            dish = next((node.get("name", "") for schema in parser.schemas for node in recipe_nodes(schema)), h1)
            category = next((node.get("recipeCategory", "") for schema in parser.schemas for node in recipe_nodes(schema)), "")
            # Re-read the already localized JSON-LD to build matching page-level keywords.
            updated_parser = PageParser()
            updated_parser.feed(html)
            nodes = [node for schema in updated_parser.schemas for node in recipe_nodes(schema)]
            if nodes:
                dish = nodes[0].get("name", dish)
                category = nodes[0].get("recipeCategory", category)
            keywords = clean_keywords(phrases_for(locale, dish or h1, category), 8)
            html = replace_meta(html, "keywords", keywords)
            recipe_count += 1
        elif is_home or is_index:
            keywords = HOME_KEYWORDS[locale] if is_home else INDEX_KEYWORDS[locale]
            html = replace_meta(html, "keywords", keywords)
            landing_count += 1
        page.write_text(html, encoding="utf-8")
    # Fail the build if any localized recipe page is missing locale-specific GEO signals.
    checked = 0
    locale_counts = {code: 0 for code in sorted(LOCALES)}
    for page in pages:
        relative = page.relative_to(ROOT)
        locale = locale_for(relative)
        check = PageParser()
        rendered = page.read_text(encoding="utf-8")
        check.feed(rendered)
        nodes = [node for schema in check.schemas for node in recipe_nodes(schema)]
        if not nodes:
            continue
        checked += 1
        locale_counts[locale] += 1
        for node in nodes:
            if node.get("inLanguage") != locale:
                raise SystemExit(f"{page}: Recipe inLanguage does not match {locale}")
            if not isinstance(node.get("keywords"), str) or not node["keywords"].strip():
                raise SystemExit(f"{page}: missing localized Recipe keywords")
            author = node.get("author", {})
            if not isinstance(author, dict) or author.get("name") != "Imad Limrani":
                raise SystemExit(f"{page}: missing named Recipe author")
        if not check.meta_keywords:
            raise SystemExit(f"{page}: missing localized page keyword metadata")
    required_recipe_locales = {"en", "ar"}
    missing_locales = [code for code in sorted(required_recipe_locales) if locale_counts.get(code, 0) == 0]
    if missing_locales:
        raise SystemExit("No source Recipe pages found for: " + ", ".join(missing_locales))
    print(
        f"SEO/GEO keyword localization and validation passed: {checked} eligible Recipe pages "
        f"and {landing_count} landing/index pages; source Recipe locales: EN and AR. "
        f"FR/ES/RU English duplicates remain noindex until translated; counters: {locale_counts}."
    )

if __name__ == "__main__":
    main()
