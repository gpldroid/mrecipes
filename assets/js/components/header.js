(() => {
'use strict';

const path = location.pathname.replace(/\/index\.html$/, '/').replace(/\/{2,}/g, '/');
const locales = {
  en: { prefix: '', dir: 'ltr', home: '/', recipes: '/recipes.html', pages: '/pages/', label: 'EN', name: 'English' },
  ar: { prefix: '/ar', dir: 'rtl', home: '/ar/', recipes: '/ar/recipes.html', pages: '/ar/pages/', label: 'AR', name: 'العربية' },
  es: { prefix: '/es', dir: 'ltr', home: '/es/', recipes: '/es/recipes.html', pages: '/es/pages/', label: 'ES', name: 'Español' },
  fr: { prefix: '/fr', dir: 'ltr', home: '/fr/', recipes: '/fr/recipes.html', pages: '/fr/pages/', label: 'FR', name: 'Français' },
  ru: { prefix: '/ru', dir: 'ltr', home: '/ru/', recipes: '/ru/recipes.html', pages: '/ru/pages/', label: 'RU', name: 'Русский' }
};

const localeKey = Object.keys(locales).find(key => {
  if (key === 'en') return path === '/' || path.startsWith('/recipes/') || path.startsWith('/pages/');
  return path === `/${key}` || path.startsWith(`/${key}/`);
}) || 'en';
const l = locales[localeKey];
document.documentElement.lang = localeKey;
document.documentElement.dir = l.dir;

const articleMatch = path.match(/^\/recipes\/([^/]+)\.html$/) || path.match(/^\/(?:ar|es|fr|ru)\/article\/([^/]+)\.html$/);
const slug = articleMatch?.[1];
const pageMatch = path.match(/^\/pages\/([^/]+)\.html$/) || path.match(/^\/(?:ar|es|fr|ru)\/pages\/([^/]+)\.html$/);
const pageSlug = pageMatch?.[1];

const linksByLocale = {
  en: () => ({ href: slug ? `/recipes/${slug}.html` : pageSlug ? `/pages/${pageSlug}.html` : '/', label: 'EN' }),
  ar: () => ({ href: slug ? `/ar/article/${slug}.html` : pageSlug ? `/ar/pages/${pageSlug}.html` : '/ar/', label: 'AR' }),
  es: () => ({ href: slug ? `/es/article/${slug}.html` : pageSlug ? `/es/pages/${pageSlug}.html` : '/es/', label: 'ES' }),
  fr: () => ({ href: slug ? `/fr/article/${slug}.html` : pageSlug ? `/fr/pages/${pageSlug}.html` : '/fr/', label: 'FR' }),
  ru: () => ({ href: slug ? `/ru/article/${slug}.html` : pageSlug ? `/ru/pages/${pageSlug}.html` : '/ru/', label: 'RU' })
};

const labels = {
  en: { home: 'Home', recipes: 'Recipes', about: 'About', contact: 'Contact', skip: 'Skip to content', nav: 'Main navigation', search: 'Search recipes', placeholder: 'Find a recipe…', theme: 'Switch to dark mode', language: 'Language', openLanguage: 'Open language selector', browseAll: 'Browse all recipes', byMeal: 'By meal', byType: 'By dish type', byDiet: 'By diet', byTime: 'By prep time', breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snacks: 'Snacks', soup: 'Soups', salad: 'Salads', pasta: 'Pasta', dessert: 'Desserts', vegetarian: 'Vegetarian', plantBased: 'Plant-based', under15: 'Under 15 minutes', under30: '30 minutes or less', openRecipes: 'Open recipe categories' },
  ar: { home: 'الرئيسية', recipes: 'الوصفات', about: 'من نحن', contact: 'اتصل بنا', skip: 'تجاوز إلى المحتوى', nav: 'التنقل الرئيسي', search: 'بحث عن وصفة', placeholder: 'ابحث عن وصفة…', theme: 'التبديل إلى الوضع الداكن', language: 'اللغة', openLanguage: 'فتح اختيار اللغة', browseAll: 'تصفح جميع الوصفات', byMeal: 'حسب الوجبة', byType: 'حسب نوع الطبق', byDiet: 'حسب النظام الغذائي', byTime: 'حسب وقت التحضير', breakfast: 'الفطور', lunch: 'الغداء', dinner: 'العشاء', snacks: 'وجبات خفيفة', soup: 'الشوربات', salad: 'السلطات', pasta: 'المعكرونة', dessert: 'الحلويات', vegetarian: 'نباتي', plantBased: 'نباتي بالكامل', under15: 'أقل من 15 دقيقة', under30: '30 دقيقة أو أقل', openRecipes: 'فتح تصنيفات الوصفات' },
  es: { home: 'Inicio', recipes: 'Recetas', about: 'Nosotros', contact: 'Contacto', skip: 'Saltar al contenido', nav: 'Navegación principal', search: 'Buscar recetas', placeholder: 'Buscar una receta…', theme: 'Cambiar al modo oscuro', language: 'Idioma', openLanguage: 'Abrir selector de idioma', browseAll: 'Ver todas las recetas', byMeal: 'Por comida', byType: 'Por tipo de plato', byDiet: 'Por dieta', byTime: 'Por tiempo de preparación', breakfast: 'Desayuno', lunch: 'Almuerzo', dinner: 'Cena', snacks: 'Aperitivos', soup: 'Sopas', salad: 'Ensaladas', pasta: 'Pasta', dessert: 'Postres', vegetarian: 'Vegetariano', plantBased: 'Basado en plantas', under15: 'Menos de 15 minutos', under30: '30 minutos o menos', openRecipes: 'Abrir categorías de recetas' },
  fr: { home: 'Accueil', recipes: 'Recettes', about: 'À propos', contact: 'Contact', skip: 'Aller au contenu', nav: 'Navigation principale', search: 'Rechercher des recettes', placeholder: 'Rechercher une recette…', theme: 'Passer au mode sombre', language: 'Langue', openLanguage: 'Ouvrir le sélecteur de langue', browseAll: 'Toutes les recettes', byMeal: 'Par repas', byType: 'Par type de plat', byDiet: 'Par régime', byTime: 'Par temps de préparation', breakfast: 'Petit-déjeuner', lunch: 'Déjeuner', dinner: 'Dîner', snacks: 'En-cas', soup: 'Soupes', salad: 'Salades', pasta: 'Pâtes', dessert: 'Desserts', vegetarian: 'Végétarien', plantBased: 'Végétal', under15: 'Moins de 15 minutes', under30: '30 minutes ou moins', openRecipes: 'Ouvrir les catégories de recettes' },
  ru: { home: 'Главная', recipes: 'Рецепты', about: 'О нас', contact: 'Контакты', skip: 'Перейти к содержимому', nav: 'Основная навигация', search: 'Поиск рецептов', placeholder: 'Найти рецепт…', theme: 'Включить тёмную тему', language: 'Язык', openLanguage: 'Открыть выбор языка', browseAll: 'Все рецепты', byMeal: 'По приёму пищи', byType: 'По типу блюда', byDiet: 'По диете', byTime: 'По времени приготовления', breakfast: 'Завтрак', lunch: 'Обед', dinner: 'Ужин', snacks: 'Закуски', soup: 'Супы', salad: 'Салаты', pasta: 'Паста', dessert: 'Десерты', vegetarian: 'Вегетарианское', plantBased: 'Растительное', under15: 'Менее 15 минут', under30: '30 минут или меньше', openRecipes: 'Открыть категории рецептов' }
};
const t = labels[localeKey];

const nav = [
  { href: l.home, label: t.home },
  { href: l.recipes, label: t.recipes },
  { href: `${l.pages}about.html`, label: t.about },
  { href: `${l.pages}contact.html`, label: t.contact }
];

const active = href =>
  (href === l.recipes && (path === `${l.prefix}/recipes.html` || path.startsWith(`${l.prefix}/article/`))) ||
  (href === '/recipes.html' && path.startsWith('/recipes/')) ||
  path === href ||
  (href === l.home && path === l.home);

const recipeSearchHref = term => {
  const englishOnlyTerms = ['pasta', 'plant-based', '15 min', '30 min'];
  const useEnglishCollection = localeKey !== 'en' && (localeKey !== 'ar' || englishOnlyTerms.includes(term));
  const base = useEnglishCollection ? '/recipes.html' : l.recipes;
  return base + '?search=' + encodeURIComponent(term);
};
const menuGroups = [
  { title: t.byMeal, links: [[t.breakfast, 'breakfast', 'فطور'], [t.lunch, 'lunch', 'الغداء'], [t.dinner, 'dinner', 'العشاء'], [t.snacks, 'snack', 'وجبة خفيفة']] },
  { title: t.byType, links: [[t.soup, 'soup', 'شوربة'], [t.salad, 'salad', 'سلطة'], [t.pasta, 'pasta', 'pasta'], [t.dessert, 'dessert', 'الحلويات']] },
  { title: t.byDiet, links: [[t.vegetarian, 'vegetarian', 'نباتي'], [t.plantBased, 'plant-based', 'plant-based']] },
  { title: t.byTime, links: [[t.under15, '15 min', '15 min'], [t.under30, '30 min', '30 min']] }
];
const recipesMenuHtml = `<div class="recipes-menu">
  <button class="recipes-trigger" type="button" aria-expanded="false" aria-haspopup="true" aria-controls="recipes-mega-menu" aria-label="${t.openRecipes}">${t.recipes}<span class="recipes-chevron" aria-hidden="true">⌄</span></button>
  <div class="recipes-mega-menu" id="recipes-mega-menu" aria-label="${t.recipes}">
    ${menuGroups.map(group => `<section class="recipes-menu-group"><h2>${group.title}</h2><ul>${group.links.map(([label, enTerm, arTerm]) => { const term = localeKey === 'ar' ? arTerm : enTerm; return `<li><a href="${recipeSearchHref(term)}">${label}</a></li>`; }).join('')}</ul></section>`).join('')}
    <a class="recipes-menu-all" href="${l.recipes}">${t.browseAll}<span aria-hidden="true">→</span></a>
  </div>
</div>`;
const navHtml = nav.map(({ href, label }) => label === t.recipes ? recipesMenuHtml : `<a href="${href}"${active(href) ? ' aria-current="page"' : ''}>${label}</a>`).join('');
const languageHtml = Object.keys(locales).map(key => {
  const x = linksByLocale[key]();
  const current = key === localeKey;
  const flags = { en: '🇬🇧', ar: '🇸🇦', es: '🇪🇸', fr: '🇫🇷', ru: '🇷🇺' };
  return `<a class="language-option" href="${x.href}" lang="${key}" hreflang="${key}" aria-label="${locales[key].name}" title="${locales[key].name}"${current ? ' aria-current="true"' : ''}><span class="language-code">${locales[key].label}</span><span class="language-flag" aria-hidden="true">${flags[key]}</span>${current ? '<span class="language-check" aria-hidden="true">✓</span>' : ''}</a>`;
}).join('');

const root = document.querySelector('[data-site-header]');
if (!root || root.dataset.initialized) return;
root.dataset.initialized = 'true';

if (!document.querySelector('link[data-font-awesome-tab-icons]')) {
  const fontAwesome = document.createElement('link');
  fontAwesome.rel = 'stylesheet';
  fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css';
  fontAwesome.dataset.fontAwesomeTabIcons = 'true';
  document.head.appendChild(fontAwesome);
}

root.innerHTML = `
<a class="skip-link" href="#main-content">${t.skip}</a>
<header class="site-header">
  <div class="header-inner">
    <a class="brand" href="${l.home}" aria-label="MRecipes ${t.home}"><span class="brand-mark" aria-hidden="true">M</span><span>MRecipes<span class="brand-dot">.</span></span></a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" aria-label="${localeKey === 'ar' ? 'فتح القائمة' : 'Open navigation'}"><span></span><span></span><span></span></button>
    <nav class="primary-nav" id="primary-nav" aria-label="${t.nav}">${navHtml}<div class="language-menu">
      <button class="language-trigger" type="button" aria-expanded="false" aria-haspopup="true" aria-controls="language-options" aria-label="${t.openLanguage}" title="${t.language}">
        <i class="fa-solid fa-globe" aria-hidden="true"></i><span class="language-chevron" aria-hidden="true">⌄</span>
      </button>
      <div class="language-options" id="language-options" role="menu" aria-label="${t.language}">${languageHtml}</div>
    </div></nav>
    <form class="header-search" action="${l.recipes}" role="search">
      <label class="visually-hidden" for="header-search-input">${t.search}</label>
      <input id="header-search-input" name="search" type="search" placeholder="${t.placeholder}" autocomplete="off"/>
      <button type="submit" aria-label="${t.search}">⌕</button>
    </form>
    <button class="theme-toggle" type="button" aria-label="${t.theme}" aria-pressed="false" title="${t.theme}"><span aria-hidden="true">☾</span></button>
  </div>
</header>
<nav class="mobile-tab-bar" aria-label="${t.nav}">${nav.map(({ href, label }) => `<a href="${href}"${active(href) ? ' aria-current="page"' : ''}><i class="fa-solid ${label === t.home ? 'fa-house' : label === t.recipes ? 'fa-utensils' : label === t.about ? 'fa-circle-info' : 'fa-envelope'}" aria-hidden="true"></i><small>${label}</small></a>`).join('')}</nav>`;

const style = document.createElement('style');
style.textContent = `
/* Accessible recipe mega menu: four useful groupings on desktop, compact disclosure on mobile. */
.recipes-menu{position:relative;display:flex;align-items:center;flex:0 0 auto}
.recipes-trigger{display:inline-flex;align-items:center;gap:.45rem;border:0;background:transparent;color:var(--ink);font:inherit;font-weight:700;padding:.65rem .75rem;border-radius:10px;cursor:pointer}
.recipes-trigger:hover,.recipes-menu.is-open>.recipes-trigger{background:color-mix(in srgb,var(--lime) 60%,var(--surface));color:var(--green)}
.recipes-chevron{font-size:1rem;line-height:1;transition:transform .2s ease}
.recipes-menu.is-open .recipes-chevron{transform:rotate(180deg)}
.recipes-mega-menu{position:absolute;z-index:260;top:calc(100% + .7rem);inset-inline-start:50%;transform:translate(-50%,-6px);display:none;grid-template-columns:repeat(4,minmax(140px,1fr));gap:1.25rem;width:min(850px,calc(100vw - 2rem));padding:1.4rem;border:1px solid var(--line);border-radius:20px;background:var(--surface);box-shadow:0 20px 50px rgba(48,37,69,.18)}
.recipes-menu.is-open .recipes-mega-menu{display:grid;transform:translate(-50%,0)}
.recipes-menu-group{min-width:0}
.recipes-menu-group h2{margin:0 0 .65rem;font:700 .82rem/1.4 var(--font-body);letter-spacing:.04em;text-transform:uppercase;color:var(--muted)}
.recipes-menu-group ul{list-style:none;margin:0;padding:0}
.recipes-menu-group li{margin:0}
.recipes-menu-group a,.recipes-menu-all{display:flex;align-items:center;min-height:38px;padding:.45rem .55rem;border-radius:9px;color:var(--ink);text-decoration:none;font-size:.92rem}
.recipes-menu-group a:hover,.recipes-menu-all:hover{background:color-mix(in srgb,var(--lime) 60%,var(--surface));color:var(--green)}
.recipes-menu-all{grid-column:1/-1;justify-content:space-between;margin-top:.15rem;padding:.75rem .8rem;border-top:1px solid var(--line);border-radius:0 0 9px 9px;font-weight:800;color:var(--green)}
html[dir="rtl"] .recipes-menu-all span{transform:scaleX(-1)}
@media(max-width:980px) and (min-width:761px){.recipes-mega-menu{grid-template-columns:repeat(2,minmax(150px,1fr));width:min(620px,calc(100vw - 2rem))}}
@media(max-width:760px){
 .recipes-menu{display:block;width:100%}
 .recipes-trigger{display:flex;width:100%;justify-content:space-between;min-height:44px;padding:.75rem .75rem;border-bottom:1px solid var(--line);text-align:start}
 .recipes-mega-menu{position:static;transform:none!important;width:100%;grid-template-columns:repeat(2,minmax(0,1fr));gap:.6rem;padding:.8rem;border:0;border-radius:12px;box-shadow:none;background:color-mix(in srgb,var(--paper) 85%,var(--surface))}
 .recipes-menu.is-open .recipes-mega-menu{display:grid}
 .recipes-menu-group h2{font-size:.72rem}
 .recipes-menu-group a{font-size:.86rem;padding:.4rem}
 .recipes-menu-all{font-size:.9rem}
}
@media(max-width:380px){.recipes-mega-menu{grid-template-columns:1fr 1fr;gap:.35rem;padding:.55rem}.recipes-menu-group a{font-size:.8rem}}
@media(prefers-reduced-motion:reduce){.recipes-chevron{transition:none}}
.language-menu{position:relative;flex:0 0 auto}.primary-nav>.language-menu{display:flex;align-items:center}.language-trigger{display:inline-flex;align-items:center;justify-content:center;gap:.35rem;min-width:42px;height:42px;padding:0 .7rem;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--ink);font-size:.82rem;font-weight:700}.language-trigger:hover{border-color:var(--green);color:var(--green)}.language-trigger .fa-globe{font-size:1rem}.mobile-floating-tools{display:none}.language-chevron{font-size:1rem;line-height:1;transition:transform .2s ease}.language-menu.is-open .language-chevron{transform:rotate(180deg)}.language-options{position:absolute;z-index:250;top:calc(100% + .6rem);right:0;display:grid;width:136px;padding:.45rem;border:1px solid var(--line);border-radius:16px;background:var(--surface);box-shadow:0 16px 38px rgba(48,37,69,.16);opacity:0;visibility:hidden;transform:translateY(-6px);transition:opacity .18s ease,transform .18s ease,visibility .18s ease}.language-menu.is-open .language-options{opacity:1;visibility:visible;transform:translateY(0)}.language-option{display:grid;grid-template-columns:38px 1fr 20px;align-items:center;gap:.55rem;min-height:44px;padding:.55rem .65rem;border-radius:11px;color:var(--ink);text-decoration:none}.language-option:hover,.language-option[aria-current="true"]{background:color-mix(in srgb,var(--lime) 60%,var(--surface));color:var(--green)}.language-code{font-weight:800}.language-flag{font-size:1.1rem;line-height:1.2;justify-self:start}.language-check{font-weight:800;color:var(--green)}
.mobile-floating-tools{position:fixed;z-index:950;inset-inline-start:.8rem;bottom:calc(5.5rem + env(safe-area-inset-bottom));display:none;flex-direction:column;align-items:center;gap:.55rem}
.mobile-floating-tools .theme-toggle,.mobile-floating-tools .language-trigger{display:grid;place-items:center;width:2.65rem;height:2.65rem;min-width:2.65rem;padding:0;border:1px solid var(--line);border-radius:50%;background:var(--surface);color:var(--green-dark);box-shadow:0 5px 18px rgba(41,37,54,.16);font-size:1.2rem}
.mobile-floating-tools .language-menu{position:relative;display:block}
.mobile-floating-tools .language-options{position:absolute;top:auto;bottom:0;inset-inline-start:calc(100% + .65rem);inset-inline-end:auto;width:190px}
.mobile-floating-tools .language-menu.is-open .language-options{transform:translateY(0)}
.mobile-floating-tools .theme-toggle:hover,.mobile-floating-tools .language-trigger:hover{background:var(--green);border-color:var(--green);color:#fff}
@media(max-width:760px){.header-inner>.theme-toggle{display:none}.primary-nav>.language-menu{display:none}.mobile-floating-tools{display:flex}}
@media(max-width:380px){.mobile-floating-tools{inset-inline-start:.55rem;bottom:calc(5.35rem + env(safe-area-inset-bottom))}.mobile-floating-tools .theme-toggle,.mobile-floating-tools .language-trigger{width:2.45rem;height:2.45rem;min-width:2.45rem}}
@media(max-width:900px){.header-inner{gap:.55rem}.primary-nav{gap:.65rem}.primary-nav a{font-size:.82rem}.header-search{flex-basis:180px;width:180px}.language-trigger{min-width:62px}}
@media(max-width:760px){.header-inner{min-height:4.5rem}.primary-nav{position:absolute;left:1.25rem;right:1.25rem;top:calc(100% + .35rem);display:none;flex-direction:column;align-items:stretch;gap:.15rem;padding:.65rem;border:1px solid var(--line);border-radius:16px;background:var(--surface);box-shadow:0 16px 38px rgba(48,37,69,.14)}.primary-nav.is-open{display:flex}.primary-nav a{padding:.65rem .75rem;border-radius:10px}.primary-nav a:hover,.primary-nav a[aria-current="page"]{background:color-mix(in srgb,var(--lime) 60%,var(--surface))}.primary-nav>.language-menu{align-self:flex-start;margin:.15rem 0}.primary-nav .language-options{left:0;right:auto}.menu-toggle{display:grid;flex:0 0 42px;place-items:center;width:42px;height:42px;padding:.6rem;border:1px solid var(--line);border-radius:12px;background:var(--surface)}.menu-toggle span{display:block;width:20px;height:2px;margin:2px 0;background:var(--ink);border-radius:9px}.header-search{flex:1 1 auto;width:auto;max-width:240px}.language-options{right:auto;left:0}.theme-toggle{flex-basis:40px;width:40px;height:40px}.language-trigger{height:40px;padding:0 .55rem}.language-trigger{min-width:42px;width:42px;padding:0}.language-chevron{display:none}}
@media(max-width:430px){.header-inner{width:calc(100% - 1.25rem);gap:.4rem}.brand{font-size:1.05rem;gap:.4rem}.brand-mark{width:2.05rem;height:2.05rem;font-size:1.15rem}.header-search{max-width:none}.header-search input{font-size:.78rem}.language-trigger{min-width:48px}.language-chevron{display:none}.theme-toggle{display:none}}

/* Article images: keep source proportions, cap desktop width, and stay responsive. */
.content-page img {
  display: block !important;
  width: min(100%, 800px) !important;
  max-width: 100% !important;
  height: auto !important;
  margin: 24px auto !important;
  object-fit: contain !important;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, .06);
}
.content-page > figure.recipe-image {
  width: min(100%, 800px) !important;
  max-width: 100% !important;
  height: auto !important;
  aspect-ratio: auto !important;
  max-height: none !important;
  margin: 24px auto !important;
  overflow: visible !important;
  border-radius: 12px !important;
  background: transparent !important;
}
.content-page > figure.recipe-image img {
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
  object-fit: contain !important;
  object-position: center !important;
  border-radius: inherit !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, .06) !important;
}
@media (max-width: 760px) {
  .content-page img,
  .content-page > figure.recipe-image,
  .content-page > figure.recipe-image img {
    width: 100% !important;
    max-width: 100% !important;
  }
}
`;

document.head.appendChild(style);

const recipesMenu = root.querySelector('.recipes-menu');
const recipesTrigger = root.querySelector('.recipes-trigger');
const closeRecipesMenu = () => { recipesMenu.classList.remove('is-open'); recipesTrigger.setAttribute('aria-expanded', 'false'); };
recipesTrigger.addEventListener('click', () => {
  const open = recipesTrigger.getAttribute('aria-expanded') !== 'true';
  recipesTrigger.setAttribute('aria-expanded', String(open));
  recipesMenu.classList.toggle('is-open', open);
});
recipesMenu.addEventListener('click', event => { if (event.target.closest('.recipes-mega-menu a')) closeRecipesMenu(); });
document.addEventListener('click', event => { if (!recipesMenu.contains(event.target)) closeRecipesMenu(); });

const themeButton = root.querySelector('.theme-toggle');
const languageMenu = root.querySelector('.language-menu');
const languageTrigger = root.querySelector('.language-trigger');
const languageOptions = root.querySelector('.language-options');
const headerInner = root.querySelector('.header-inner');
const primaryNav = root.querySelector('.primary-nav');
const floatingTools = document.createElement('div');
floatingTools.className = 'mobile-floating-tools';
floatingTools.setAttribute('aria-label', localeKey === 'ar' ? 'أدوات العرض واللغة' : 'Display and language tools');
document.body.appendChild(floatingTools);

const mobileToolsQuery = window.matchMedia('(max-width: 760px)');
const placeHeaderTools = () => {
  if (mobileToolsQuery.matches) {
    floatingTools.append(languageMenu, themeButton);
    floatingTools.style.display = 'flex';
  } else {
    primaryNav.appendChild(languageMenu);
    headerInner.appendChild(themeButton);
    floatingTools.style.display = 'none';
  }
};
placeHeaderTools();
if (mobileToolsQuery.addEventListener) mobileToolsQuery.addEventListener('change', placeHeaderTools);
else mobileToolsQuery.addListener(placeHeaderTools);

const themeIcon = themeButton.querySelector('span');
const setTheme = (theme, persist = false) => {
  const dark = theme === 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  themeButton.setAttribute('aria-pressed', String(dark));
  themeButton.setAttribute('aria-label', dark ? (localeKey === 'ar' ? 'التبديل إلى الوضع الفاتح' : localeKey === 'fr' ? 'Passer au mode clair' : localeKey === 'es' ? 'Cambiar al modo claro' : localeKey === 'ru' ? 'Включить светлую тему' : 'Switch to light mode') : t.theme);
  themeIcon.textContent = dark ? '☀' : '☾';
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
  meta.content = dark ? '#171420' : '#fcf9ff';
  if (persist) try { localStorage.setItem('mrecipes-theme', dark ? 'dark' : 'light'); } catch (_) {}
};
let initial = 'light';
try { const s = localStorage.getItem('mrecipes-theme'); if (s === 'dark' || s === 'light') initial = s; } catch (_) {}
setTheme(initial);
themeButton.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true));

