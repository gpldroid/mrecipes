(() => {
  'use strict';

  // One canonical image per recipe slug, shared by EN/AR/FR/ES/RU.
  const path = location.pathname.replace(/\/index\.html$/, '/');
  const articleMatch = path.match(/^\/recipes\/([^/]+)\.html$/) || path.match(/^\/(?:ar|es|fr|ru)\/article\/([^/]+)\.html$/);
  const home = ['/', '/ar/', '/es/', '/fr/', '/ru/'].includes(path);

  const slugFromHref = href => {
    try {
      const p = new URL(href, location.origin).pathname.replace(/\/index\.html$/, '/');
      const m = p.match(/^\/recipes\/([^/]+)\.html$/) || p.match(/^\/(?:ar|es|fr|ru)\/article\/([^/]+)\.html$/);
      return m?.[1] || null;
    } catch (_) { return null; }
  };

  const imageFor = slug => `/assets/images/recipes/${encodeURIComponent(slug)}.webp`;
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

  const optimizeImage = (img, priority = false) => {
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.decoding = 'async';
    if (priority) {
      img.loading = 'eager';
      img.fetchPriority = 'high';
    } else {
      img.loading = 'lazy';
      img.fetchPriority = 'low';
    }
  };

  const syncHomeImages = () => {
    document.querySelectorAll('.recipe-card a[href] img').forEach(img => {
      const link = img.closest('a[href]');
      const slug = link && slugFromHref(link.getAttribute('href'));
      if (!slug) return;
      img.src = imageFor(slug);
      optimizeImage(img, false);
    });
  };

  const syncArticleImages = () => {
    if (!articleMatch) return;
    const slug = articleMatch[1];
    const image = imageFor(slug);
    const absoluteImage = absoluteFor(slug);
    const title = document.querySelector('h1')?.textContent?.trim() || document.title;

    document.querySelectorAll('.content-page img').forEach((img, index) => {
      img.src = image;
      img.alt = img.alt || title;
      optimizeImage(img, index === 0);
    });

    const article = document.querySelector('.content-page');
    if (article && !article.querySelector('img')) {
      const figure = document.createElement('figure');
      figure.className = 'recipe-image';
      const safeTitle = title.replace(/"/g, '&quot;');
      figure.innerHTML = `<img src="${image}" alt="${safeTitle}" width="1200" height="675" decoding="async" fetchpriority="high"><figcaption>Photo: MRecipes</figcaption>`;
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
    if (home) syncHomeImages();
    if (articleMatch) syncArticleImages();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true });
  else apply();

  document.addEventListener('mrecipes:localized-home-ready', syncHomeImages);
  new MutationObserver(() => {
    if (home) syncHomeImages();
  }).observe(document.body, { childList: true, subtree: true });
})();
