(() => {
  'use strict';

  // Load AdSense once and mount two responsive placements on every published page.
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
      wrapper.style.cssText = 'display:block;clear:both;width:100%;max-width:' + (kind === 'in-article' ? '760px' : '300px') + ';margin:28px auto;padding:0;text-align:center;overflow:hidden;';
      const unit = document.createElement('ins');
      unit.className = 'adsbygoogle';
      unit.style.cssText = kind === 'in-article'
        ? 'display:block;text-align:center;width:100%;max-width:760px;min-height:100px;'
        : 'display:block;width:250px;height:125px;max-width:100%;margin:0 auto;';
      unit.setAttribute('data-ad-client', publisher);
      unit.setAttribute('data-ad-slot', slot);
      if (kind === 'in-article') {
        unit.setAttribute('data-ad-format', 'fluid');
        unit.setAttribute('data-ad-layout', 'in-article');
      } else {
        unit.setAttribute('data-ad-format', 'rectangle');
      }
      wrapper.appendChild(unit);
      const push = document.createElement('script');
      push.text = '(adsbygoogle = window.adsbygoogle || []).push({});';
      wrapper.appendChild(push);
      return wrapper;
    };

    const firstAd = createPlacement('5806370724', 'in-article');
    const secondAd = createPlacement('1190274186', 'display');
    const article = main.querySelector('article');
    if (article) {
      const heading = article.querySelector('h1');
      const intro = heading?.parentElement?.querySelector('p') ||
        (heading ? [...article.querySelectorAll('p')].find(p => heading.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING) : null);
      if (intro?.parentNode) intro.parentNode.insertBefore(firstAd, intro.nextSibling);
      else article.insertBefore(firstAd, article.firstChild);

      const paragraphs = [...article.querySelectorAll('p')];
      const author = paragraphs.find(p => /recipe content by|mrecipes|وصفات/i.test(p.textContent || '') && p !== intro);
      if (author?.parentNode) author.parentNode.insertBefore(secondAd, author);
      else article.appendChild(secondAd);
      return;
    }

    const sections = [...main.querySelectorAll(':scope > section')];
    if (sections.length) {
      sections[0].after(firstAd);
      if (sections.length > 1) {
        sections[Math.min(1, sections.length - 1)].after(secondAd);
      } else {
        const content = main.querySelector('.content-page');
        if (content && content.children.length > 1) {
          content.children[Math.floor(content.children.length / 2)].after(secondAd);
        } else {
          main.appendChild(secondAd);
        }
      }
      return;
    }

    const paragraphs = [...main.querySelectorAll('p')];
    if (paragraphs.length) {
      paragraphs[0].after(firstAd);
      paragraphs[Math.floor(paragraphs.length / 2)].after(secondAd);
    } else {
      main.append(firstAd, secondAd);
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

  // Show three recent recipes from different categories in a horizontal homepage rail.
  const buildHomepageLatestSlider = () => {
    if (!isHomePage) return;
    const grid = document.querySelector('[data-supabase-recipes]');
    const container = grid?.parentElement;
    if (!grid || !container) return;
    let section = container.querySelector(':scope > .homepage-latest-slider');
    if (!section) {
      section = document.createElement('section');
      section.className = 'homepage-latest-slider';
      section.setAttribute('aria-label', ({
        en: 'Latest recipes from different categories',
        ar: 'أحدث الوصفات من تصنيفات متنوعة',
        es: 'Últimas recetas de distintas categorías',
        fr: 'Les dernières recettes de catégories variées',
        ru: 'Новые рецепты разных категорий'
      })[locale] || 'Latest recipes');
      section.innerHTML = '<div class="homepage-latest-slider-heading"><div><h3></h3><p></p></div><div class="homepage-latest-slider-controls"></div></div><div class="homepage-latest-slider-viewport" tabindex="0"><div class="homepage-latest-slider-track"></div></div>';
      const copy = {
        en: { title: 'Latest recipes · varied categories', desc: 'Three fresh ideas from different parts of the menu.', previous: 'Scroll to previous recipes', next: 'Scroll to next recipes' },
        ar: { title: 'أحدث الوصفات · تصنيفات متنوعة', desc: 'ثلاث أفكار شهية من تصنيفات مختلفة.', previous: 'عرض الوصفات السابقة', next: 'عرض الوصفات التالية' },
        es: { title: 'Últimas recetas · categorías variadas', desc: 'Tres ideas recientes de distintas categorías.', previous: 'Ver recetas anteriores', next: 'Ver recetas siguientes' },
        fr: { title: 'Dernières recettes · catégories variées', desc: 'Trois idées récentes issues de catégories différentes.', previous: 'Voir les recettes précédentes', next: 'Voir les recettes suivantes' },
        ru: { title: 'Новые рецепты · разные категории', desc: 'Три свежие идеи из разных категорий.', previous: 'Показать предыдущие рецепты', next: 'Показать следующие рецепты' }
      }[locale] || { title: 'Latest recipes', desc: 'Three recent recipes.', previous: 'Previous recipes', next: 'Next recipes' };
      section.querySelector('h3').textContent = copy.title;
      section.querySelector('p').textContent = copy.desc;
      const controls = section.querySelector('.homepage-latest-slider-controls');
      const makeArrow = (symbol, label, direction) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'homepage-latest-slider-arrow';
        button.textContent = symbol;
        button.setAttribute('aria-label', label);
        button.addEventListener('click', () => {
          const viewport = section.querySelector('.homepage-latest-slider-viewport');
          const rtl = document.documentElement.dir === 'rtl';
          viewport.scrollBy({ left: direction * (rtl ? -1 : 1) * Math.max(240, viewport.clientWidth * .8), behavior: 'smooth' });
        });
        return button;
      };
      controls.append(makeArrow('‹', copy.previous, -1), makeArrow('›', copy.next, 1));
      grid.insertAdjacentElement('beforebegin', section);
    }
    // The slider's localized heading replaces the generic heading above the same feed.
    container.querySelector(':scope > .section-heading')?.remove();
    const track = section.querySelector('.homepage-latest-slider-track');
    const cards = [...grid.querySelectorAll('[data-recipe-card]')];
    const categoryOf = card => {
      const spans = [...card.querySelectorAll('.recipe-meta span')];
      return (spans.length > 1 ? spans[spans.length - 1] : spans[0])?.textContent?.trim().toLocaleLowerCase() || '';
    };
    const selected = [];
    const usedCategories = new Set();
    cards.forEach(card => {
      if (selected.length >= 3) return;
      const category = categoryOf(card);
      if (category && usedCategories.has(category)) return;
      selected.push(card);
      if (category) usedCategories.add(category);
    });
    if (selected.length < 3) {
      cards.forEach(card => {
        if (selected.length >= 3 || selected.includes(card)) return;
        selected.push(card);
      });
    }
    track.replaceChildren(...selected.map(card => {
      const clone = card.cloneNode(true);
      clone.hidden = false;
      clone.classList.add('homepage-latest-slider-card');
      clone.querySelectorAll('[hidden]').forEach(el => el.hidden = false);
      return clone;
    }));
    section.hidden = selected.length === 0;
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
  buildHomepageLatestSlider();
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
    // Static localized cards are already present at this point. Keep the
    // latest-recipe slider available even when Supabase is not configured.
    buildHomepageLatestSlider();
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
      // Whether Supabase returns rows or the localized static feed remains in
      // place, render the three-card slider from the cards currently on screen.
      buildHomepageLatestSlider();
    }).catch(error => {
      console.error('Supabase query failed; keeping static recipe cards.', error);
      buildHomepageLatestSlider();
    });
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

/* Load recipe-matched Clip Recipe video recommendations on recipe detail pages. */
(() => {
  'use strict';
  const path = window.location.pathname.replace(/\\/+$/, '');
  const isRecipePage = /\\/(recipes|article)\\/[^/]+\\.html$/i.test(path);
  if (!isRecipePage || /recipe-template\\.html$/i.test(path)) return;
  if (document.querySelector('script[data-clip-recipe-videos]')) return;
  const script = document.createElement('script');
  script.src = '/assets/js/clip-recipe-videos.js';
  script.defer = true;
  script.dataset.clipRecipeVideos = 'true';
  script.onerror = () => console.error('Clip Recipe recommendations could not be loaded.');
  document.head.appendChild(script);
})();
