(() => {
  'use strict';

  const path = location.pathname.replace(/\/index\.html$/, '/');
  const articleMatch = path.match(/^\/recipes\/([^/]+)\.html$/) || path.match(/^\/(?:ar|es|fr|ru|sp|en)\/article\/([^/]+)\.html$/);
  const home = ['/', '/ar/', '/es/', '/sp/', '/fr/', '/ru/', '/en/'].includes(path);

  const slugFromHref = href => {
    try {
      const p = new URL(href, location.origin).pathname.replace(/\/index\.html$/, '/');
      const m = p.match(/^\/recipes\/([^/]+)\.html$/) || p.match(/^\/(?:ar|es|fr|ru|sp|en)\/article\/([^/]+)\.html$/);
      return m?.[1] || null;
    } catch (_) { return null; }
  };

  const baseFor = slug => `/assets/images/recipes/${encodeURIComponent(slug)}`;
  const imageFor = slug => `${baseFor(slug)}.webp`;
  const absoluteFor = slug => new URL(imageFor(slug), location.origin).href;

  const setMeta = (selector, attribute, value) => {
    let meta = document.querySelector(selector);
    if (!meta) {
      meta = document.createElement('meta');
      const prop = selector.match(/property="([^"]+)"/)?.[1];
      const name = selector.match(/name="([^"]+)"/)?.[1];
      meta.setAttribute(attribute, prop || name || '');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', value);
  };

  const addResponsiveSources = (img, assetSlug, role = 'card') => {
    // The repository contains the canonical <slug>.webp files, but does not
    // contain the generated -card/-featured/-step variants. Never point the
    // browser at files that are not part of the deployed asset tree.
    const base = baseFor(assetSlug);
    const config = role === 'featured'
      ? { width: 1200, height: 675 }
      : role === 'step'
        ? { width: 800, height: 600 }
        : { width: 600, height: 400 };

    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.width = config.width;
    img.height = config.height;

    const picture = img.closest('picture');
    picture?.querySelectorAll('source[data-mrecipes-responsive]').forEach(source => source.remove());
    img.src = base + '.webp';
    img.decoding = 'async';
    if (role === 'card') {
      img.loading = 'lazy';
      img.fetchPriority = 'low';
    }
  };

  const recipeAssetSlugFromUrl = value => {
    try {
      const pathname = new URL(value, location.origin).pathname;
      const match = pathname.match(/\/assets\/images\/recipes\/([^/]+?)(?:-(?:card|featured|step)(?:-\d+)?)?\.(?:webp|jpg)$/i);
      return match ? decodeURIComponent(match[1]) : null;
    } catch (_) { return null; }
  };

  const applyRemoteResponsive = (img, value) => {
    img.src = value;
    try {
      const original = new URL(value, location.origin);
      if (original.hostname !== 'images.unsplash.com') return;
      const widths = [320, 600];
      img.srcset = widths.map(width => {
        const candidate = new URL(original.href);
        candidate.searchParams.set('w', String(width));
        return candidate.href + ' ' + width + 'w';
      }).join(', ');
      img.sizes = '(max-width: 600px) calc(100vw - 2rem), (max-width: 1000px) 50vw, 300px';
      img.width = 600;
      img.height = 400;
      img.loading = 'lazy';
      img.decoding = 'async';
    } catch (_) {}
  };

  const optimizeImage = (img, slug, priority = false) => {
    addResponsiveSources(img, slug);
    img.decoding = 'async';
    if (priority) {
      img.loading = 'eager';
      img.fetchPriority = 'high';
    } else {
      img.loading = 'lazy';
      img.fetchPriority = 'low';
    }
  };

  const articleImageCache = new Map();

  const articleImageForCard = async href => {
    const url = new URL(href, location.origin);
    if (url.origin !== location.origin) return null;
    const key = url.pathname;
    if (articleImageCache.has(key)) return articleImageCache.get(key);

    const pending = fetch(url.href, { credentials: 'same-origin' })
      .then(response => {
        if (!response.ok) return null;
        return response.text();
      })
      .then(html => {
        if (!html) return null;
        const parsed = new DOMParser().parseFromString(html, 'text/html');
        const image = parsed.querySelector('.content-page img, article .recipe-image img, article img');
        const src = image?.getAttribute('src') || image?.getAttribute('data-src');
        if (!src) return null;
        const resolved = new URL(src, url.href);
        return resolved.origin === location.origin ? resolved.href : null;
      })
      .catch(() => null);

    articleImageCache.set(key, pending);
    return pending;
  };

  const syncHomeImages = () => {
    document.querySelectorAll('.recipe-card a[href] img').forEach(async img => {
      if (img.dataset.mrecipesImageSync === 'done' || img.dataset.mrecipesImageSync === 'pending') return;
      const link = img.closest('a[href]');
      if (!link) return;
      img.dataset.mrecipesImageSync = 'pending';
      const articleImage = await articleImageForCard(link.getAttribute('href'));
      if (!img.isConnected) return;
      if (articleImage) {
        const assetSlug = recipeAssetSlugFromUrl(articleImage);
        if (assetSlug) {
          addResponsiveSources(img, assetSlug, 'card');
        } else {
          const picture = img.closest('picture');
          picture?.querySelectorAll('source').forEach(source => source.remove());
          img.removeAttribute('srcset');
          img.removeAttribute('sizes');
          applyRemoteResponsive(img, articleImage);
        }
      }
      img.dataset.mrecipesImageSync = 'done';
    });
  };

  const syncArticleImages = () => {
    if (!articleMatch) return;
    const slug = articleMatch[1];
    const article = document.querySelector('.content-page');
    const existingImage = article?.querySelector('img');
    // Preserve the image already authored for this recipe. Replacing it with a
    // guessed slug-based path caused broken images and made article/card images differ.
    const image = existingImage?.getAttribute('src') || imageFor(slug);
    const absoluteImage = new URL(image, location.origin).href;
    const title = document.querySelector('h1')?.textContent?.trim() || document.title;

    document.querySelectorAll('.content-page img').forEach((img, index) => {
      img.alt = img.alt || title;
      img.decoding = 'async';
      if (index === 0) {
        img.loading = 'eager';
        img.fetchPriority = 'high';
      }
    });

    if (article && !existingImage) {
      const figure = document.createElement('figure');
      figure.className = 'recipe-image';
      const img = document.createElement('img');
      img.src = image;
      img.alt = title;
      img.width = 1200;
      img.height = 675;
      img.decoding = 'async';
      img.fetchPriority = 'high';
      figure.appendChild(img);
      const caption = document.createElement('figcaption');
      caption.textContent = 'Photo: MRecipes';
      figure.appendChild(caption);
      article.insertBefore(figure, article.firstChild);
    }

    setMeta('meta[property="og:image"]', 'property', absoluteImage);
    setMeta('meta[name="twitter:image"]', 'name', absoluteImage);
    setMeta('meta[property="og:image:width"]', 'property', '1200');
    setMeta('meta[property="og:image:height"]', 'property', '675');

    document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
      try {
        const data = JSON.parse(script.textContent);
        if (data && typeof data === 'object' && data['@type'] === 'Recipe') {
          data.image = absoluteImage;
          script.textContent = JSON.stringify(data);
        }
      } catch (_) {}
    });
  };

  const apply = () => {
    if (articleMatch) syncArticleImages();
    if (home) {
      syncHomeImages();
      const grid = document.querySelector('.recipe-grid, [data-supabase-recipes]');
      if (grid) {
        const observer = new MutationObserver(() => syncHomeImages());
        observer.observe(grid, { childList: true, subtree: true });
      }
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true });
  else apply();

})();
