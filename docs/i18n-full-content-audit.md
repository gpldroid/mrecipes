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
