(() => {
  'use strict';

  const path = location.pathname.replace(/\/+$/, '') || '/';
  const match = path.match(/^\/(?:ar|es|fr|ru)\/article\/([^/]+)\.html$/) || path.match(/^\/recipes\/([^/]+)\.html$/);
  const article = document.querySelector('#main-content .content-page');
  if (!match || !article) return;

  const slug = decodeURIComponent(match[1]);
  if (slug === 'recipe-template') return;
  if (document.querySelector('#main-content > .related-posts')) return;

  const lang = document.documentElement.lang.toLowerCase().slice(0, 2) || 'en';
  const base = lang === 'en' ? '/recipes/' : `/${lang}/article/`;
  const recipes = [
    ['creamy-garlic-chicken', { en: 'Creamy Garlic Chicken', ar: 'دجاج بالكريمة والثوم', es: 'Pollo cremoso al ajo', fr: 'Poulet crémeux à l’ail', ru: 'Сливочная курица с чесноком' }, { en: 'Easy dinner', ar: 'عشاء سهل', es: 'Cena fácil', fr: 'Dîner facile', ru: 'Простой ужин' }],
    ['classic-pancakes', { en: 'Fluffy Classic Pancakes', ar: 'بان كيك كلاسيكي هش', es: 'Pancakes clásicos esponjosos', fr: 'Pancakes classiques moelleux', ru: 'Пышные классические панкейки' }, { en: 'Breakfast', ar: 'الفطور', es: 'Desayuno', fr: 'Petit-déjeuner', ru: 'Завтрак' }],
    ['mediterranean-pasta', { en: 'Mediterranean Pasta', ar: 'المعكرونة المتوسطية', es: 'Pasta mediterránea', fr: 'Pâtes méditerranéennes', ru: 'Средиземноморская паста' }, { en: 'Weeknight', ar: 'وجبة سريعة', es: 'Entre semana', fr: 'Soirée', ru: 'На каждый день' }],
    ['chocolate-chip-cookies', { en: 'Chocolate Chip Cookies', ar: 'كوكيز رقائق الشوكولاتة', es: 'Galletas con chispas de chocolate', fr: 'Cookies aux pépites de chocolat', ru: 'Печенье с шоколадной крошкой' }, { en: 'Baking', ar: 'الخبز والحلويات', es: 'Repostería', fr: 'Pâtisserie', ru: 'Выпечка' }],
    ['fresh-greek-salad', { en: 'Fresh Greek Salad', ar: 'السلطة اليونانية الطازجة', es: 'Ensalada griega fresca', fr: 'Salade grecque fraîche', ru: 'Свежий греческий салат' }, { en: 'Fresh & easy', ar: 'طازج وسهل', es: 'Fresco y fácil', fr: 'Frais et facile', ru: 'Свежо и просто' }],
    ['homemade-margherita-pizza', { en: 'Homemade Margherita Pizza', ar: 'بيتزا مارغريتا منزلية', es: 'Pizza Margarita casera', fr: 'Pizza Margherita maison', ru: 'Домашняя пицца Маргарита' }, { en: 'Family favorite', ar: 'مفضلة العائلة', es: 'Favorita de la familia', fr: 'Préférée de la famille', ru: 'Любимое блюдо семьи' }],
    ['one-pot-chicken-orzo', { en: 'One-Pot Chicken Orzo', ar: 'أورزو بالدجاج في قدر واحد', es: 'Orzo con pollo en una olla', fr: 'Orzo au poulet en une seule casserole', ru: 'Курица с орзо в одной кастрюле' }, { en: 'One-pot dinner', ar: 'عشاء في قدر واحد', es: 'Cena de una olla', fr: 'Dîner tout-en-un', ru: 'Ужин в одной кастрюле' }],
    ['easy-chickpea-curry', { en: 'Easy Coconut Chickpea Curry', ar: 'كاري الحمص بجوز الهند', es: 'Curry fácil de garbanzos y coco', fr: 'Curry facile de pois chiches au coco', ru: 'Простое карри из нута с кокосом' }, { en: 'Vegetarian', ar: 'نباتي', es: 'Vegetariano', fr: 'Végétarien', ru: 'Вегетарианское' }]
  ];

  const copy = {
    en: { related: 'Maybe you like', relatedText: 'More recipes you might enjoy.', categories: 'Categories', categoriesText: 'Explore recipes by the kind of meal you are craving.', cards: [['Easy Dinners','Simple recipes for busy evenings.','🍽️','dinner'],['Breakfast','Comforting ideas to start the day.','🥞','breakfast'],['Pasta','Quick, creamy and satisfying pasta.','🍝','pasta'],['Chicken','Reliable chicken recipes for every table.','🍗','chicken'],['Baking','Sweet bakes, breads and treats.','🧁','baking'],['Fresh & Easy','Fresh vegetables and lighter meals.','🥗','salad']] },
    ar: { related: 'ربما يعجبك', relatedText: 'وصفات أخرى قد تستمتع بها.', categories: 'التصنيفات', categoriesText: 'اكتشف الوصفات حسب نوع الوجبة التي ترغب بها.', cards: [['عشاء سهل','وصفات بسيطة للأمسيات المزدحمة.','🍽️','dinner'],['الفطور','أفكار شهية لبدء يومك.','🥞','breakfast'],['المعكرونة','وصفات سريعة وكريمية ومشبعة.','🍝','pasta'],['الدجاج','وصفات دجاج موثوقة لكل مائدة.','🍗','chicken'],['الخبز والحلويات','مخبوزات وحلويات لذيذة.','🧁','baking'],['طازج وسهل','خضار طازجة ووجبات خفيفة.','🥗','salad']] },
    es: { related: 'Quizás te guste', relatedText: 'Más recetas que podrían gustarte.', categories: 'Categorías', categoriesText: 'Explora recetas según el tipo de comida que te apetece.', cards: [['Cenas fáciles','Recetas sencillas para las noches ocupadas.','🍽️','dinner'],['Desayuno','Ideas reconfortantes para empezar el día.','🥞','breakfast'],['Pasta','Pasta rápida, cremosa y deliciosa.','🍝','pasta'],['Pollo','Recetas de pollo para toda la mesa.','🍗','chicken'],['Repostería','Dulces, panes y postres caseros.','🧁','baking'],['Fresco y fácil','Verduras frescas y comidas ligeras.','🥗','salad']] },
    fr: { related: 'Vous aimerez peut-être', relatedText: 'D’autres recettes que vous pourriez apprécier.', categories: 'Catégories', categoriesText: 'Découvrez les recettes selon le type de repas dont vous avez envie.', cards: [['Dîners faciles','Des recettes simples pour les soirs chargés.','🍽️','dinner'],['Petit-déjeuner','Des idées réconfortantes pour bien commencer la journée.','🥞','breakfast'],['Pâtes','Des pâtes rapides, crémeuses et savoureuses.','🍝','pasta'],['Poulet','Des recettes de poulet fiables pour toute la table.','🍗','chicken'],['Pâtisserie','Des douceurs, pains et gourmandises maison.','🧁','baking'],['Frais et facile','Des légumes frais et des repas légers.','🥗','salad']] },
    ru: { related: 'Возможно, вам понравится', relatedText: 'Другие рецепты, которые могут вам понравиться.', categories: 'Категории', categoriesText: 'Выбирайте рецепты по типу блюда, которое хочется приготовить.', cards: [['Простые ужины','Несложные рецепты для занятых вечеров.','🍽️','dinner'],['Завтрак','Уютные идеи для начала дня.','🥞','breakfast'],['Паста','Быстрые, сливочные и сытные блюда.','🍝','pasta'],['Курица','Надёжные рецепты с курицей для всей семьи.','🍗','chicken'],['Выпечка','Сладкая выпечка, хлеб и десерты.','🧁','baking'],['Свежо и просто','Свежие овощи и лёгкие блюда.','🥗','salad']]
  }[lang] || null;
  if (!copy) return;

  const t = (value) => typeof value === 'string' ? value : value[lang] || value.en;

  const style = document.createElement('style');
  style.id = 'mrecipes-recommendation-styles';
  style.textContent = `.related-posts,.recipe-categories{width:min(1160px,calc(100% - 2.5rem));margin:0 auto;padding:0 0 4.5rem}.related-posts__heading,.recipe-categories__heading{margin-bottom:1.5rem}.related-posts__heading h2,.recipe-categories__heading h2{margin:.45rem 0 .35rem}.related-posts__heading p,.recipe-categories__heading p{margin:0;color:var(--muted)}.related-posts__grid,.recipe-categories__grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.5rem}.related-post-card{height:100%}.category-card{display:flex;flex-direction:column;gap:.55rem;min-height:170px;padding:1.35rem;border:1px solid var(--line);border-radius:var(--radius);background:var(--surface);box-shadow:0 3px 14px rgba(48,37,69,.025);text-decoration:none;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}.category-card:hover{transform:translateY(-3px);box-shadow:var(--shadow);border-color:var(--green)}.category-card__icon{font-size:2rem;line-height:1}.category-card h3{margin:.1rem 0 0;color:var(--ink)}.category-card p{margin:0;color:var(--muted);font-size:.9rem;line-height:1.6}@media(max-width:760px){.related-posts,.recipe-categories{width:min(100% - 1.5rem,1160px);padding-bottom:3rem}.related-posts__grid,.recipe-categories__grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}}@media(max-width:480px){.related-posts__grid,.recipe-categories__grid{grid-template-columns:1fr}}`;
  document.head.appendChild(style);

  const related = recipes.filter(item => item[0] !== slug).slice(0, 6);
  const relatedSection = document.createElement('section');
  relatedSection.className = 'related-posts';
  relatedSection.setAttribute('aria-labelledby', 'related-posts-title');
  relatedSection.innerHTML = `<div class="related-posts__heading"><span class="eyebrow">${lang === 'ar' ? 'اكتشف المزيد' : 'Keep exploring'}</span><h2 id="related-posts-title">${copy.related}</h2><p>${copy.relatedText}</p></div><div class="related-posts__grid"></div>`;
  const relatedGrid = relatedSection.querySelector('.related-posts__grid');

  related.forEach(([itemSlug, titles, categories]) => {
    const card = document.createElement('article');
    card.className = 'recipe-card related-post-card';
    const link = document.createElement('a');
    link.className = 'recipe-image';
    link.href = `${base}${itemSlug}.html`;
    link.setAttribute('aria-label', t(titles));
    const img = document.createElement('img');
    img.src = `/assets/images/recipes/${itemSlug}.svg`;
    img.alt = t(titles);
    img.loading = 'lazy';
    img.decoding = 'async';
    img.onerror = () => { img.remove(); link.textContent = '🍽️'; };
    link.appendChild(img);
    const content = document.createElement('div');
    content.className = 'recipe-content';
    content.innerHTML = `<div class="recipe-meta"><span>${t(categories)}</span></div><h3><a href="${link.href}">${t(titles)}</a></h3><p>${lang === 'ar' ? 'وصفة منزلية سهلة ولذيذة تستحق التجربة.' : lang === 'es' ? 'Una receta casera sencilla y deliciosa para probar.' : lang === 'fr' ? 'Une recette maison simple et délicieuse à essayer.' : lang === 'ru' ? 'Простой и вкусный домашний рецепт, который стоит попробовать.' : 'A simple, delicious homemade recipe worth trying.'}</p>`;
    card.append(link, content);
    relatedGrid.appendChild(card);
  });

  const categorySection = document.createElement('section');
  categorySection.className = 'recipe-categories';
  categorySection.setAttribute('aria-labelledby', 'recipe-categories-title');
  categorySection.innerHTML = `<div class="recipe-categories__heading"><span class="eyebrow">${lang === 'ar' ? 'تصفح حسب الرغبة' : 'Browse by taste'}</span><h2 id="recipe-categories-title">${copy.categories}</h2><p>${copy.categoriesText}</p></div><div class="recipe-categories__grid"></div>`;
  const categoryGrid = categorySection.querySelector('.recipe-categories__grid');
  copy.cards.forEach(([name, description, icon, search]) => {
    const card = document.createElement('a');
    card.className = 'category-card';
    card.href = lang === 'en' ? `/recipes.html?search=${encodeURIComponent(search)}` : `/${lang}/recipes.html?search=${encodeURIComponent(search)}`;
    card.innerHTML = `<span class="category-card__icon" aria-hidden="true">${icon}</span><h3>${name}</h3><p>${description}</p>`;
    categoryGrid.appendChild(card);
  });

  article.insertAdjacentElement('afterend', relatedSection);
  relatedSection.insertAdjacentElement('afterend', categorySection);
})();
