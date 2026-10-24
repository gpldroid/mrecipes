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
  en: { home: 'Home', recipes: 'Recipes', about: 'About', contact: 'Contact', skip: 'Skip to content', nav: 'Main navigation', search: 'Search recipes', placeholder: 'Find a recipe…', theme: 'Switch to dark mode', language: 'Language', openLanguage: 'Open language selector' },
  ar: { home: 'الرئيسية', recipes: 'الوصفات', about: 'من نحن', contact: 'اتصل بنا', skip: 'تجاوز إلى المحتوى', nav: 'التنقل الرئيسي', search: 'بحث عن وصفة', placeholder: 'ابحث عن وصفة…', theme: 'التبديل إلى الوضع الداكن', language: 'اللغة', openLanguage: 'فتح اختيار اللغة' },
  es: { home: 'Inicio', recipes: 'Recetas', about: 'Nosotros', contact: 'Contacto', skip: 'Saltar al contenido', nav: 'Navegación principal', search: 'Buscar recetas', placeholder: 'Buscar una receta…', theme: 'Cambiar al modo oscuro', language: 'Idioma', openLanguage: 'Abrir selector de idioma' },
  fr: { home: 'Accueil', recipes: 'Recettes', about: 'À propos', contact: 'Contact', skip: 'Aller au contenu', nav: 'Navigation principale', search: 'Rechercher des recettes', placeholder: 'Rechercher une recette…', theme: 'Passer au mode sombre', language: 'Langue', openLanguage: 'Ouvrir le sélecteur de langue' },
  ru: { home: 'Главная', recipes: 'Рецепты', about: 'О нас', contact: 'Контакты', skip: 'Перейти к содержимому', nav: 'Основная навигация', search: 'Поиск рецептов', placeholder: 'Найти рецепт…', theme: 'Включить тёмную тему', language: 'Язык', openLanguage: 'Открыть выбор языка' }
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

const navHtml = nav.map(({ href, label }) => `<a href="${href}"${active(href) ? ' aria-current="page"' : ''}>${label}</a>`).join('');
const languageHtml = Object.keys(locales).map(key => {
  const x = linksByLocale[key]();
  const current = key === localeKey;
  return `<a class="language-option" href="${x.href}" lang="${key}" hreflang="${key}"${current ? ' aria-current="true"' : ''}><span class="language-code">${locales[key].label}</span><span class="language-name">${locales[key].name}</span>${current ? '<span class="language-check" aria-hidden="true">✓</span>' : ''}</a>`;
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
        <span aria-hidden="true">◎</span><strong>${locales[localeKey].label}</strong><span class="language-chevron" aria-hidden="true">⌄</span>
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
.language-menu{position:relative;flex:0 0 auto}.primary-nav>.language-menu{display:flex;align-items:center}.language-trigger{display:inline-flex;align-items:center;justify-content:center;gap:.35rem;min-width:68px;height:42px;padding:0 .7rem;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--ink);font-size:.82rem;font-weight:700}.language-trigger:hover{border-color:var(--green);color:var(--green)}.language-chevron{font-size:1rem;line-height:1;transition:transform .2s ease}.language-menu.is-open .language-chevron{transform:rotate(180deg)}.language-options{position:absolute;z-index:250;top:calc(100% + .6rem);right:0;display:grid;width:190px;padding:.45rem;border:1px solid var(--line);border-radius:16px;background:var(--surface);box-shadow:0 16px 38px rgba(48,37,69,.16);opacity:0;visibility:hidden;transform:translateY(-6px);transition:opacity .18s ease,transform .18s ease,visibility .18s ease}.language-menu.is-open .language-options{opacity:1;visibility:visible;transform:translateY(0)}.language-option{display:grid;grid-template-columns:38px minmax(0,1fr) 20px;align-items:center;gap:.55rem;min-height:44px;padding:.55rem .65rem;border-radius:11px;color:var(--ink);text-decoration:none}.language-option:hover,.language-option[aria-current="true"]{background:color-mix(in srgb,var(--lime) 60%,var(--surface));color:var(--green)}.language-code{font-weight:800}.language-name{font-size:.86rem;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.language-check{font-weight:800;color:var(--green)}
@media(max-width:900px){.header-inner{gap:.55rem}.primary-nav{gap:.65rem}.primary-nav a{font-size:.82rem}.header-search{flex-basis:180px;width:180px}.language-trigger{min-width:62px}}
@media(max-width:760px){.header-inner{min-height:4.5rem}.primary-nav{position:absolute;left:1.25rem;right:1.25rem;top:calc(100% + .35rem);display:none;flex-direction:column;align-items:stretch;gap:.15rem;padding:.65rem;border:1px solid var(--line);border-radius:16px;background:var(--surface);box-shadow:0 16px 38px rgba(48,37,69,.14)}.primary-nav.is-open{display:flex}.primary-nav a{padding:.65rem .75rem;border-radius:10px}.primary-nav a:hover,.primary-nav a[aria-current="page"]{background:color-mix(in srgb,var(--lime) 60%,var(--surface))}.primary-nav>.language-menu{align-self:flex-start;margin:.15rem 0}.primary-nav .language-options{left:0;right:auto}.menu-toggle{display:grid;flex:0 0 42px;place-items:center;width:42px;height:42px;padding:.6rem;border:1px solid var(--line);border-radius:12px;background:var(--surface)}.menu-toggle span{display:block;width:20px;height:2px;margin:2px 0;background:var(--ink);border-radius:9px}.header-search{flex:1 1 auto;width:auto;max-width:240px}.language-options{right:auto;left:0}.theme-toggle{flex-basis:40px;width:40px;height:40px}.language-trigger{height:40px;padding:0 .55rem}.language-trigger strong{font-size:.75rem}.language-trigger>span:first-child{display:none}}
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

const themeButton = root.querySelector('.theme-toggle');
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

const languageMenu = root.querySelector('.language-menu');
const languageTrigger = root.querySelector('.language-trigger');
const languageOptions = root.querySelector('.language-options');
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
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (button.getAttribute('aria-expanded') === 'true') { close(); button.focus(); } if (languageMenu.classList.contains('is-open')) { closeLanguage(); languageTrigger.focus(); } } });

if (slug) setTimeout(() => {
  if (document.querySelector('#main-content > .related-posts')) return;
  const script = document.createElement('script');
  script.src = '/assets/js/recipe-enhancements.js';
  script.dataset.recipeEnhancements = 'true';
  document.body.appendChild(script);
}, 150);
})();