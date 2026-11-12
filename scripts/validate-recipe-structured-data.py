#!/usr/bin/env python3
"""Validate core Recipe JSON-LD fields and page/schema consistency."""
from __future__ import annotations
import json
import re
import sys
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DOMAIN = "https://mrecipes.online"
LOCALES = {"ar", "fr", "es", "ru"}

class Page(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.canonical = ""
        self.language = ""
        self.title = ""
        self._title = False
        self._title_parts: list[str] = []
        self.schemas: list[object] = []
        self._json = False
        self._json_parts: list[str] = []
    def handle_starttag(self, tag, attrs) -> None:
        attrs = dict(attrs)
        if tag == "html":
            self.language = (attrs.get("lang") or "").lower()
        elif tag == "link" and "canonical" in (attrs.get("rel") or "").lower().split():
            self.canonical = (attrs.get("href") or "").strip()
        elif tag == "title":
            self._title = True
            self._title_parts = []
        elif tag == "script" and (attrs.get("type") or "").lower() == "application/ld+json":
            self._json = True
            self._json_parts = []
    def handle_data(self, data: str) -> None:
        if self._title:
            self._title_parts.append(data)
        if self._json:
            self._json_parts.append(data)
    def handle_endtag(self, tag: str) -> None:
        if tag == "title" and self._title:
            self.title = " ".join("".join(self._title_parts).split())
            self._title = False
        if tag == "script" and self._json:
            raw = "".join(self._json_parts).strip()
            if raw:
                try:
                    self.schemas.append(json.loads(raw))
                except json.JSONDecodeError as exc:
                    raise ValueError(f"invalid JSON-LD: {exc}") from exc
            self._json = False
            self._json_parts = []

def walk(value):
    if isinstance(value, list):
        for item in value:
            yield from walk(item)
    elif isinstance(value, dict):
        types = value.get("@type", [])
        if isinstance(types, str):
            types = [types]
        if "Recipe" in types:
            yield value
        for key, child in value.items():
            if key != "@context":
                yield from walk(child)

def recipe_page(path: Path) -> bool:
    rel = path.relative_to(ROOT).as_posix()
    return (rel.startswith("recipes/") and rel.endswith(".html")
            and rel != "recipes/recipe-template.html") or rel.startswith("ar/article/") and rel.endswith(".html")

def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []
    count = 0
    for path in sorted(ROOT.rglob("*.html")):
        if ".git" in path.parts or not recipe_page(path):
            continue
        count += 1
        page = Page()
        try:
            page.feed(path.read_text(encoding="utf-8"))
        except (OSError, ValueError) as exc:
            errors.append(f"{path}: {exc}")
            continue
        nodes = [node for schema in page.schemas for node in walk(schema)]
        parts = path.relative_to(ROOT).parts
        expected_locale = parts[0] if parts[0] in LOCALES else "en"
        if page.language != expected_locale:
            errors.append(f"{path}: html lang={page.language!r}, expected {expected_locale!r}")
        if not page.canonical or not page.canonical.startswith(DOMAIN + "/"):
            errors.append(f"{path}: missing or invalid canonical")
        if not nodes:
            if expected_locale == "ar":
                # Arabic article HTML is a lightweight shell; its shared JS module
                # injects Recipe JSON-LD after loading the recipe data.
                generator = ROOT / "assets" / "js" / "ar-recipes.js"
                try:
                    source = generator.read_text(encoding="utf-8")
                except OSError:
                    errors.append(f"{path}: missing Arabic dynamic Recipe JSON-LD generator")
                    continue
                required_fragments = (
                    "'@type':'Recipe'", "'name':r.title", "'description':r.description",
                    "'image':[imageUrl]", "'publisher':{'@type':'Organization'",
                    "'url':canonical", "'inLanguage':'ar'",
                    "'recipeIngredient':r.ingredients",
                    "'recipeInstructions':r.instructions.map",
                )
                missing = [fragment for fragment in required_fragments if fragment not in source]
                if missing:
                    errors.append(f"{path}: Arabic dynamic Recipe schema is missing fields: {missing}")
                continue
            errors.append(f"{path}: missing Recipe JSON-LD")
            continue
        for index, node in enumerate(nodes, 1):
            label = f"{path} Recipe[{index}]"
            for field in ("name", "description", "image"):
                if not node.get(field):
                    errors.append(f"{label}: missing core field {field}")
            images = node.get("image", [])
            if isinstance(images, str):
                images = [images]
            if not isinstance(images, list) or not images:
                errors.append(f"{label}: image must contain at least one image URL")
            else:
                for image in images:
                    if not isinstance(image, str) or urlparse(image).scheme not in ("http", "https"):
                        errors.append(f"{label}: invalid image URL {image!r}")
            if node.get("inLanguage") != expected_locale:
                errors.append(f"{label}: inLanguage must be {expected_locale}")
            if node.get("url") != page.canonical:
                errors.append(f"{label}: url must match canonical")
            main_entity = node.get("mainEntityOfPage")
            main_id = main_entity.get("@id") if isinstance(main_entity, dict) else main_entity
            if main_id != page.canonical:
                errors.append(f"{label}: mainEntityOfPage must match canonical")
            author = node.get("author")
            if not isinstance(author, dict) or author.get("@type") != "Person" or not author.get("name"):
                errors.append(f"{label}: author must identify a Person")
            publisher = node.get("publisher")
            if not isinstance(publisher, dict) or publisher.get("@type") != "Organization" or publisher.get("name") != "MRecipes":
                errors.append(f"{label}: publisher must identify MRecipes Organization")
            ingredients = node.get("recipeIngredient")
            if not isinstance(ingredients, list) or not ingredients or any(not str(item).strip() for item in ingredients):
                errors.append(f"{label}: recipeIngredient must be a non-empty list of ingredient text")
            instructions = node.get("recipeInstructions")
            if not instructions or (isinstance(instructions, list) and not instructions):
                errors.append(f"{label}: recipeInstructions must not be empty")
            elif isinstance(instructions, list):
                for step in instructions:
                    if isinstance(step, str) and step.strip():
                        continue
                    if not isinstance(step, dict):
                        errors.append(f"{label}: recipeInstructions entries must be text, HowToStep, or HowToSection")
                        continue
                    step_type = step.get("@type")
                    if step_type == "HowToStep" and step.get("text"):
                        continue
                    if step_type == "HowToSection" and step.get("name") and step.get("itemListElement"):
                        continue
                    errors.append(f"{label}: recipeInstructions entries must contain valid HowToStep or HowToSection content")
            for field in ("prepTime", "cookTime", "totalTime"):
                value = node.get(field)
                if not isinstance(value, str) or not re.fullmatch(r"P(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+S)?)?", value):
                    errors.append(f"{label}: {field} must be a valid ISO 8601 duration")
            for field in ("datePublished", "dateModified"):
                value = node.get(field)
                try:
                    date.fromisoformat(value)
                except (TypeError, ValueError):
                    warnings.append(f"{label}: {field} is missing or not YYYY-MM-DD")
            if not node.get("recipeYield"):
                warnings.append(f"{label}: recipeYield is missing")
            if not node.get("recipeCategory"):
                warnings.append(f"{label}: recipeCategory is missing")
    if count == 0:
        errors.append("No recipe pages found.")
    if warnings:
        print("Recipe schema warnings:")
        for warning in warnings:
            print(" - " + warning)
    if errors:
        print(f"Recipe structured-data validation failed with {len(errors)} error(s):")
        for error in errors:
            print(" - " + error)
        return 1
    print(f"Recipe structured-data validation passed: {count} recipe pages checked across five locales.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
