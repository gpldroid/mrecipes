(() => {
'use strict';
const path=location.pathname.replace(/\/index\.html$/,'/');
const locales={
  en:{prefix:'',dir:'ltr',home:'/',recipes:'/recipes.html',pages:'/pages/',label:'EN',name:'English'},
  ar:{prefix:'/ar',dir:'rtl',home:'/ar/',recipes:'/ar/recipes.html',pages:'/ar/pages/',label:'AR',name:'العربية'},
  es:{prefix:'/es',dir:'ltr',home:'/es/',recipes:'/es/recipes.html',pages:'/es/pages/',label:'ES',name:'Español'},
  fr:{prefix:'/fr',dir:'ltr',home:'/fr/',recipes:'/fr/recipes.html',pages:'/fr/pages/',label:'FR',name:'Français'},
  ru:{prefix:'/ru',dir:'ltr',home:'/ru/',recipes:'/ru/recipes.html',pages:'/ru/pages/',label:'RU',name:'Русский'}
};
const localeKey=Object.keys(locales).find(k=>k==='ar'&&path.startsWith('/ar/')||k!=='ar'&&k!=='en'&&path.startsWith(`/${k}/`)) || 'en';
const l=locales[localeKey];
document.documentElement.lang=localeKey;
document.documentElement.dir=l.dir;
const articleMatch=path.match(/^\/(?:ar|es|fr|ru)\/article\/([^/]+)\.html$/)||path.match(/^\/recipes\/([^/]+)\.html$/);
const slug=articleMatch?.[1];
const pageMatch=path.match(/^\/(?:ar|es|fr|ru)\/pages\/([^/]+)\.html$/)||path.match(/^\/pages\/([^/]+)\.html$/);
const pageSlug=pageMatch?.[1];
const linksByLocale={
 en:()=>({href:slug?`/recipes/${slug}.html`:pageSlug?`/pages/${pageSlug}.html`:l.home,label:'EN'}),
 ar:()=>({href:slug?`/ar/article/${slug}.html`:pageSlug?`/ar/pages/${pageSlug}.html`:'/ar/',label:'AR'}),
 es:()=>({href:slug?`/es/article/${slug}.html`:pageSlug?`/es/pages/${pageSlug}.html`:'/es/',label:'ES'}),
 fr:()=>({href:slug?`/fr/article/${slug}.html`:pageSlug?`/fr/pages/${pageSlug}.html`:'/fr/',label:'FR'}),
 ru:()=>({href:slug?`/ru/article/${slug}.html`:pageSlug?`/ru/pages/${pageSlug}.html`:'/ru/',label:'RU'})
};
const labels={
 en:{home:'Home',recipes:'Recipes',about:'About',contact:'Contact',skip:'Skip to content',nav:'Main navigation',search:'Search recipes',placeholder:'Find a recipe…',theme:'Switch to dark mode'},
 ar:{home:'الرئيسية',recipes:'الوصفات',about:'من نحن',contact:'اتصل بنا',skip:'تجاوز إلى المحتوى',nav:'التنقل الرئيسي',search:'بحث عن وصفة',placeholder:'ابحث عن وصفة…',theme:'التبديل إلى الوضع الداكن'},
 es:{home:'Inicio',recipes:'Recetas',about:'Nosotros',contact:'Contacto',skip:'Saltar al contenido',nav:'Navegación principal',search:'Buscar recetas',placeholder:'Buscar una receta…',theme:'Cambiar al modo oscuro'},
 fr:{home:'Accueil',recipes:'Recettes',about:'À propos',contact:'Contact',skip:'Aller au contenu',nav:'Navigation principale',search:'Rechercher des recettes',placeholder:'Rechercher une recette…',theme:'Passer au mode sombre'},
 ru:{home:'Главная',recipes:'Рецепты',about:'О нас',contact:'Контакты',skip:'Перейти к содержимому',nav:'Основная навигация',search:'Поиск рецептов',placeholder:'Найти рецепт…',theme:'Включить тёмную тему'}
};
const t=labels[localeKey];
const nav=[{href:l.home,label:t.home},{href:l.recipes,label:t.recipes},{href:`${l.pages}about.html`,label:t.about},{href:`${l.pages}contact.html`,label:t.contact}];
const active=href=>href===l.recipes&&path.startsWith(`${l.prefix}/article/`)||href==='/recipes.html'&&path.startsWith('/recipes/')||path===href||href===l.home&&path===l.home;
const navHtml=nav.map(({href,label})=>`<a href="${href}"${active(href)?' aria-current="page"':''}>${label}</a>`).join('');
const languageHtml=Object.keys(locales).map(key=>{const x=linksByLocale[key]();return `<a class="language-switch" href="${x.href}" lang="${key}" hreflang="${key}" aria-label="${locales[key].name}">${locales[key].label}</a>`}).join('');
const root=document.querySelector('[data-site-header]');if(!root||root.dataset.initialized)return;root.dataset.initialized='true';
root.innerHTML=`<a class="skip-link" href="#main-content">${t.skip}</a><header class="site-header"><div class="header-inner"><a class="brand" href="${l.home}" aria-label="MRecipes ${t.home}"><span class="brand-mark" aria-hidden="true">M</span><span>MRecipes<span class="brand-dot">.</span></span></a><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" aria-label="${localeKey==='ar'?'فتح القائمة':'Open navigation'}"><span></span><span></span><span></span></button><nav class="primary-nav" id="primary-nav" aria-label="${t.nav}">${navHtml}</nav><form class="header-search" action="${l.recipes}" role="search"><label class="visually-hidden" for="header-search-input">${t.search}</label><input id="header-search-input" name="search" type="search" placeholder="${t.placeholder}"/><button type="submit" aria-label="${t.search}">⌕</button></form><div class="language-switches" aria-label="Language selection">${languageHtml}</div><button class="theme-toggle" type="button" aria-label="${t.theme}" aria-pressed="false" title="${t.theme}"><span aria-hidden="true">☾</span></button></div></header><nav class="mobile-tab-bar" aria-label="${t.nav}">${nav.map(({href,label})=>`<a href="${href}"${active(href)?' aria-current="page"':''}><span aria-hidden="true">${label===t.home?'⌂':label===t.recipes?'▤':label===t.about?'♡':'✉'}</span><small>${label}</small></a>`).join('')}</nav>`;
const themeButton=root.querySelector('.theme-toggle'),themeIcon=themeButton.querySelector('span');
const setTheme=(theme,persist=false)=>{const dark=theme==='dark';document.documentElement.dataset.theme=dark?'dark':'light';document.documentElement.style.colorScheme=dark?'dark':'light';themeButton.setAttribute('aria-pressed',String(dark));themeButton.setAttribute('aria-label',dark?(localeKey==='ar'?'التبديل إلى الوضع الفاتح':localeKey==='fr'?'Passer au mode clair':localeKey==='es'?'Cambiar al modo claro':localeKey==='ru'?'Включить светлую тему':'Switch to light mode'):t.theme);themeIcon.textContent=dark?'☀':'☾';let meta=document.querySelector('meta[name="theme-color"]');if(!meta){meta=document.createElement('meta');meta.name='theme-color';document.head.appendChild(meta)}meta.content=dark?'#171420':'#fcf9ff';if(persist)try{localStorage.setItem('mrecipes-theme',dark?'dark':'light')}catch(_){}};
let initial='light';try{const s=localStorage.getItem('mrecipes-theme');if(s==='dark'||s==='light')initial=s}catch(_){}setTheme(initial);themeButton.addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark',true));
const button=root.querySelector('.menu-toggle'),menu=root.querySelector('.primary-nav');const close=()=>{button.setAttribute('aria-expanded','false');button.setAttribute('aria-label',localeKey==='ar'?'فتح القائمة':'Open navigation');menu.classList.remove('is-open')};button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?(localeKey==='ar'?'إغلاق القائمة':'Close navigation'):(localeKey==='ar'?'فتح القائمة':'Open navigation'));menu.classList.toggle('is-open',open)});root.addEventListener('click',e=>{if(e.target.closest('.primary-nav a'))close()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&button.getAttribute('aria-expanded')==='true'){close();button.focus()}});
})();