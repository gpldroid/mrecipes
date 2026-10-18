(() => {
  'use strict';
  const path = location.pathname.replace(/\/index\.html$/, '/');
  const locale = ['es','fr','ru'].find(code => path.startsWith(`/${code}/`));
  const grid = document.querySelector('.recipe-grid[data-supabase-recipes]');
  if (!locale || !grid) return;

  const data = {
    es: [
      ['garlic-butter-pasta','Pasta con mantequilla y ajo','Pasta','Una pasta rápida y brillante con ajo, mantequilla y parmesano.'],
      ['lemon-herb-lentil-salad','Ensalada de lentejas con limón y hierbas','Ensalada','Lentejas tiernas con pepino, tomate, hierbas y aderezo de limón.'],
      ['roasted-chickpea-bowl','Bowl de garbanzos asados','Almuerzo vegetariano','Garbanzos crujientes, cereales, verduras y salsa de tahini.'],
      ['no-bake-chocolate-oat-bars','Barritas de avena y chocolate sin horno','Snack','Avena, crema de cacahuete y chocolate en un dulce fácil.'],
      ['scrambled-eggs-on-toast','Huevos revueltos cremosos sobre tostada','Desayuno','Huevos suaves y cremosos sobre pan tostado crujiente.'],
      ['juicy-baked-chicken-breast','Pechuga de pollo al horno jugosa','Cena de pollo','Pollo tierno al horno con ajo, pimentón y aceite de oliva.'],
      ['easy-chickpea-curry','Curry fácil de garbanzos y coco','Cena vegetariana','Garbanzos en una salsa aromática de tomate y coco.'],
      ['crispy-oven-potato-wedges','Gajos de patata crujientes al horno','Guarnición','Patatas doradas con ajo y pimentón, crujientes por fuera.'],
      ['overnight-oats','Avena cremosa nocturna','Desayuno','Avena preparada con leche, yogur y semillas de chía.'],
      ['easy-fudgy-brownies','Brownies fáciles y jugosos','Postre','Brownies intensamente chocolatosos con centro suave.'],
      ['creamy-garlic-chicken','Pollo cremoso al ajo','Cena fácil','Pollo tierno en una salsa cremosa de ajo y parmesano.'],
      ['classic-pancakes','Pancakes clásicos esponjosos','Desayuno','Pancakes dorados y suaves con ingredientes cotidianos.']
    ],
    fr: [
      ['garlic-butter-pasta','Pâtes au beurre et à l’ail','Pâtes','Des pâtes rapides et brillantes avec ail, beurre et parmesan.'],
      ['lemon-herb-lentil-salad','Salade de lentilles au citron et aux herbes','Salade','Lentilles, concombre, tomates et herbes avec une vinaigrette citronnée.'],
      ['roasted-chickpea-bowl','Bowl de pois chiches rôtis','Déjeuner végétarien','Pois chiches croustillants, céréales, légumes et sauce tahini.'],
      ['no-bake-chocolate-oat-bars','Barres chocolat-avoine sans cuisson','Snack','Avoine, beurre de cacahuète et chocolat dans une douceur facile.'],
      ['scrambled-eggs-on-toast','Œufs brouillés crémeux sur toast','Petit-déjeuner','Des œufs doux et crémeux sur une tranche de pain grillé.'],
      ['juicy-baked-chicken-breast','Blanc de poulet rôti et juteux','Dîner au poulet','Poulet tendre au four avec ail, paprika et huile d’olive.'],
      ['easy-chickpea-curry','Curry facile de pois chiches au coco','Dîner végétarien','Pois chiches mijotés dans une sauce tomate et coco parfumée.'],
      ['crispy-oven-potato-wedges','Quartiers de pommes de terre croustillants','Accompagnement','Des pommes de terre dorées à l’ail et au paprika.'],
      ['overnight-oats','Overnight oats crémeux','Petit-déjeuner','Avoine, lait, yaourt et graines de chia préparés à l’avance.'],
      ['easy-fudgy-brownies','Brownies fondants faciles','Dessert','Des brownies très chocolatés au cœur tendre.'],
      ['creamy-garlic-chicken','Poulet crémeux à l’ail','Dîner facile','Poulet tendre dans une sauce crémeuse à l’ail et au parmesan.'],
      ['classic-pancakes','Pancakes classiques moelleux','Petit-déjeuner','Des pancakes dorés et légers avec des ingrédients du placard.']
    ],
    ru: [
      ['garlic-butter-pasta','Паста с чесночным маслом','Паста','Быстрая паста с ароматным чесноком, сливочным маслом и пармезаном.'],
      ['lemon-herb-lentil-salad','Салат из чечевицы с лимоном и зеленью','Салат','Чечевица, огурец, помидоры и зелень с яркой лимонной заправкой.'],
      ['roasted-chickpea-bowl','Боул с запечённым нутом','Вегетарианский обед','Хрустящий нут, крупа, овощи и лимонно-тахинный соус.'],
      ['no-bake-chocolate-oat-bars','Шоколадно-овсяные батончики без выпечки','Перекус','Овсянка, арахисовая паста и шоколад в простом десерте.'],
      ['scrambled-eggs-on-toast','Сливочная яичница-болтунья на тосте','Завтрак','Нежные кремовые яйца на хрустящем тосте.'],
      ['juicy-baked-chicken-breast','Сочная куриная грудка в духовке','Ужин с курицей','Нежная курица с чесноком, паприкой и оливковым маслом.'],
      ['easy-chickpea-curry','Простое карри из нута с кокосом','Вегетарианский ужин','Нут в ароматном томатно-кокосовом соусе со специями.'],
      ['crispy-oven-potato-wedges','Хрустящие картофельные дольки в духовке','Гарнир','Золотистый картофель с чесноком и паприкой.'],
      ['overnight-oats','Ночная овсянка','Завтрак','Овсянка с молоком, йогуртом и семенами чиа.'],
      ['easy-fudgy-brownies','Простые шоколадные брауни','Десерт','Насыщенные шоколадные брауни с мягкой серединой.'],
      ['creamy-garlic-chicken','Сливочная курица с чесноком','Простой ужин','Нежная курица в сливочном чесночном соусе с пармезаном.'],
      ['classic-pancakes','Пышные классические панкейки','Завтрак','Золотистые мягкие панкейки из обычных продуктов.']
    ]
  }[locale];

  const base = `/${locale}/article/`;
  const fragment = document.createDocumentFragment();
  data.forEach(([slug, title, category, excerpt]) => {
    const card = document.createElement('article');
    card.className = 'recipe-card';
    card.dataset.recipeCard = '';
    card.dataset.tags = `${title} ${category} ${excerpt}`.toLowerCase();
    card.innerHTML = `<a class="recipe-image" href="${base}${slug}.html" aria-label="${title}"><img src="/assets/images/recipes/${slug}.webp" alt="${title}" loading="lazy" decoding="async"></a><div class="recipe-content"><div class="recipe-meta"><span>${category}</span></div><h3><a href="${base}${slug}.html">${title}</a></h3><p>${excerpt}</p></div>`;
    fragment.appendChild(card);
  });
  grid.replaceChildren(fragment);
  document.dispatchEvent(new CustomEvent('mrecipes:localized-home-ready'));
})();
