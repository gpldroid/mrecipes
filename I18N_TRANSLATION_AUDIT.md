# MRecipes internationalization audit

Audit target: `i18n/full-content-translation-audit`
Audit date: 2026-11-05
Locales: English (source), Arabic, French, Spanish, Russian.

## Repository inventory

The recursive Git tree contains 379 files. It contains 48 recipe article paths in each of the four target locales and five informational pages in each locale. File presence is not proof of completed translation.

## Findings from the checked-in HTML

- Arabic recipe articles: 48 files; 25 are smaller than 2 KB and appear to be short placeholder shells with no recipe body. A representative example is `ar/article/cauliflower-cheese-bake.html` (1,271 bytes): its content-page container is empty and the copy says only that the recipe is available in Arabic.
- French, Spanish, and Russian: each has 48 recipe paths, but 25 matching slugs share the exact same Git blob SHA across all three locales. A representative file, `fr/article/cauliflower-cheese-bake.html`, has `<html lang="en">`, an English title/body, and a canonical URL pointing to the English route. The same English blob is used at the Spanish and Russian paths.
- The French, Spanish, and Russian article directories each contain 48 files, but the 25 identical files are not localized pages; they are copies of English source HTML.
- The four blueberry muffin pages were updated on this branch and have localized content/metadata. This does not resolve the remaining gaps.
- The locale JSON catalogs exist for all four target locales and contain localized navigation/category strings; catalog presence does not fix untranslated recipe HTML.

## Git branch status

The work branch is four commits ahead of `main` but 192 commits behind it. Its merge base is `84a69ea77ce73c5e3a7f67eba68e94a6b668e1c3`. The branch currently differs from its base in the four blueberry muffin article files. It must be reconciled with current `main` before any pull request; do not merge this stale branch blindly.

## Verification limits

This audit used the GitHub recursive tree and direct file reads, plus blob-size/SHA comparisons. It did not run the repository's Python validators or a site build in a local checkout. The scripts `scripts/audit-i18n-content.py` and `scripts/validate-i18n.py` are present and should be run after completing translations.

## Required remaining work

1. Replace the 25 Arabic placeholder recipe pages with complete Arabic translations.
2. Translate the 25 English-copy recipe pages into French, Spanish, and Russian (75 localized article files).
3. Review all already-translated articles for terminology, ingredient fidelity, cooking temperatures/times, and schema parity.
4. Audit all locale-specific index, recipe listing, informational/legal pages, navigation/header/footer, and metadata.
5. Reconcile the branch with current `main`, run both i18n validators and the deployment build, then inspect the resulting diffs before opening a pull request.

No pull request was opened because the multilingual content is not complete and the validators/build were not run.
