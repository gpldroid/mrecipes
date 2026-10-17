# MRecipes SEO Roadmap

Last reviewed: 2026-10-17

## Scope and evidence

This roadmap combines a technical baseline review with an editorial keyword map. The priority order below is an editorial hypothesis, **not** a verified search-volume or keyword-difficulty ranking. Validate demand with Google Search Console, Google Keyword Planner, Google Trends, and (if available) Ahrefs/Semrush before assigning volume or difficulty numbers.

## Phase 1 — Technical foundation (week 1–2)

- [x] Keep a self-referencing canonical on each homepage.
- [x] Add reciprocal `hreflang` annotations for the English and Arabic homepages, plus `x-default`.
- [ ] Check every indexable HTML page has a unique, descriptive title and meta description.
- [ ] Verify each recipe's Recipe JSON-LD exactly matches visible ingredients, instructions, yield, time, image, and author.
- [ ] Verify all sitemap URLs return 200, are canonical, and are indexable; remove any redirects, 404s, and noindex URLs.
- [ ] Update sitemap `lastmod` only when the corresponding page meaningfully changes.
- [ ] Check internal links, image alt text, mobile usability, HTTPS, and Core Web Vitals.
- [ ] Run the existing GitHub Actions workflow and test representative URLs with Google's Rich Results Test and URL Inspection.

## Phase 2 — Keyword validation

For each topic below, record country/market, language, average monthly searches, trend/seasonality, ranking difficulty (if available), search intent, and a manual review of the current top 10 results. Do not compare English and Arabic volumes as if they were one market.

### Initial English editorial priority

| Priority | Primary topic / target query | Supporting queries | Intent / content angle |
|---:|---|---|---|
| 1 | easy fudgy brownies | fudgy brownies, easy brownie recipe | Recipe; tested texture and clear doneness cues |
| 2 | chicken and rice recipe | one pan chicken and rice, easy chicken rice dinner | Recipe; weeknight meal |
| 3 | chocolate chip cookies recipe | soft chocolate chip cookies, easy chocolate chip cookies | Recipe; texture troubleshooting |
| 4 | baked chicken breast | juicy baked chicken breast, oven baked chicken breast | Recipe; temperature and doneness guidance |
| 5 | overnight oats | overnight oats recipe, overnight oats with yogurt | Recipe; make-ahead breakfast |
| 6 | potato wedges | crispy potato wedges, oven baked potato wedges | Recipe; crispness troubleshooting |
| 7 | tomato pasta recipe | easy tomato pasta, one pot tomato pasta | Recipe; simple dinner |
| 8 | chickpea curry | easy chickpea curry, vegan chickpea curry | Recipe; plant-based meal |
| 9 | baked chicken thighs | crispy baked chicken thighs, oven baked chicken thighs | Recipe; skin crispness and doneness |
| 10 | scrambled eggs on toast | creamy scrambled eggs, eggs on toast | Recipe; breakfast |
| 11 | no bake chocolate oat bars | chocolate oat bars, no bake oat bars | Recipe; no-oven snack |
| 12 | ground beef and rice | ground beef rice skillet, beef and rice recipe | Recipe; one-pan dinner |
| 13 | roasted chickpea bowl | roasted chickpeas and vegetables, chickpea bowl | Recipe; vegetarian meal |
| 14 | garlic butter pasta | 15 minute garlic butter pasta, easy garlic pasta | Recipe; quick meal |
| 15 | lentil salad | high protein lentil salad, meal prep lentil salad | Recipe; meal prep |

Before publishing a new URL, search the existing sitemap and site for the topic. Update an existing relevant page rather than creating a competing page when search intent overlaps.

## Phase 3 — Arabic localization

Treat Arabic as a separate search channel, not a word-for-word translation. Research country-specific wording before choosing a target market (for example, Morocco, Egypt, Saudi Arabia, or the Gulf).

Starter query ideas to validate:
- طريقة عمل البراونيز / براونيز الشوكولاتة
- طريقة عمل الدجاج بالأرز
- كوكيز برقائق الشوكولاتة
- صدور دجاج في الفرن
- الشوفان الليلي
- بطاطس ودجز في الفرن (compare regional alternatives)
- معكرونة بصلصة الطماطم
- كاري الحمص

For each translated page, use a dedicated URL, correct `lang` and text direction, localized title/description and recipe copy, a self-referencing canonical, and reciprocal `hreflang` only when a true equivalent exists. Do not add alternate-language annotations between pages that are not equivalent, and do not auto-redirect users solely by inferred location.

## Phase 4 — Recipe publishing checklist

- [ ] The recipe has actually been cooked and tested; quantities, yield, prep/cook/total time are accurate.
- [ ] Original introduction explains the result and useful context; avoid generic filler.
- [ ] Ingredients and numbered steps are complete and consistent.
- [ ] Add original or properly licensed images with descriptive alt text.
- [ ] Include practical substitutions, storage guidance, and relevant food-safety details.
- [ ] Attribute the author and disclose meaningful testing/editing practices.
- [ ] Recipe JSON-LD matches visible content exactly; validate it before publishing.
- [ ] Add internal links to relevant recipes and a useful category/collection page.
- [ ] Confirm title, meta description, canonical, language annotations, indexability, and sitemap inclusion.
- [ ] Do not publish the editorial template or placeholder content as a recipe.

## Phase 5 — Measurement and iteration (weeks 3–12)

1. Connect and verify the domain in Google Search Console; submit `https://mrecipes.online/sitemap.xml`.
2. Record a baseline for clicks, impressions, CTR, average position, indexed pages, and recipe rich-result status.
3. Publish a small batch of fully tested recipes, starting with the highest validated opportunities.
4. Review Search Console query/page pairs every 2–4 weeks. Improve pages with impressions but weak CTR, or relevant queries where the page does not fully satisfy intent.
5. Expand into related topics only after checking cannibalization and the quality of the current search results.
6. Review performance by language and target country separately.

## Success measures

Track organic clicks and impressions by page/query/country/language, index coverage, valid Recipe enhancements, CTR, and useful engagement. Rankings and traffic are not guaranteed; use observed data to revise the order.
