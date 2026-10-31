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

  // The original English articles already carry licensed/credited source imagery for
  // these recipes, but their corresponding local WebP files are not in the repository.
  // Use those source images instead of leaving a broken /assets/images/... request.
  const fallbackImages = {
    'apple-cinnamon-crumble-bars': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1600&q=85',
    'coconut-lime-rice-bowl': 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=1600&q=85',
    'honey-mustard-roasted-carrots': 'https://images.unsplash.com/photo-1445282768818-728615cc910a?auto=format&fit=crop&w=1600&q=85',
    'lemon-ricotta-gnocchi': 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1600&q=85',
    'miso-glazed-salmon': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1600&q=85',
    'mushroom-barley-soup': 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1600&q=85',
    'pear-walnut-oatmeal': 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=1600&q=85',
    'roasted-red-pepper-hummus': 'https://images.unsplash.com/photo-1577906096429-f73c2c312435?auto=format&fit=crop&w=1600&q=85',
    'sesame-tofu-lettuce-wraps': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1600&q=85',
    'turkey-spinach-meatballs': 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=1600&q=85'
  };

  const placeholderFor = img => {
    const picture = img.closest('picture');
    const holder = document.createElement('span');
    holder.className = 'latest-slider-image-fallback';
    holder.setAttribute('aria-hidden', 'true');
    holder.textContent = '🍽️';
    if (picture) picture.replaceWith(holder);
    else img.replaceWith(holder);
  };

  const attachImageFallback = (img, slug) => {
    if (img.dataset.mrecipesFallbackAttached === 'true') return;
    img.dataset.mrecipesFallbackAttached = 'true';
    img.addEventListener('error', () => {
      if (img.dataset.mrecipesFallbackUsed === 'true') {
        placeholderFor(img);
        return;
      }
      img.dataset.mrecipesFallbackUsed = 'true';
      const fallback = fallbackImages[slug];
      if (fallback && img.src !== fallback) {
        const picture = img.closest('picture');
        picture?.querySelectorAll('source').forEach(source => source.remove());
        img.removeAttribute('srcset');
        img.removeAttribute('sizes');
        img.src = fallback;
      } else {
        placeholderFor(img);
      }
    });
  };

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
    const base = baseFor(assetSlug);
    const config = role === 'featured'
      ? { widths: [480, 800, 1200], sizes: '(max-width: 760px) calc(100vw - 2rem), (max-width: 1200px) 90vw, 1200px', width: 1200, height: 675 }
      : role === 'step'
        ? { widths: [400, 800], sizes: '(max-width: 760px) calc(100vw - 2rem), 800px', width: 800, height: 600 }
        : { widths: [320, 600], sizes: '(max-width: 600px) calc(100vw - 2rem), (max-width: 1000px) 50vw, 300px', width: 600, height: 400 };

    img.removeAttribute('srcset');
    img.sizes = config.sizes;
    img.width = config.width;
    img.height = config.height;

    let picture = img.closest('picture');
    if (!picture) {
      picture = document.createElement('picture');
      img.parentNode?.insertBefore(picture, img);
      picture.appendChild(img);
    }
    picture.querySelectorAll('source[data-mrecipes-responsive]').forEach(source => source.remove());

    // Use the canonical image that is actually present in the repository.
    // Responsive derivative files are generated by a separate workflow and may
    // not exist yet on a fresh deploy; pointing src/srcset at them made cards blank.
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    picture.querySelectorAll('source[data-mrecipes-responsive]').forEach(source => source.remove());
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



  // Use the exact image URL authored in the recipe page. Do not rebuild a
  // guessed local WebP path: many recipes use remote or differently named assets.
  const setCardImageFromArticle = (img, articleImage) => {
    const assetSlug = recipeAssetSlugFromUrl(articleImage);
    const source = assetSlug && fallbackImages[assetSlug] ? fallbackImages[assetSlug] : articleImage;
    const picture = img.closest('picture');
    picture?.querySelectorAll('source').forEach(node => node.remove());
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.src = source;
    img.decoding = 'async';
    img.loading = 'lazy';
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
        return ['http:', 'https:'].includes(resolved.protocol) ? resolved.href : null;
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
        setCardImageFromArticle(img, articleImage);
        attachImageFallback(img, slugFromHref(link.href));
      }
      img.dataset.mrecipesImageSync = 'done';
    });
  };

  // Recipe index pages can contain slugs without a local photo. If their
  // local placeholder fails, recover the actual image URL from the recipe page.
  const observeBrokenCardImages = () => {
    const recover = async img => {
      if (img.dataset.mrecipesFallbackTried === 'true') return;
      img.dataset.mrecipesFallbackTried = 'true';
      const link = img.closest('a[href]');
      if (!link) return;
      const articleImage = await articleImageForCard(link.getAttribute('href'));
      if (!articleImage || new URL(articleImage, location.origin).href === img.src) return;
      setCardImageFromArticle(img, articleImage);
    };
    const attach = root => {
      root.querySelectorAll('.recipe-card a[href] img').forEach(img => {
        if (img.dataset.mrecipesFallbackListener === 'true') return;
        img.dataset.mrecipesFallbackListener = 'true';
        img.addEventListener('error', () => { recover(img); }, { once: true });
        if (img.complete && img.naturalWidth === 0) recover(img);
      });
    };
    attach(document);
    document.querySelectorAll('.recipe-grid, [data-supabase-recipes]').forEach(grid => {
      const observer = new MutationObserver(() => attach(grid));
      observer.observe(grid, { childList: true, subtree: true });
    });
  };

  const syncArticleImages = () => {
    if (!articleMatch) return;
    const slug = articleMatch[1];
    const article = document.querySelector('.content-page');
    const existingImage = article?.querySelector('img');
    // Preserve the image already authored for this recipe. Replacing it with a
    // guessed slug-based path caused broken images and made article/card images differ.
    const authoredImage = existingImage?.getAttribute('src') || '';
    const authoredAssetSlug = recipeAssetSlugFromUrl(authoredImage);
    const image = (authoredAssetSlug && fallbackImages[authoredAssetSlug])
      ? fallbackImages[authoredAssetSlug]
      : (authoredImage || fallbackImages[slug] || imageFor(slug));
    if (existingImage && image !== authoredImage) {
      const picture = existingImage.closest('picture');
      picture?.querySelectorAll('source').forEach(source => source.remove());
      existingImage.removeAttribute('srcset');
      existingImage.removeAttribute('sizes');
      existingImage.src = image;
    }
    const absoluteImage = new URL(image, location.origin).href;
    const title = document.querySelector('h1')?.textContent?.trim() || document.title;

    document.querySelectorAll('.content-page img').forEach((img, index) => {
      img.alt = img.alt || title;
      img.decoding = 'async';
      attachImageFallback(img, slug);
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
    } else {
      observeBrokenCardImages();
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true });
  else apply();

})();
