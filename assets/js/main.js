(() => {
  'use strict';

  // Keep homepage card imagery in sync with the image authored in each recipe article.
  if (!document.querySelector('script[data-mrecipes-article-images]')) {
    const imageSyncScript = document.createElement('script');
    imageSyncScript.src = '/assets/js/article-images.js';
    imageSyncScript.defer = true;
    imageSyncScript.dataset.mrecipesArticleImages = 'true';
    document.head.appendChild(imageSyncScript);
  }

  const PAGE_SIZE = 6;
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
    en: { more: 'Load more recipes', shown: (a, b) => `Showing ${a} of ${b} recipes`, empty: 'No recipes to show.' },
    ar: { more: 'عرض المزيد من الوصفات', shown: (a, b) => `عرض ${a} من أصل ${b} وصفة`, empty: 'لا توجد وصفات لعرضها.' },
    es: { more: 'Cargar más recetas', shown: (a, b) => `Mostrando ${a} de ${b} recetas`, empty: 'No hay recetas para mostrar.' },
    fr: { more: 'Charger plus de recettes', shown: (a, b) => `Affichage de ${a} recettes sur ${b}`, empty: 'Aucune recette à afficher.' },
    ru: { more: 'Загрузить ещё рецепты', shown: (a, b) => `Показано ${a} из ${b} рецептов`, empty: 'Нет рецептов для отображения.' }
  }[locale];


  // Build the desktop sidebar from the same recipe cards as the main feed.
  // This keeps links, titles, categories, and images in sync with static or Supabase content.
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
      button.textContent = labels.more;
      button.addEventListener('click', () => {
        const state = gridState.get(grid);
        if (!state) return;
        state.limit += state.pageSize;
        updateGrid(grid);
      });
      gridState.set(grid, { limit: initialCount, pageSize: PAGE_SIZE, button });
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
      grid.insertAdjacentElement('afterend', status);
    }
    status.textContent = matching.length ? labels.shown(shown, matching.length) : labels.empty;
    status.hidden = matching.length === 0;
  };

  const updateAllGrids = () => {
    if (!isHomePage) return;
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

  if (isHomePage) document.querySelectorAll('[data-supabase-recipes]').forEach(getGridState);
  applySearch();
  renderSidebar();
  document.querySelectorAll('[data-current-year]').forEach(el => el.textContent = new Date().getFullYear());
  document.querySelectorAll('[data-scroll-top]').forEach(button => button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' })));

  const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'YOUR_SUPABASE_PUBLISHABLE_KEY';
  const configured = /^https:\/\/[^/]+\.supabase\.co$/.test(SUPABASE_URL) && !SUPABASE_URL.includes('YOUR_PROJECT_REF') && SUPABASE_PUBLISHABLE_KEY && !SUPABASE_PUBLISHABLE_KEY.includes('YOUR_SUPABASE');

  const loadClient = () => new Promise((resolve, reject) => {
    if (window.supabase?.createClient) return resolve(window.supabase);
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.async = true;
    script.onload = () => window.supabase?.createClient ? resolve(window.supabase) : reject(new Error('Supabase client unavailable'));
    script.onerror = reject;
    document.head.appendChild(script);
  });

  const str = value => String(value ?? '');
  const recipeBase = locale === 'en' ? '/recipes/' : `/${locale}/article/`;

  const renderCards = (container, recipes) => {
    const fragment = document.createDocumentFragment();
    recipes.forEach(recipe => {
      const card = document.createElement('article');
      card.className = 'recipe-card';
      card.dataset.recipeCard = '';
      card.dataset.tags = [recipe.title, recipe.category, recipe.excerpt].join(' ').toLowerCase();
      const imageLink = document.createElement('a');
      imageLink.className = 'recipe-image';
      imageLink.href = `${recipeBase}${encodeURIComponent(recipe.slug)}.html`;
      imageLink.setAttribute('aria-label', str(recipe.title));
      {
        const img = document.createElement('img');
        // Prefer the site-owned image named after this recipe. Supabase's
        // image_url is only a fallback for recipes without a local photo.
        img.src = `/assets/images/recipes/${encodeURIComponent(recipe.slug)}.webp`;
        img.alt = str(recipe.title);
        img.loading = 'lazy';
        img.decoding = 'async';
        img.onerror = () => {
          if (recipe.image_url && img.dataset.fallbackUsed !== 'true') {
            img.dataset.fallbackUsed = 'true';
            img.src = recipe.image_url;
          } else {
            img.remove();
            imageLink.textContent = '🍽️';
          }
        };
        imageLink.appendChild(img);
      }
      const content = document.createElement('div');
      content.className = 'recipe-content';
      const meta = document.createElement('div');
      meta.className = 'recipe-meta';
      const time = document.createElement('span');
      time.textContent = `${Number(recipe.prep_minutes || 0) + Number(recipe.cook_minutes || 0)} min`;
      const category = document.createElement('span');
      category.textContent = str(recipe.category || 'Recipe');
      meta.append(time, category);
      const h3 = document.createElement('h3');
      const title = document.createElement('a');
      title.href = imageLink.href;
      title.textContent = str(recipe.title);
      h3.appendChild(title);
      const excerpt = document.createElement('p');
      excerpt.textContent = str(recipe.excerpt);
      content.append(meta, h3, excerpt);
      card.append(imageLink, content);
      fragment.appendChild(card);
    });
    container.replaceChildren(fragment);
  };

  if (!configured) {
    window.MRecipesData = Object.freeze({ enabled: false, reason: 'Configure the Supabase URL and publishable key in assets/js/main.js.' });
    return;
  }

  loadClient().then(library => {
    const client = library.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    window.MRecipesData = Object.freeze({
      enabled: true,
      async getPublishedRecipes() {
        const { data, error } = await client.from('recipes').select('slug,title,excerpt,category,image_url,prep_minutes,cook_minutes,published_at').eq('status', 'published').order('published_at', { ascending: false }).limit(60);
        if (error) throw error;
        return data || [];
      },
      async getApprovedComments(slug) {
        const { data, error } = await client.from('recipe_comments').select('display_name,body,created_at,recipes!inner(slug)').eq('status', 'approved').eq('recipes.slug', slug).order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      },
      async submitComment({ slug, displayName, body }) {
        const name = str(displayName).trim();
        const comment = str(body).trim();
        if (name.length < 2 || name.length > 80 || comment.length < 5 || comment.length > 2000) throw new Error('Name must be 2–80 characters and comment 5–2000 characters.');
        const { data: recipe, error: lookupError } = await client.from('recipes').select('id').eq('slug', slug).eq('status', 'published').single();
        if (lookupError) throw lookupError;
        const { error } = await client.from('recipe_comments').insert({ recipe_id: recipe.id, display_name: name, body: comment, status: 'pending' });
        if (error) throw error;
      }
    });
    const container = document.querySelector('[data-supabase-recipes]');
    if (!container) return;
    window.MRecipesData.getPublishedRecipes().then(recipes => {
      if (recipes.length) {
        renderCards(container, recipes);
        applySearch();
        renderSidebar();
      }
    }).catch(error => console.error('Supabase query failed; keeping static recipe cards.', error));
  }).catch(error => console.error('Supabase client failed to load; keeping static content.', error));
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

