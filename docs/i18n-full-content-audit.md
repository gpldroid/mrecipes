# Full-site multilingual content migration — audit baseline

## Approved editorial rules

- Scope: the entire website, not only the navigation or page titles.
- Languages: English (EN) is the source of truth; Arabic (AR), French (FR), Spanish (ES), and Russian (RU) are localized editions.
- Attribution: preserve the original author attribution only. Do not invent a translator or reviewer credit.
- Recipe integrity: keep the original ingredient quantities and method. Add conversions only when mathematically defensible, clearly labelled as equivalents, and never silently replace the source measurement.
- Safety: preserve existing files and assets in Git history; make edits only on a dedicated branch and review the full diff before merge.
- Release: publish as one coordinated release only after the whole-site content and technical checks pass.

## Repository inventory observed on 2026-10-25

The repository is a static HTML site using GitHub Pages and a GitHub Actions workflow. Recipe pages contain HTML and Schema.org Recipe JSON-LD.

The tracked `sitemap.xml` contains **275 URLs**:

| Locale | Total URLs | Recipe pages | Information/legal pages | Home/index pages |
|---|---:|---:|---:|---:|
| EN | 55 | 48 | 5 | 2 |
| AR | 55 | 48 | 5 | 2 |
| FR | 55 | 48 | 5 | 2 |
| ES | 55 | 48 | 5 | 2 |
| RU | 55 | 48 | 5 | 2 |
| **Total** | **275** | **240** | **25** | **10** |

The EN recipe paths are `/recipes/<slug>.html`; localized recipe paths currently use `/<locale>/article/<slug>.html`. Localized informational pages live under `/<locale>/pages/`. These counts describe sitemap entries, not proof that the corresponding article bodies are complete.

## Confirmed content-quality issue from a five-file comparison

A direct full-file comparison was made for the same recipe, `apple-cinnamon-crumble-bars`, across EN, AR, FR, ES and RU:

- EN source file: 8,771 characters and seven main article headings; its visible main text is about 3,528 characters.
- AR version: 5,580 characters and four main article headings; visible main text is about 966 characters.
- FR version: 6,223 characters and four main article headings; visible main text is about 1,242 characters.
- ES version: 5,986 characters and four main article headings; visible main text is about 1,142 characters.
- RU version: 5,901 characters and four main article headings; visible main text is about 1,112 characters.

The localized example keeps the ingredient count and five cooking steps, but omits multiple source sections (including the fuller method context, storage/make-ahead and serving guidance), and its ingredient/schema text still contains English fragments such as “light”, “divided”, “for apples”, “cold”, and “cubed”. This is a verified sample finding, not a claim that every page has the same defects.

The existing localized privacy-policy sample is also materially shorter than the English policy and omits several sections present in the EN source. Therefore sitemap parity and translated titles alone are not acceptable completion criteria.

## Execution plan

1. Run `scripts/audit-i18n-content.py` to produce a per-recipe/per-locale triage table for missing files, visible-text length, ingredient/step count, HTML language/direction, and common untranslated English fragments.
2. Review every EN recipe as the source contract: title/description, full editorial sections, ingredient list, numbered method, timings/yield, image alt text, FAQ or storage/serving notes when present, and Recipe JSON-LD.
3. Rewrite the complete localized article body and metadata for each of the 48 recipes in AR/FR/ES/RU. Translate all recipe schema fields as well as visible HTML. Keep quantities and steps semantically equivalent; add unit conversions only as explicitly labelled equivalents.
4. Translate the homepages, recipe indexes, and all five informational/legal pages for each localized edition. Legal text must retain the meaning and qualifications of the EN source; do not remove caveats to make a translation shorter.
5. Preserve the author attribution found in the source; reconcile visible attribution with JSON-LD without inventing authorship. Where EN itself has inconsistent author metadata, flag it for a deliberate decision rather than silently changing credit.
6. Run the audit and site validation, inspect diffs for deleted or lost sections, verify hreflang/canonical/sitemap/internal links, and check all recipe JSON-LD against visible content.
7. Keep all work on `i18n/full-content-translation-audit` until all content is translated and checks are clean. Open one reviewable PR for the coordinated release only after the full content pass is actually complete.

