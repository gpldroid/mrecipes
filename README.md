# MRecipes

A mobile-first, English-language recipe website for **https://mrecipes.online/** with crawlable HTML pages, shared navigation/footer, SEO metadata, and optional Supabase-backed recipe data.

## Required project structure

- `index.html` — homepage and featured recipes
- `recipes.html` — recipe collection
- `recipes/*.html` — individual crawlable recipe pages with Recipe JSON-LD
- `about.html`, `contact.html`, `privacy-policy.html`, `terms.html`, `disclaimer.html` — information and legal pages
- `404.html` — not-found page
- `assets/css/style.css` — shared responsive styling
- `assets/js/header.js` — shared desktop/mobile navigation
- `assets/js/footer.js` — shared footer and author attribution
- `assets/js/main.js` — site behavior, search, scroll-to-top, and optional Supabase queries
- `assets/images/` — locally hosted, optimized site and recipe images
- `supabase/schema.sql` — database tables and row-level security policies
- `sitemap.xml`, `robots.txt`, `CNAME` — crawl and custom-domain configuration
- `.github/workflows/pages.yml` — validation and GitHub Pages deployment

All pages use the same injected header and footer. Every page/article must credit **Imad Limrani**. Keep the public site in English and mobile-first, with the mobile tab bar and desktop navigation.

## Supabase setup (Free Tier)

1. Create a Supabase project on the Free plan.
2. Open **SQL Editor** and run `supabase/schema.sql`.
3. In `assets/js/main.js`, replace `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` with the Project URL and publishable key (the legacy anon key also works). These are public browser credentials; never use a secret/service_role key in the website.
4. Add recipe records in the Supabase table editor. Public pages only query rows where `status = 'published'`. The homepage and recipe collection use database cards only when configured and published rows exist; otherwise their static HTML cards remain visible.
5. Comments can be submitted with `MRecipesData.submitComment({ slug, displayName, body })`. New comments are held as `pending`; only approved comments are public. No public comment update/delete policy is granted.

The site remains usable if Supabase is not configured or unavailable. The schema does not provide a full admin dashboard; content moderation can be done in the Supabase dashboard until the separately specified admin UI is implemented.

## GitHub Pages deployment

1. Open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
2. Wait for **Deploy MRecipes to GitHub Pages** to finish successfully.
3. Confirm the custom domain is `mrecipes.online` and HTTPS is ready after DNS propagation.

Workflow: https://github.com/gpldroid/mrecipes/actions/workflows/pages.yml

## Automated checks

The workflow validates required files, page titles, meta descriptions, canonical URLs, recipe JSON-LD, local CSS/JS references, and sitemap targets. Passing validation does not itself mean deployment succeeded; the Configure Pages and Deploy steps must also pass.

## Content quality before monetization

Replace emoji placeholders with properly licensed, optimized food photography. Use original, tested instructions, accurate quantities, helpful notes, and structured data that matches visible content. Review legal pages to reflect actual data collection and services.
