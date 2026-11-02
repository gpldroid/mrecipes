(async () => {
'use strict';const root=document.querySelector('[data-site-footer]');if(!root||root.dataset.initialized)return;root.dataset.initialized='true';const locale = ['ar', 'en', 'fr', 'es', 'ru'].includes(document.documentElement.lang.toLowerCase())
  ? document.documentElement.lang.toLowerCase()
  : (location.pathname.match(/^\/(ar|fr|es|ru)(?:\/|$)/)?.[1] || 'en');
const ar = locale === 'ar';
const route = locale === 'en'
  ? { home: '/', recipes: '/recipes.html', pages: '/pages/' }
  : { home: '/' + locale + '/', recipes: '/' + locale + '/recipes.html', pages: '/' + locale + '/pages/' };
const fallbackP = ar ? {
  home: route.home, recipes: route.recipes, about: route.pages + 'about.html', contact: route.pages + 'contact.html',
  privacy: route.pages + 'privacy-policy.html', terms: route.pages + 'terms.html', disclaimer: route.pages + 'disclaimer.html',
  desc: 'وصفات موثوقة، وإلهام يومي، وأفكار لذيذة لمائدتك.', explore: 'استكشف', info: 'معلومات', all: 'جميع الوصفات',
  homeT: 'الرئيسية', aboutT: 'من نحن', contactT: 'اتصل بنا', privacyT: 'سياسة الخصوصية', termsT: 'شروط الاستخدام',
  discT: 'إخلاء المسؤولية', cookie: 'تفضيلات ملفات تعريف الارتباط', copy: 'جميع الحقوق محفوظة.',
  managed: 'تم إعداد وإدارة المحتوى بواسطة', siteFooter: 'تذييل الموقع'
} : {
  home: route.home, recipes: route.recipes, about: route.pages + 'about.html', contact: route.pages + 'contact.html',
  privacy: route.pages + 'privacy-policy.html', terms: route.pages + 'terms.html', disclaimer: route.pages + 'disclaimer.html',
  desc: 'Reliable recipes, everyday inspiration, and delicious ideas for your table.', explore: 'Explore', info: 'Information',
  all: 'All recipes', homeT: 'Home', aboutT: 'About us', contactT: 'Contact', privacyT: 'Privacy policy',
  termsT: 'Terms of use', discT: 'Disclaimer', cookie: 'Cookie preferences', copy: 'All rights reserved.',
  managed: 'Content crafted and managed by', siteFooter: 'Site footer'
};
const fallbackCopy = ar ? {
  title: 'إشعار صغير حول ملفات تعريف الارتباط',
  body: 'نستخدم التخزين الضروري لتشغيل MRecipes. وبموافقتك، يمكن تفعيل خيارات اختيارية لحفظ التفضيلات وقياس استخدام الموقع وعرض الإعلانات.',
  accept: 'قبول الكل', reject: 'رفض الاختيارية', customize: 'إدارة التفضيلات', save: 'حفظ اختياراتي', back: 'رجوع',
  alwaysOn: 'مفعّلة دائماً', essential: 'ضرورية', essentialDesc: 'مطلوبة لتشغيل الموقع وحفظ اختيار الموافقة.',
  functional: 'وظيفية', functionalDesc: 'تذكّر اختيارات مفيدة مثل نمط العرض المفضل.',
  analytics: 'التحليلات', analyticsDesc: 'السماح لـ Google Analytics بقياس كيفية استخدام الزوار للموقع.',
  marketing: 'التسويق والإعلانات', marketingDesc: 'السماح لـ Google AdSense بعرض الإعلانات واستخدام التخزين المرتبط بها.'
} : {
  title: 'A little cookie note!',
  body: 'We use essential storage to keep MRecipes working. With your permission, optional settings can remember preferences, measure site usage, and support advertising.',
  accept: 'Accept all', reject: 'Reject optional', customize: 'Customize preferences', save: 'Save my choices', back: 'Back',
  alwaysOn: 'Always on', essential: 'Strictly necessary', essentialDesc: 'Required for core site functions and saving your consent choice.',
  functional: 'Functional', functionalDesc: 'Remember helpful choices, such as your preferred display theme.',
  analytics: 'Analytics', analyticsDesc: 'Allow Google Analytics to measure how visitors use MRecipes.',
  marketing: 'Marketing & advertising', marketingDesc: 'Allow Google AdSense to display ads and use related storage.'
};
let catalog = null;
try {
  const response = await fetch('/i18n/locales/' + locale + '.json', { credentials: 'same-origin' });
  if (response.ok) catalog = await response.json();
} catch (_) {}
const p = catalog ? {
  home: route.home, recipes: route.recipes, about: route.pages + 'about.html', contact: route.pages + 'contact.html',
  privacy: route.pages + 'privacy-policy.html', terms: route.pages + 'terms.html', disclaimer: route.pages + 'disclaimer.html',
  desc: catalog.footer.description, explore: catalog.footer.explore, info: catalog.footer.information, all: catalog.footer.allRecipes,
  homeT: catalog.common.home, aboutT: catalog.pages.about, contactT: catalog.pages.contact, privacyT: catalog.pages.privacy,
  termsT: catalog.pages.terms, discT: catalog.pages.disclaimer, cookie: catalog.footer.cookiePreferences,
  copy: catalog.footer.allRightsReserved, managed: catalog.footer.managedBy, siteFooter: catalog.footer.siteFooter
} : fallbackP;
const categoryData = {
  en: { title: 'Explore recipe categories', items: [['Breakfast','breakfast'],['Lunch','lunch'],['Dinner','dinner'],['Snacks','snack'],['Soups','soup'],['Salads','salad'],['Pasta','pasta'],['Desserts','dessert'],['Vegetarian','vegetarian'],['Plant-based','plant-based'],['Chicken','chicken'],['Baking','baking']] },
  ar: { title: 'استكشف تصنيفات الوصفات', items: [['الفطور','breakfast'],['الغداء','lunch'],['العشاء','dinner'],['وجبات خفيفة','snack'],['الشوربات','soup'],['السلطات','salad'],['المعكرونة','pasta'],['الحلويات','dessert'],['نباتي','vegetarian'],['نباتي بالكامل','plant-based'],['الدجاج','chicken'],['المخبوزات','baking']] },
  fr: { title: 'Explorer les catégories de recettes', items: [['Petit-déjeuner','breakfast'],['Déjeuner','lunch'],['Dîner','dinner'],['Collations','snack'],['Soupes','soup'],['Salades','salad'],['Pâtes','pasta'],['Desserts','dessert'],['Végétarien','vegetarian'],['Végétal','plant-based'],['Poulet','chicken'],['Pâtisserie','baking']] },
  es: { title: 'Explora las categorías de recetas', items: [['Desayuno','breakfast'],['Almuerzo','lunch'],['Cena','dinner'],['Aperitivos','snack'],['Sopas','soup'],['Ensaladas','salad'],['Pasta','pasta'],['Postres','dessert'],['Vegetariano','vegetarian'],['Basado en plantas','plant-based'],['Pollo','chicken'],['Repostería','baking']] },
  ru: { title: 'Категории рецептов', items: [['Завтрак','breakfast'],['Обед','lunch'],['Ужин','dinner'],['Закуски','snack'],['Супы','soup'],['Салаты','salad'],['Паста','pasta'],['Десерты','dessert'],['Вегетарианское','vegetarian'],['Растительное питание','plant-based'],['Курица','chicken'],['Выпечка','baking']] }
}[locale] || { title: 'Explore recipe categories', items: [] };
const categorySection = '<section class="footer-category-section" aria-labelledby="footer-category-title"><div class="footer-category-inner"><h2 id="footer-category-title">' + categoryData.title + '</h2><nav class="footer-category-links" aria-label="' + categoryData.title + '">' + categoryData.items.map(([label, term]) => '<a href="' + route.recipes + '?search=' + encodeURIComponent(term) + '">' + label + '</a>').join('') + '</nav></div></section>';
root.innerHTML=`${categorySection}<footer class="site-footer" aria-label="${p.siteFooter}"><div class="footer-grid"><div class="footer-brand"><a class="brand brand-footer" href="${p.home}" aria-label="MRecipes"><span class="brand-mark" aria-hidden="true">M</span><span>MRecipes<span class="brand-dot">.</span></span></a><p>${p.desc}</p></div><div class="footer-links"><h2>${p.explore}</h2><ul><li><a href="${p.home}">${p.homeT}</a></li><li><a href="${p.recipes}">${p.all}</a></li><li><a href="${p.about}">${p.aboutT}</a></li><li><a href="${p.contact}">${p.contactT}</a></li></ul></div><div class="footer-links"><h2>${p.info}</h2><ul><li><a href="${p.privacy}">${p.privacyT}</a></li><li><a href="${p.terms}">${p.termsT}</a></li><li><a href="${p.disclaimer}">${p.discT}</a></li><li><button class="cookie-preferences-link" type="button" data-open-cookie-preferences>${p.cookie}</button></li></ul></div></div><div class="footer-bottom"><span>© <span data-current-year></span> MRecipes. ${p.copy}</span><span>${p.managed} <strong>Imad Limrani</strong>.</span></div></footer>`;root.querySelector('[data-current-year]').textContent=new Date().getFullYear();const copy = catalog ? {
  title: catalog.consent.title, body: catalog.consent.body, accept: catalog.consent.accept,
  reject: catalog.consent.reject, customize: catalog.consent.customize, save: catalog.consent.save,
  back: catalog.consent.back, alwaysOn: catalog.consent.alwaysOn, essential: catalog.consent.essential,
  essentialDesc: catalog.consent.essentialDesc, functional: catalog.consent.functional,
  functionalDesc: catalog.consent.functionalDesc, analytics: catalog.consent.analytics,
  analyticsDesc: catalog.consent.analyticsDesc, marketing: catalog.consent.marketing,
  marketingDesc: catalog.consent.marketingDesc
} : fallbackCopy;
const key = 'mrecipes-cookie-consent';
let saved = null;
try { saved = JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) {}
const hasCurrentConsent = !!(saved && saved.version === 2);
const banner = document.createElement('section');
banner.className = 'cookie-consent';
banner.hidden = hasCurrentConsent;
banner.setAttribute('role', 'dialog');
banner.setAttribute('aria-modal', 'false');
banner.setAttribute('aria-labelledby', 'cookie-consent-title');
banner.setAttribute('aria-describedby', 'cookie-consent-description');
banner.innerHTML = `
  <div class="cookie-consent__main" data-cookie-main>
    <div class="cookie-consent__illustration" aria-hidden="true">
      <svg viewBox="0 0 120 120" focusable="false">
        <path d="M96 54a38 38 0 1 1-30-30 13 13 0 0 0 18 18 13 13 0 0 0 12 12Z" fill="#D69A5B" stroke="#8E542F" stroke-width="3" stroke-linejoin="round"/>
        <circle cx="43" cy="49" r="5" fill="#70432D"/><circle cx="68" cy="39" r="4.5" fill="#70432D"/>
        <circle cx="72" cy="69" r="5" fill="#70432D"/><circle cx="43" cy="78" r="4" fill="#70432D"/>
        <circle cx="88" cy="88" r="3" fill="#70432D"/><path d="M18 25l5-5m-8 17-7 1m91 58 5 5" stroke="#D69A5B" stroke-width="3" stroke-linecap="round"/>
      </svg>
    </div>
    <div class="cookie-consent__content">
      <span class="cookie-consent__eyebrow">MRECIPES · PRIVACY</span>
      <h2 id="cookie-consent-title">${copy.title}</h2>
      <p id="cookie-consent-description">${copy.body} <a href="${p.privacy}">${p.privacyT}</a></p>
    </div>
    <div class="cookie-consent__actions">
      <button type="button" class="button cookie-consent__accept" data-cookie-accept>${copy.accept}</button>
      <button type="button" class="cookie-consent__reject" data-cookie-reject>${copy.reject}</button>
      <button type="button" class="cookie-consent__customize" data-cookie-customize>${copy.customize}</button>
    </div>
  </div>
  <div class="cookie-consent__preferences" data-cookie-panel hidden>
    <div class="cookie-consent__preferences-heading">
      <div><span class="cookie-consent__eyebrow">MRECIPES · PRIVACY</span><h3>${copy.customize}</h3></div>
      <p>${copy.body}</p>
    </div>
    <label class="cookie-choice"><input type="checkbox" checked disabled><span><strong>${copy.essential}</strong><small>${copy.essentialDesc}</small></span><em>${copy.alwaysOn}</em></label>
    <label class="cookie-choice"><input type="checkbox" role="switch" data-cookie-functional><span><strong>${copy.functional}</strong><small>${copy.functionalDesc}</small></span></label>
    <label class="cookie-choice"><input type="checkbox" role="switch" data-cookie-analytics><span><strong>${copy.analytics}</strong><small>${copy.analyticsDesc}</small></span></label>
    <label class="cookie-choice"><input type="checkbox" role="switch" data-cookie-marketing><span><strong>${copy.marketing}</strong><small>${copy.marketingDesc}</small></span></label>
    <div class="cookie-consent__actions">
      <button type="button" class="button cookie-consent__accept" data-cookie-save>${copy.save}</button>
      <button type="button" class="cookie-consent__reject" data-cookie-back>${copy.back}</button>
    </div>
  </div>`;
document.body.appendChild(banner);
const mainView = banner.querySelector('[data-cookie-main]');
const panel = banner.querySelector('[data-cookie-panel]');
const setCheckboxes = () => {
  banner.querySelector('[data-cookie-functional]').checked = !!(saved && saved.functional);
  banner.querySelector('[data-cookie-analytics]').checked = !!(saved && saved.analytics);
  banner.querySelector('[data-cookie-marketing]').checked = !!(saved && saved.marketing);
};
const showView = (preferences, focus = true) => {
  banner.hidden = false;
  mainView.hidden = preferences;
  panel.hidden = !preferences;
  setCheckboxes();
  if (focus) requestAnimationFrame(() => {
    const target = preferences ? panel.querySelector('input:not([disabled])') : banner.querySelector('[data-cookie-customize]');
    target?.focus();
  });
};
const openPreferences = () => showView(true);
const closePreferences = () => showView(false);
const save = (preferences) => {
  saved = {
    version: 2,
    necessary: true,
    functional: !!preferences.functional,
    analytics: !!preferences.analytics,
    marketing: !!preferences.marketing,
    updatedAt: new Date().toISOString()
  };
  try { localStorage.setItem(key, JSON.stringify(saved)); } catch (_) {}
  banner.hidden = true;
  window.dispatchEvent(new CustomEvent('mrecipes:consent-updated', { detail: { ...saved } }));
};
banner.querySelector('[data-cookie-accept]').addEventListener('click', () => save({ functional: true, analytics: true, marketing: true }));
banner.querySelector('[data-cookie-reject]').addEventListener('click', () => save({ functional: false, analytics: false, marketing: false }));
banner.querySelector('[data-cookie-customize]').addEventListener('click', openPreferences);
banner.querySelector('[data-cookie-save]').addEventListener('click', () => save({
  functional: banner.querySelector('[data-cookie-functional]').checked,
  analytics: banner.querySelector('[data-cookie-analytics]').checked,
  marketing: banner.querySelector('[data-cookie-marketing]').checked
}));
banner.querySelector('[data-cookie-back]').addEventListener('click', closePreferences);
root.querySelector('[data-open-cookie-preferences]')?.addEventListener('click', openPreferences);
banner.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !panel.hidden) closePreferences();
});
window.MRecipesConsent = Object.freeze({
  get: () => saved ? { ...saved } : null,
  has: category => category === 'necessary' || !!(saved && saved.version === 2 && saved[category] === true),
  openPreferences
});
window.dispatchEvent(new CustomEvent('mrecipes:consent-ready', { detail: saved ? { ...saved } : null }));
})();

/* Load article-image rules after the shared header styles so they can override legacy image sizing. */
(() => {
  if (!document.querySelector('link[data-article-image-styles]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/assets/css/article-images.css';
    link.dataset.articleImageStyles = 'true';
    document.head.appendChild(link);
  }
})();

/* Load the same featured-image synchronizer on every localized article page. */
(() => {
  if (!document.querySelector('script[data-article-images]')) {
    const script = document.createElement('script');
    script.src = '/assets/js/article-images.js';
    script.defer = true;
    script.dataset.articleImages = 'true';
    document.head.appendChild(script);
  }
})();