(() => {
  'use strict';

  // Load AdSense once and mount placements only inside meaningful content areas.
  const initializeAdsense = () => {
    const publisher = 'ca-pub-6996931662051674';
    const loaderUrl = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + publisher;
    if (!document.querySelector('meta[name="google-adsense-account"]')) {
      const account = document.createElement('meta');
      account.name = 'google-adsense-account';
      account.content = publisher;
      document.head.appendChild(account);
    }
    if (!window.__mrecipesAdsenseLoaded && !document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
      window.__mrecipesAdsenseLoaded = true;
      const loader = document.createElement('script');
      loader.async = true;
      loader.crossOrigin = 'anonymous';
      loader.src = loaderUrl;
      document.head.appendChild(loader);
    }

    const main = document.querySelector('main');
    if (!main || main.dataset.adsenseInitialized === 'true') return;
    main.dataset.adsenseInitialized = 'true';

    const createPlacement = (slot, kind) => {
      const wrapper = document.createElement('aside');
      wrapper.className = 'adsense-placement adsense-' + kind;
      wrapper.setAttribute('aria-label', 'Advertisement');
      wrapper.style.cssText = 'display:block;clear:both;width:100%;max-width:100%;margin:32px auto;padding:0;text-align:center;overflow:hidden;';
      const unit = document.createElement('ins');
      unit.className = 'adsbygoogle';
      unit.style.cssText = 'display:block;width:100%;min-height:100px;';
      unit.setAttribute('data-ad-client', publisher);
      unit.setAttribute('data-ad-slot', slot);
      unit.setAttribute('data-ad-format', 'auto');
      unit.setAttribute('data-full-width-responsive', 'true');
      wrapper.appendChild(unit);
      const push = document.createElement('script');
      push.text = '(adsbygoogle = window.adsbygoogle || []).push({});';
      wrapper.appendChild(push);
      return wrapper;
    };

    const inArticleAd = createPlacement('5806370724', 'in-article');
    const displayAd = createPlacement('1190274186', 'display');

    // Keep the homepage display unit below the complete recipe feed and
    // above the newsletter, away from navigation, slider controls, and cards.
    const homeFeed = main.querySelector('.home-content-layout');
    if (homeFeed) {
      homeFeed.insertAdjacentElement('afterend', displayAd);
      return;
    }

    const article = main.querySelector('article.content-page, .content-page article, article.recipe-article, article.post-content');
    if (article) {
      const paragraphs = [...article.querySelectorAll('p')].filter(p => p.textContent.trim().length > 80);

      // Start the first in-article unit after the opening context, not directly
      // below the hero image or recipe-at-a-glance line.
      if (paragraphs.length >= 3) {
        paragraphs[1].insertAdjacentElement('afterend', inArticleAd);
      }

      // A second unit is only useful on long articles. Keep it well separated
      // from the first placement and within the article reading column.
      if (paragraphs.length >= 7) {
        const middleIndex = Math.min(paragraphs.length - 1, Math.floor(paragraphs.length * 0.65));
        const middleParagraph = paragraphs[middleIndex];
        if (middleParagraph && middleParagraph !== paragraphs[1]) {
          middleParagraph.insertAdjacentElement('afterend', displayAd);
        }
      }
      return;
    }

    // Informational pages receive fewer placements than recipe articles.
    // Ads stay inside the reading column and away from short utility pages.
    const content = main.querySelector('.content-page, .article-body, .post-body, .entry-content');
    if (content) {
      const paragraphs = [...content.querySelectorAll('p')].filter(p => p.textContent.trim().length > 100);
      if (paragraphs.length >= 4) {
        paragraphs[1].insertAdjacentElement('afterend', inArticleAd);
        if (paragraphs.length >= 8) {
          const middleParagraph = paragraphs[Math.floor(paragraphs.length * 0.65)];
          if (middleParagraph && middleParagraph !== paragraphs[1]) {
            middleParagraph.insertAdjacentElement('afterend', displayAd);
          }
        }
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdsense, { once: true });
  } else {
    initializeAdsense();
  }

  // Keep homepage card imagery in sync with the image authored in each recipe article.
  if (!document.querySelector('script[data-mrecipes-article-images]')) {
    const imageSyncScript = document.createElement('script');
    imageSyncScript.src = '/assets/js/article-images.js';
    imageSyncScript.defer = true;
    imageSyncScript.dataset.mrecipesArticleImages = 'true';
    document.head.appendChild(imageSyncScript);
  }

  const PAGE_SIZE = 8;
  const path = location.pathname.replace(/\/index\.html$/, '/').replace(/\/+$/, '') || '/';
  const locale = ['ar', 'es', 'fr', 'ru'].find(code => path === `/${code}` || path.startsWith(`/${code}/`)) || 'en';
  const isHomePage = path === '/' || ['ar', 'es', 'fr', 'ru', 'en'].some(code => path === `/${code}`);
  const search = new URLSearchParams(location.search).get('search')?.trim().toLowerCase() || '';
  const input = document.querySelector('#header-search-input');
  if (input && search) input.value = search;

  const contactForm = document.querySelector('[data-contact-form]');
  if (contactForm) {
    const status = contactForm.querySelector('[data-contact-status]');
    contactForm.addEventListener('submit', event => {
      if (!contactForm.reportValidity()) {
        event.preventDefault();
        return;
      }
      if (status) status.textContent = 'Your email app should open with the message addressed to info@larache.xyz. Please review and send it there.';
    });
  }

  const labels = {
    en: { more: 'Load more', shown: (a, b) => `Showing ${a} of ${b} recipes`, empty: 'No recipes to show.' },
    ar: { more: 'عرض المزيد', shown: (a, b) => `عرض ${a} من أصل ${b} وصفة`, empty: 'لا توجد وصفات لعرضها.' },
    es: { more: 'Cargar más', shown: (a, b) => `Mostrando ${a} de ${b} recetas`, empty: 'No hay recetas para mostrar.' },
    fr: { more: 'Charger plus', shown: (a, b) => `Affichage de ${a} recettes sur ${b}`, empty: 'Aucune recette à afficher.' },
    ru: { more: 'Загрузить ещё', shown: (a, b) => `Показано ${a} из ${b} рецептов`, empty: 'Нет рецептов для отображения.' }
  }[locale];


  // Build the desktop sidebar from the same recipe cards as the main feed.
  // This keeps links, titles, categories, and images in sync with static HTML content.
  const sidebarLabels = {
    en: { all: 'View all', empty: 'More recipes coming soon' },
    ar: { all: 'عرض الكل', empty: 'وصفات جديدة قريبًا' },
    es: { all: 'Ver todas', empty: 'Próximamente más recetas' },
    fr: { all: 'Tout voir', empty: 'D’autres recettes bientôt' },
    ru: { all: 'Все рецепты', empty: 'Скоро появятся новые рецепты' }
  }[locale];
  const renderSidebar = () => {
    const latest = document.querySelector('[data-sidebar-latest]');
    const categoriesRoot = document.querySelector('[data-sidebar-categories]');
    const sourceGrid = document.querySelector('[data-supabase-recipes]');
    if (!latest || !categoriesRoot || !sourceGrid) return;
    const cards = [...sourceGrid.querySelectorAll('[data-recipe-card]')];
    const toSidebarCard = card => {
      const titleLink = card.querySelector('.recipe-content h3 a');
      const imageLink = card.querySelector('.recipe-image');
      if (!titleLink) return null;
      const meta = card.querySelector('.recipe-meta');
      const spans = meta ? [...meta.querySelectorAll('span')] : [];
      const category = (spans[1]?.textContent || (card.dataset.tags || '').split(/\\s+/)[0] || 'Recipes').trim();
      const article = document.createElement('article');
      article.className = 'sidebar-recipe-card';
      const image = document.createElement('a');
      image.className = 'sidebar-recipe-image';
      image.href = titleLink.href;
      image.setAttribute('aria-label', titleLink.textContent.trim());
      const img = imageLink?.querySelector('img');
      if (img) {
        const copy = document.createElement('img');
        copy.src = img.currentSrc || img.src;
        copy.alt = img.alt || titleLink.textContent.trim();
        copy.loading = 'lazy';
        copy.decoding = 'async';
        image.appendChild(copy);
      } else image.textContent = imageLink?.textContent.trim() || '🍽️';
      const copy = document.createElement('div');
      copy.className = 'sidebar-recipe-copy';
      if (meta) copy.appendChild(meta.cloneNode(true));
      const heading = document.createElement('h3');
      const link = document.createElement('a');
      link.href = titleLink.href;
      link.textContent = titleLink.textContent.trim();
      heading.appendChild(link);
      copy.appendChild(heading);
      article.append(image, copy);
      return { article, category };
    };
    const entries = cards.map(toSidebarCard).filter(Boolean);
    const createList = items => {
      const list = document.createElement('div');
      list.className = 'sidebar-category-cards';
      items.forEach(item => list.appendChild(item.article));
      return list;
    };
    latest.replaceChildren();
    const latestItems = entries.slice(0, 4).map(item => ({...item, article: item.article.cloneNode(true)}));
    if (latestItems.length) {
      const slider = document.createElement('div');
      slider.className = 'latest-slider';
      slider.setAttribute('role', 'region');
      slider.setAttribute('aria-roledescription', 'carousel');
      slider.setAttribute('aria-label', locale === 'ar' ? 'أحدث الوصفات' : 'Latest recipes');
      const viewport = document.createElement('div');
      viewport.className = 'latest-slider-viewport';
      const track = document.createElement('div');
      track.className = 'latest-slider-track';
      latestItems.forEach((item, index) => {
        const slide = document.createElement('div');
        slide.className = 'latest-slider-slide';
        slide.setAttribute('role', 'group');
        slide.setAttribute('aria-roledescription', 'slide');
        slide.setAttribute('aria-label', `${index + 1} / ${latestItems.length}`);
        slide.appendChild(item.article);
        track.appendChild(slide);
      });
      viewport.appendChild(track);
      const controls = document.createElement('div');
      controls.className = 'latest-slider-controls';
      const previous = document.createElement('button');
      previous.type = 'button';
      previous.className = 'latest-slider-arrow';
      previous.textContent = '‹';
      previous.setAttribute('aria-label', locale === 'ar' ? 'الوصفة السابقة' : 'Previous recipe');
      const counter = document.createElement('span');
      counter.className = 'latest-slider-counter';
      counter.setAttribute('aria-live', 'polite');
      const next = document.createElement('button');
      next.type = 'button';
      next.className = 'latest-slider-arrow';
      next.textContent = '›';
      next.setAttribute('aria-label', locale === 'ar' ? 'الوصفة التالية' : 'Next recipe');
      let active = 0;
      const showSlide = index => {
        active = (index + latestItems.length) % latestItems.length;
        track.style.transform = `translateX(${active * -100}%)`;
        counter.textContent = `${active + 1} / ${latestItems.length}`;
        previous.disabled = latestItems.length < 2;
        next.disabled = latestItems.length < 2;
      };
      previous.addEventListener('click', () => showSlide(active - 1));
      next.addEventListener('click', () => showSlide(active + 1));
      controls.append(previous, counter, next);
      slider.append(viewport, controls);
      latest.appendChild(slider);
      showSlide(0);
    } else {
      const empty = document.createElement('p');
      empty.className = 'sidebar-empty';
      empty.textContent = sidebarLabels.empty;
      latest.appendChild(empty);
    }
    categoriesRoot.replaceChildren();
    const grouped = new Map();
    entries.forEach(item => {
      const key = item.category || 'Recipes';
      if (!grouped.has(key)) grouped.set(key, []);
      if (grouped.get(key).length < 2) grouped.get(key).push({...item, article: item.article.cloneNode(true)});
    });
    grouped.forEach((items, category) => {
      if (!items.length) return;
      const panel = document.createElement('section');
      panel.className = 'sidebar-category-panel';
      const heading = document.createElement('div');
      heading.className = 'sidebar-category-heading';
      const title = document.createElement('h2');
      title.textContent = category;
      const more = document.createElement('a');
      more.href = locale === 'en' ? '/recipes.html' : `/${locale}/recipes.html`;
      more.textContent = sidebarLabels.all;
      heading.append(title, more);
      panel.append(heading, createList(items));
      categoriesRoot.appendChild(panel);
    });
  };

  // Show three recent recipes from different categories in a horizontal homepage rail.
  const gridState = new WeakMap();

  const getGridState = grid => {
    if (!gridState.has(grid)) {
      let button = grid.parentElement?.querySelector(':scope > .load-more-button');
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'button load-more-button';
        grid.insertAdjacentElement('afterend', button);
      }
      const initialCount = Math.max(1, Number(grid.dataset.initialCount) || PAGE_SIZE);
      const pageSize = Math.max(1, Number(grid.dataset.pageSize) || PAGE_SIZE);
      if (!grid.id) grid.id = isHomePage ? 'homepage-recipe-grid' : 'recipes-page-grid';
      button.setAttribute('aria-controls', grid.id);
      button.textContent = labels.more;
      button.addEventListener('click', () => {
        const state = gridState.get(grid);
        if (!state || button.hidden) return;
        state.limit += state.pageSize;
        updateGrid(grid);
      });
      gridState.set(grid, { limit: initialCount, pageSize, button });
    }
    return gridState.get(grid);
  };

  const updateGrid = grid => {
    const state = getGridState(grid);
    const cards = [...grid.querySelectorAll('[data-recipe-card]')];
    const matching = cards.filter(card => card.dataset.searchMatch !== 'false');
    cards.forEach(card => {
      const index = matching.indexOf(card);
      card.hidden = index < 0 || index >= state.limit;
    });
    const shown = Math.min(state.limit, matching.length);
    state.button.hidden = matching.length <= state.limit;
    state.button.textContent = labels.more;
    state.button.setAttribute('aria-label', `${labels.more}; ${labels.shown(shown, matching.length)}`);
    let status = grid.parentElement.querySelector('[data-pagination-status]');
    if (!status) {
      status = document.createElement('p');
      status.className = 'pagination-status';
      status.dataset.paginationStatus = '';
      status.setAttribute('aria-live', 'polite');
      state.button.insertAdjacentElement('afterend', status);
    }
    status.textContent = matching.length ? labels.shown(shown, matching.length) : labels.empty;
    status.hidden = matching.length === 0;
  };

  const updateAllGrids = () => {
    document.querySelectorAll('[data-supabase-recipes]').forEach(updateGrid);
  };

  const applySearch = () => {
    const cards = [...document.querySelectorAll('[data-recipe-card]')];
    let count = 0;
    cards.forEach(card => {
      const matches = !search || card.textContent.toLowerCase().includes(search) || (card.dataset.tags || '').toLowerCase().includes(search);
      card.dataset.searchMatch = matches ? 'true' : 'false';
      if (matches) count++;
    });
    const status = document.querySelector('[data-search-status]');
    if (status && search) {
      status.textContent = count ? `${count} recipe${count === 1 ? '' : 's'} found for “${search}”.` : `No recipes found for “${search}”. Try another search.`;
    }
    updateAllGrids();
  };

  document.querySelectorAll('[data-supabase-recipes]').forEach(getGridState);
  applySearch();
  renderSidebar();

  // Add a recipe-category sidebar to individual recipe articles, not the homepage.
  const renderRecipeArticleSidebar = async () => {
    const path = window.location.pathname.replace(/\\/+$/, '');
    if (!/^\\/(recipes|article)\\/[^/]+\\.html$/i.test(path) || /recipe-template\\.html$/i.test(path)) return;
    const article = document.querySelector('main article.content-page');
    if (!article || article.dataset.sidebarLayout === 'true') return;
    try {
      const response = await fetch('/recipes.html', { credentials: 'same-origin' });
      if (!response.ok) return;
      const documentText = await response.text();
      const parsed = new DOMParser().parseFromString(documentText, 'text/html');
      const sourceCards = [...parsed.querySelectorAll('[data-recipe-card]')];
      if (!sourceCards.length) return;

      const locale = (document.documentElement.lang || 'en').toLowerCase().split('-')[0];
      const labels = {
        en: { title: 'Explore categories', all: 'View all' },
        ar: { title: 'استكشف التصنيفات', all: 'عرض الكل' },
        fr: { title: 'Explorer les catégories', all: 'Tout voir' },
        es: { title: 'Explorar categorías', all: 'Ver todo' },
        ru: { title: 'Категории рецептов', all: 'Все' }
      }[locale] || { title: 'Explore categories', all: 'View all' };

      const groups = new Map();
      sourceCards.forEach(card => {
        const title = card.querySelector('.recipe-content h3 a');
        if (!title) return;
        const meta = [...card.querySelectorAll('.recipe-meta span')];
        const category = (meta[1]?.textContent || 'Recipes').trim();
        if (!groups.has(category)) groups.set(category, []);
        if (groups.get(category).length < 3) {
          const image = card.querySelector('.recipe-image img');
          groups.get(category).push({
            title: title.textContent.trim(),
            href: new URL(title.getAttribute('href'), window.location.origin).pathname,
            image: image ? new URL(image.getAttribute('src'), window.location.origin).pathname : '',
            alt: image?.getAttribute('alt') || title.textContent.trim()
          });
        }
      });

      const layout = document.createElement('div');
      layout.className = 'recipe-article-layout';
      const sidebar = document.createElement('aside');
      sidebar.className = 'recipe-article-sidebar';
      sidebar.setAttribute('aria-label', labels.title);
      const heading = document.createElement('h2');
      heading.className = 'recipe-article-sidebar-title';
      heading.textContent = labels.title;
      sidebar.appendChild(heading);

      groups.forEach((items, category) => {
        const panel = document.createElement('section');
        panel.className = 'sidebar-category-panel';
        const panelHeading = document.createElement('div');
        panelHeading.className = 'sidebar-category-heading';
        const title = document.createElement('h3');
        title.textContent = category;
        const more = document.createElement('a');
        more.href = '/recipes.html';
        more.textContent = labels.all;
        panelHeading.append(title, more);
        const list = document.createElement('div');
        list.className = 'sidebar-category-cards';
        items.forEach(item => {
          const row = document.createElement('article');
          row.className = 'sidebar-recipe-card';
          const imageLink = document.createElement('a');
          imageLink.className = 'sidebar-recipe-image';
          imageLink.href = item.href;
          imageLink.setAttribute('aria-label', item.title);
          if (item.image) {
            const img = document.createElement('img');
            img.src = item.image;
            img.alt = item.alt;
            img.loading = 'lazy';
            img.decoding = 'async';
            imageLink.appendChild(img);
          }
          const copy = document.createElement('div');
          copy.className = 'sidebar-recipe-copy';
          const h = document.createElement('h4');
          const link = document.createElement('a');
          link.href = item.href;
          link.textContent = item.title;
          h.appendChild(link);
          copy.appendChild(h);
          row.append(imageLink, copy);
          list.appendChild(row);
        });
        panel.append(panelHeading, list);
        sidebar.appendChild(panel);
      });

      const parent = article.parentElement;
      parent.insertBefore(layout, article);
      layout.append(article, sidebar);
      article.dataset.sidebarLayout = 'true';
    } catch (error) {
      console.error('Recipe category sidebar could not be rendered.', error);
    }
  };
  renderRecipeArticleSidebar();
  document.querySelectorAll('[data-current-year]').forEach(el => el.textContent = new Date().getFullYear());
  document.querySelectorAll('[data-scroll-top]').forEach(button => button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' })));

  // Recipe listings use the recipe cards authored in the HTML files.
  // No remote database or client-side data service is required.
})();

/* Accessible floating controls for scrolling to the top or bottom of any page. */
(() => {
  'use strict';
  const locale = (document.documentElement.lang || 'en').toLowerCase().split('-')[0];
  const copy = {
    en: { top: 'Scroll to top', bottom: 'Scroll to bottom' },
    ar: { top: 'الانتقال إلى أعلى الصفحة', bottom: 'الانتقال إلى أسفل الصفحة' },
    es: { top: 'Ir al inicio', bottom: 'Ir al final' },
    fr: { top: 'Aller en haut', bottom: 'Aller en bas' },
    ru: { top: 'Прокрутить вверх', bottom: 'Прокрутить вниз' }
  }[locale] || { top: 'Scroll to top', bottom: 'Scroll to bottom' };

  const controls = document.createElement('nav');
  controls.className = 'mrecipes-scroll-controls';
  controls.setAttribute('aria-label', locale === 'ar' ? 'أدوات التنقل في الصفحة' : 'Page scroll controls');

  const makeButton = (direction, symbol, label, action) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mrecipes-scroll-button mrecipes-scroll-' + direction;
    button.textContent = symbol;
    button.setAttribute('aria-label', label);
    button.title = label;
    button.addEventListener('click', action);
    controls.appendChild(button);
    return button;
  };

  const topButton = makeButton('top', '↑', copy.top, () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  const bottomButton = makeButton('bottom', '↓', copy.bottom, () => {
    window.scrollTo({ top: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight), behavior: 'smooth' });
  });
  document.body.appendChild(controls);

  let scheduled = false;
  const updateVisibility = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    topButton.hidden = scrollTop < 120;
    bottomButton.hidden = maxScroll - scrollTop < 120;
    controls.classList.toggle('is-visible', !topButton.hidden || !bottomButton.hidden);
    scheduled = false;
  };
  const scheduleUpdate = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(updateVisibility);
  };
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  window.addEventListener('load', scheduleUpdate, { once: true });
  updateVisibility();
})();

/* Load recipe-matched Clip Recipe video recommendations on recipe detail pages. */
(() => {
  'use strict';
  const path = window.location.pathname.replace(/\/+$/, '');
  const isRecipePage = /\/(recipes|article)\/[^/]+\.html$/i.test(path);
  if (!isRecipePage || /recipe-template\.html$/i.test(path)) return;
  if (document.querySelector('script[data-clip-recipe-videos]')) return;
  const script = document.createElement('script');
  script.src = '/assets/js/clip-recipe-videos.js';
  script.defer = true;
  script.dataset.clipRecipeVideos = 'true';
  script.onerror = () => console.error('Clip Recipe recommendations could not be loaded.');
  document.head.appendChild(script);
})();
