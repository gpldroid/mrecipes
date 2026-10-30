# MRecipes SEO audit — initial findings

This repository-level preflight is intended to check HTML files and the sitemap on every pull request, push to `main`, manual run, and weekly schedule. It does not claim that Google has indexed any URL; that can only be checked in Google Search Console or another verified search-console source.

## Baseline snapshot

- Default branch inspected: `main`
- Tree SHA at inspection: `3b6a6313db3c727c59921b2f2fa6612e37866798`
- HTML files in repository tree: 277
- URLs in `sitemap.xml`: 275
- Duplicate sitemap URLs found in the initial local content inspection: 0
- Latest completed CI audit after running the same metadata-generation steps as the Pages build: 276 HTML pages checked, 275 sitemap URLs, 190 Recipe JSON-LD blocks, 0 errors, 13 warnings (all 13 were long title tags; a title-length cap has since been added and is awaiting its next CI run).
- `recipes/recipe-template.html` is marked `noindex,follow` and was not found in the sitemap.
- `robots.txt` allows crawling and declares `https://mrecipes.online/sitemap.xml`.

## Confirmed sample-level issues

1. Five English recipe pages initially had incomplete Recipe JSON-LD (`creamy-garlic-chicken`, `creamy-garlic-parmesan-chicken`, `classic-pancakes`, `mediterranean-pasta`, and `chocolate-chip-cookies`). Their schema was completed on the audit branch using the ingredient lists, instructions, prep/cook times, and yield already visible on each page; no ratings or nutrition data were invented.
2. The production Pages build generates reciprocal `hreflang` tags from the available locale inventory. The audit initially misreported localized homepage reciprocity because it treated `/ar/index.html` as the canonical URL instead of `/ar/`; this checker logic has been corrected.
3. `pages/privacy-policy.html` explicitly describes itself as a starter policy and says it must be customized to reflect the actual services. This is a publication/compliance task, not something that can be safely guessed from HTML alone.
4. The repository contains language landing pages at `ar/index.html`, `es/index.html`, `fr/index.html`, and `ru/index.html`; sitemap entries use the corresponding trailing-slash URLs. The audit resolves directory URLs to their `index.html` files.

## Important limitations

- A static audit can verify repository markup and local asset paths, but it cannot prove Google indexing, rendered production behavior, HTTP response codes, canonical handling at the CDN, Core Web Vitals, or rich-result eligibility in Google's live systems.
- Do not add made-up recipe nutrition, ratings, reviews, or publication dates to structured data.
- Do not remove existing translated pages or alter the site architecture as part of SEO cleanup.
- Review all warnings from the automated run and repair only confirmed issues. Do not automatically rewrite hundreds of pages without reviewing the resulting diffs.

## Current status

- The audit workflow passed with **0 errors** after running the site's metadata generation and locale validation scripts.
- The remaining warnings in that run were 13 long title tags across English and translated pages. The SEO build script now caps generated titles at 60 characters; the follow-up CI run must confirm the warning count is cleared.
- The privacy policy still needs owner review against the actual analytics, advertising, hosting, cookie, and contact configuration. Do not represent the generic policy as legally reviewed.
- Production deployment and live HTTP/Search Console checks remain separate verification steps; a successful static audit does not prove Google indexing.