## Completion standard

A page is not considered translated merely because its title, metadata, or recipe name is localized. Each article must be reviewed end-to-end against EN, including visible text and JSON-LD. The audit script uses heuristics to prioritize review; it cannot certify translation quality by itself.


## CI diagnostic results from run #297 (2026-10-25)

The draft PR build completed successfully, including the existing site structure/SEO/local-link validator. The diagnostic audit reported:

- Missing recipe pages/files: **0** (all expected recipe paths exist in the sitemap and checkout).
- Localized recipe bodies below 55% of the EN visible-text length: **69**.
- Localized recipe HTML containing known English-residue patterns: **103**.
- Localized Recipe JSON-LD ingredient/step counts differing from EN: **34**.

These counts are triage flags, not automatic proof that every flagged page is incorrect. They do establish that the remaining content requires a full article-by-article pass; the current successful CI run must not be interpreted as proof that the translations are complete. The rewritten apple-cinnamon-crumble-bars pages were separately checked for 11 visible/schema ingredients, 5 visible/schema steps, all six alternate-language links, correct language/direction, and no matches for the current English-residue pattern list.


## Work completed after the initial baseline

- Rewrote `garlic-butter-pasta` fully in Arabic, French, Spanish and Russian using the complete English source article. Each localized version now includes the full visible sections, 10 ingredients and 6 steps, matching Recipe JSON-LD counts, source quantities plus clearly marked approximate conversions, author attribution to Imad Limrani beneath the summary, and all five locale alternates plus x-default.
- Expanded the four localized recipe-index pages (AR/FR/ES/RU) with localized guidance and SEO metadata. The card coverage/loading behavior still needs separate verification.
- Added `scripts/apply-author-attribution.py` to the Pages build. It inserts a localized visible byline for Imad Limrani beneath a detected summary or, if no summary marker exists, the first content paragraph. The transform is idempotent and validates visible attribution coverage on pages containing `<main>`.
- CI run #304 completed successfully after the author-attribution step and index rewrites. Later article changes are being checked in subsequent runs.

## Remaining work (explicit)

Four recipes have been fully rewritten and structurally checked across AR/FR/ES/RU so far: `apple-cinnamon-crumble-bars`, `garlic-butter-pasta`, `overnight-oats`, and `avocado-toast`. The remaining 44 recipes in each target language, all informational/legal pages, and the complete localization of the homepages and recipe indexes still require article-level translation/review. The earlier heuristic flags remain a useful backlog, not a substitute for linguistic review.


- Fully translated `overnight-oats` into AR/FR/ES/RU, preserving 9 ingredients and 5 steps in both visible HTML and Recipe JSON-LD, with localized SEO and author byline.


## Work completed on 2026-10-25 — avocado-toast

- Rewrote `ar/article/avocado-toast.html`, `fr/article/avocado-toast.html`, `es/article/avocado-toast.html`, and `ru/article/avocado-toast.html` as full localized recipe pages, replacing the Arabic placeholder and English-copy leakage in the other localized editions.
- Localized page titles, descriptions, Open Graph/Twitter metadata, visible article text, ingredient lists, instructions, tips, serving/storage guidance, FAQ, image alt text, and Recipe JSON-LD.
- Preserved the English source quantities and cooking method (7 ingredients, 5 steps; 8 minutes prep, 3 minutes cooking, 2 servings), added all five hreflang alternates plus x-default, and credited Imad Limrani visibly and in Recipe JSON-LD.
- Structural check is limited to the generated content and repository reads. A live browser/visual check has not been completed. The current full-site migration remains incomplete: 4 of 48 recipes are rewritten across the four target locales, leaving 44 per target locale plus informational/legal pages and remaining site-wide UI/index review.