const closeLanguage = () => { languageMenu.classList.remove('is-open'); languageTrigger.setAttribute('aria-expanded', 'false'); };
const openLanguage = () => { languageMenu.classList.add('is-open'); languageTrigger.setAttribute('aria-expanded', 'true'); };
languageTrigger.addEventListener('click', () => languageMenu.classList.contains('is-open') ? closeLanguage() : openLanguage());
languageOptions.addEventListener('click', event => { if (event.target.closest('.language-option')) closeLanguage(); });
document.addEventListener('click', event => { if (!languageMenu.contains(event.target)) closeLanguage(); });

const button = root.querySelector('.menu-toggle');
const menu = root.querySelector('.primary-nav');
const close = () => { button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-label', localeKey === 'ar' ? 'فتح القائمة' : 'Open navigation'); menu.classList.remove('is-open'); };
button.addEventListener('click', () => { const open = button.getAttribute('aria-expanded') !== 'true'; button.setAttribute('aria-expanded', String(open)); button.setAttribute('aria-label', open ? (localeKey === 'ar' ? 'إغلاق القائمة' : 'Close navigation') : (localeKey === 'ar' ? 'فتح القائمة' : 'Open navigation')); menu.classList.toggle('is-open', open); });
root.addEventListener('click', e => { if (e.target.closest('.primary-nav a')) close(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (button.getAttribute('aria-expanded') === 'true') { close(); button.focus(); } if (recipesMenu.classList.contains('is-open')) { closeRecipesMenu(); recipesTrigger.focus(); } if (languageMenu.classList.contains('is-open')) { closeLanguage(); languageTrigger.focus(); } } });

if (slug) setTimeout(() => {
  if (document.querySelector('#main-content > .related-posts')) return;
  const script = document.createElement('script');
  script.src = '/assets/js/recipe-enhancements.js';
  script.dataset.recipeEnhancements = 'true';
  document.body.appendChild(script);
}, 150);
})();