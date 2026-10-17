# Recipe photography sources and licensing

MRecipes imports locally hosted WebP photographs during the GitHub Pages build from:

- **Source repository:** https://github.com/ronaldl29/public-domain-recipes
- **Image directory:** https://github.com/ronaldl29/public-domain-recipes/tree/main/static/pix
- **License declaration:** https://github.com/ronaldl29/public-domain-recipes/blob/main/LICENSE.md
- **Project README:** https://github.com/ronaldl29/public-domain-recipes/blob/main/README.md

The source project states that its content is dedicated to the public domain under the Unlicense. The import script downloads only the listed `.webp` files, validates the WebP signature, stores recipe-named local copies under `assets/images/recipes/` in the Pages build workspace, and changes matching HTML/JSON-LD/social-preview references from SVG illustrations to local WebP photographs.

The upstream repository's license declaration is the basis for reuse. This notice records provenance; it is not a claim that MRecipes created the source photographs. The build deliberately downloads source photos rather than hotlinking them, so deployed pages serve local files. To reproduce the deployed image set, run `python3 scripts/import-public-domain-recipe-photos.py` from the repository root.

Some source images depict a closely related dish/category rather than the exact recipe. Replace those mappings with a more exact public-domain photograph when one is available.
