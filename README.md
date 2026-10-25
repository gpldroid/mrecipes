# MRecipes

Mobile-first recipe website for **https://mrecipes.online/**. Preserve the existing recipe content and Supabase fallback behavior while using the shared architecture below.

## Project structure

- `index.html` — English homepage
- `ar/index.html` — Arabic landing page
- `recipes/recipe-template.html` — noindex editorial starter; replace placeholders before creating a recipe
- `recipes/*.html` — crawlable recipe pages with Recipe JSON-LD
- `pages/about.html`, `pages/contact.html`, `pages/privacy-policy.html`, `pages/terms.html`, `pages/disclaimer.html` — organized information/legal pages
- Informational and legal pages live only under `pages/`; keep canonical URLs and navigation links aligned with these paths.
- `assets/css/main.css` — shared site styling
- `assets/css/mobile-nav.css` — mobile navigation accessibility and safe-area rules
- `assets/js/components/header.js` and `assets/js/components/footer.js` — shared header/footer
- `assets/js/main.js` — search, recipe queries, comments, and common behavior
- `assets/images/recipes/` — licensed, optimized recipe photography
- `supabase/schema.sql` — schema and RLS policies
- `robots.txt`, `sitemap.xml`, `CNAME` — crawl and custom-domain configuration
- `.github/workflows/pages.yml` — structure/SEO validation and GitHub Pages deployment

Every recipe must have original tested instructions, accurate quantities, JSON-LD that matches visible content, and author attribution to **Imad Limrani**. Avoid publishing the template as a recipe.

## Supabase (Free Tier)

Run `supabase/schema.sql` in the Supabase SQL Editor. Configure only the project URL and public publishable key in `assets/js/main.js`; never put a secret or service-role key in browser code. When Supabase is not configured or unavailable, static recipe cards remain available. Comments are submitted as pending for moderation.

## Deployment

Set GitHub Pages source to **GitHub Actions** in repository settings. The workflow checks required files, page metadata, canonical URLs, recipe JSON-LD, local assets, and sitemap targets. A passing validation is not proof that deployment completed; verify the workflow's deploy job and custom-domain HTTPS status.

## Compatibility note

Legacy root-level legal pages and existing `recipes.html` remain available so older links are not broken. New navigation and editorial work should use the structured `pages/` and shared-component paths.

## Recipe photography

- Recipe image files are stored locally at `assets/images/recipes/<recipe-slug>.webp`; the filename follows the recipe page slug.
- `scripts/import-public-domain-recipe-photos.py` prefers a recipe-slug match from [based.cooking](https://github.com/lukesmithxyz/based.cooking), then tries verified dish-specific photo filenames from that repository and the curated [public-domain-recipes collection](https://github.com/ronaldl29/public-domain-recipes).
- Both source repositories declare their content public domain under the Unlicense. The importer validates the downloaded WebP files before replacing local assets.
- Exact dish matches are preferred. Where neither source has an exact photo, the curated mapping remains a closest-available fallback and should be reviewed rather than described as an exact match.
- Shared CSS keeps recipe-card and article images within their containers on mobile, tablet, and large desktop screens.

## Responsive image delivery

The GitHub Pages build runs `scripts/optimize-responsive-images.py` after the recipe-photo import and SEO steps. It generates delivery derivatives in the build workspace; canonical source photos remain WebP files under `assets/images/recipes/` so generated files do not inflate the Git repository.

- Featured recipe images: 1200×675 (16:9), with 480/800/1200-pixel WebP candidates.
- Recipe cards and grids: 600×400, with 320/600-pixel WebP candidates.
- Additional recipe-step images: 800×600, with 400/800-pixel WebP candidates.
- Local images use a `<picture>` WebP source and a generated JPEG fallback. Existing Unsplash images use responsive `srcset`/ `sizes` and Unsplash's `auto=format` content negotiation.
- Images below the initial viewport use `loading="lazy"` and `decoding="async"`; featured images use eager loading and high fetch priority to protect Largest Contentful Paint.
- The build validates local image references after optimization. Generated derivatives are present in the deployed Pages artifact, not necessarily in the source tree when browsing GitHub.


## Internationalization (i18n)

The site is a static HTML/CSS/JavaScript project deployed with GitHub Pages. Localized pages are maintained as HTML files so existing recipe URLs and content remain crawlable. The supported locales are English (`en`, default), Arabic (`ar`, RTL), French (`fr`), Spanish (`es`), and Russian (`ru`).

- `i18n/config.json` documents locale metadata, route patterns, and the SEO `hreflang` codes.
- `i18n/locales/<locale>.json` contains shared UI, recipe, footer, and consent translations. The shared header and footer read these catalogs at runtime and retain inline fallback strings if a catalog cannot be loaded.
- `scripts/validate-i18n.py` checks catalog key parity, sitemap targets, per-locale page inventory, HTML language and Arabic direction, titles/descriptions, canonical URLs, and alternate-language links.
- The Pages workflow runs the i18n validator after SEO metadata and sitemap generation. It does not rewrite or delete the source recipe pages.

### Local validation

Run `python3 scripts/validate-i18n.py` after running `python3 scripts/seo-build-v2.py` and `python3 scripts/seo-description-fix.py`. The validator expects the generated sitemap and `hreflang` metadata to reflect the current set of translated pages.
