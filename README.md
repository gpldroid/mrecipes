# MRecipes

A lightweight, static recipe website published with GitHub Pages. The production domain is **https://mrecipes.online/**.

## Current site structure

- `index.html` — homepage and featured recipes
- `recipes.html` — recipe collection
- `recipes/*.html` — individual recipe pages with Recipe JSON-LD structured data
- `about.html`, `contact.html`, `privacy-policy.html`, `terms.html`, `disclaimer.html` — information and policy pages
- `404.html` — not-found page
- `assets/css/style.css` — shared responsive styling
- `assets/js/header.js`, `footer.js`, `main.js` — shared navigation, footer, search, and page behavior
- `sitemap.xml`, `robots.txt`, `CNAME` — crawl and custom-domain configuration
- `.github/workflows/pages.yml` — pre-deployment checks and GitHub Pages deployment

This is currently a static website; Supabase and a content-management dashboard are not required to publish it. Avoid adding a second CSS/JS architecture without first consolidating the existing files.

## Deployment

The workflow runs on every push to `main` and can also be started manually from the Actions tab.

1. Open **Settings → Pages** in this repository.
2. Set **Build and deployment → Source** to **GitHub Actions**.
3. Ensure GitHub Pages is enabled for this repository. The workflow token cannot enable Pages when GitHub denies the required repository permission, so this initial setting may need to be saved by a repository owner.
4. Wait for the **Deploy MRecipes to GitHub Pages** workflow to finish successfully.
5. Confirm the custom domain is `mrecipes.online` and that HTTPS is enabled after DNS has propagated.

Workflow: https://github.com/gpldroid/mrecipes/actions/workflows/pages.yml

## Pre-deployment validation

Before deployment, the workflow checks:

- required site files and custom-domain configuration;
- page titles, meta descriptions, and canonical URLs (except the 404 response);
- JSON-LD structured data on individual recipe pages;
- local CSS/JavaScript references;
- sitemap XML validity, canonical-domain URLs, and that listed pages exist.

A passing validation step does not by itself mean deployment succeeded; the **Configure GitHub Pages** and **Deploy** steps must also pass.

## Custom-domain DNS

For an apex domain such as `mrecipes.online`, configure the DNS records recommended in the official GitHub Pages documentation. Remove conflicting records, and only enable HTTPS once GitHub reports the certificate is ready.

Official guide: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

## Content quality before monetization

The current recipe illustrations include emoji placeholders. Replace them with properly licensed, optimized food photography and ensure every recipe contains tested, original instructions, clear ingredient quantities, helpful notes, and accurate structured data before applying for advertising approval. Legal pages should reflect the site's actual data collection and services.
