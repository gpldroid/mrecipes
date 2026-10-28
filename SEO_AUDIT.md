# MRecipes SEO audit — initial findings

This repository-level preflight is intended to check HTML files and the sitemap on every pull request, push to `main`, manual run, and weekly schedule. It does not claim that Google has indexed any URL; that can only be checked in Google Search Console or another verified search-console source.

## Baseline snapshot

- Default branch inspected: `main`
- Tree SHA at inspection: `3b6a6313db3c727c59921b2f2fa6612e37866798`
- HTML files in repository tree: 277
- URLs in `sitemap.xml`: 275
- Duplicate sitemap URLs found in the initial local content inspection: 0
- `recipes/recipe-template.html` is marked `noindex,follow` and was not found in the sitemap.
- `robots.txt` allows crawling and declares `https://mrecipes.online/sitemap.xml`.

## Confirmed sample-level issues

1. The English page `recipes/creamy-garlic-parmesan-chicken.html` has a Recipe JSON-LD block with only `name`, `image`, `description`, and `author`; it omits ingredients, instructions, yield, and timing that are visible in the page. The Arabic equivalent includes more complete Recipe data.
2. The Arabic, French, Spanish, and Russian sample pages link to all five language versions with `hreflang`. The sampled English recipe page does not include corresponding `hreflang` links, so the language cluster is not reciprocal.
3. `pages/privacy-policy.html` explicitly describes itself as a starter policy and says it must be customized to reflect the actual services. This is a publication/compliance task, not something that can be safely guessed from HTML alone.
4. The repository contains language landing pages at `ar/index.html`, `es/index.html`, `fr/index.html`, and `ru/index.html`; sitemap entries use the corresponding trailing-slash URLs. The audit resolves directory URLs to their `index.html` files.

## Important limitations

- A static audit can verify repository markup and local asset paths, but it cannot prove Google indexing, rendered production behavior, HTTP response codes, canonical handling at the CDN, Core Web Vitals, or rich-result eligibility in Google's live systems.
- Do not add made-up recipe nutrition, ratings, reviews, or publication dates to structured data.
- Do not remove existing translated pages or alter the site architecture as part of SEO cleanup.
- Review all warnings from the automated run and repair only confirmed issues. Do not automatically rewrite hundreds of pages without reviewing the resulting diffs.
