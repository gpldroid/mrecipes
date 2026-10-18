(() => {
  'use strict';

  // One canonical featured image per recipe slug, shared by EN/AR/FR/ES/RU.
  const path = location.pathname.replace(/\/index\.html$/, '/');
  const match = path.match(/^\/recipes\/([^/]+)\.html$/) || path.match(/^\/(?:ar|es|fr|ru)\/article\/([^/]+)\.html$/);
  const slug = match?.[1];
  if (!slug) return;

  const image = `/assets/images/recipes/${encodeURIComponent(slug)}.webp`;
  const absoluteImage = new URL(image, location.origin).href;
  const title = document.querySelector('h1')?.textContent?.trim() || document.title;

  const setMeta = (selector, attribute, value) => {
    let meta = document.querySelector(selector);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attribute, selector.includes('property=') ? selector.match(/property="([^"]+)"/)?.[1] : selector.match(/name="([^"]+)"/)?.[1] || '');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', value);
  };

  const apply = () => {
    // Every image inside a recipe article uses the same canonical recipe image.
    document.querySelectorAll('.content-page img').forEach(img => {
      img.src = image;
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
      img.alt = img.alt || title;
      img.decoding = 'async';
    });

    const article = document.querySelector('.content-page');
    if (article && !article.querySelector('img')) {
      const figure = document.createElement('figure');
      figure.className = 'recipe-image';
      figure.innerHTML = `<img src="${image}" alt="${title.replace(/"/g, '&quot;')}" width="1200" height="675" decoding="async" fetchpriority="high"><figcaption>Photo: MRecipes</figcaption>`;
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true });
  else apply();
})();
