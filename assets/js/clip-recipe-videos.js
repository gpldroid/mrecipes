(() => {
  'use strict';

  if (!document.querySelector('link[data-clip-recipe-video-styles]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = '/assets/css/clip-recipe-videos.css';
    stylesheet.dataset.clipRecipeVideoStyles = 'true';
    document.head.appendChild(stylesheet);
  }

  const videos = {
    chicken: [
      { title: 'Chicken recipe video', cuisine: 'Quick home cooking', time: '40 min', image: 'https://img.cliprecipe.com/images/1473fb0824a64c88ab810cac90f8bdf4_1677726734tplv-tiktokx-origin.image', recipe: 'https://www.cliprecipe.com/recipe/0fbb5f64-1ca8-4501-85a9-2e49891e23a9?utm_source=mrecipes', video: 'https://www.tiktok.com/t/ZP8fHsLAA/' },
      { title: 'Thai-style chicken', cuisine: 'Thai', image: 'https://img.cliprecipe.com/thumbnails/FxPqMSgeZNULkwKHs8aAf8.jpg', recipe: 'https://www.cliprecipe.com/recipe/2d2c6268-009b-417d-bc46-647808857e8a?utm_source=mrecipes', video: 'https://www.instagram.com/reel/DMITsttTqoR/' },
      { title: 'Chicken 65', cuisine: 'Indian', time: '15 min', image: 'https://img.cliprecipe.com/thumbnails/An5giH4FaDYmkDav9RF2fm.jpg', recipe: 'https://www.cliprecipe.com/recipe/314f080a-5317-4322-841a-e4680879e24b?utm_source=mrecipes', video: 'https://vt.tiktok.com/ZSyH8MLtj/' }
    ],
    pasta: [
      { title: 'Italian pasta video', cuisine: 'Italian', image: 'https://img.cliprecipe.com/thumbnails/3WLZfLTLzpgQqunCaQPXvS.jpg', recipe: 'https://www.cliprecipe.com/recipe/0869db0f-d1e9-43c0-9d48-acbe80eed946?utm_source=mrecipes', video: 'https://www.instagram.com/reel/DUEKmuOjFUP/' },
      { title: 'Pasta video inspiration', cuisine: 'Recipe inspiration', image: 'https://img.cliprecipe.com/thumbnails/HAT8b75kmaQqrHZrUVNYYd.webp', recipe: 'https://www.cliprecipe.com/recipe/5523a99e-ce97-4786-a99e-e69ecf74be0f?utm_source=mrecipes', video: 'https://youtube.com/shorts/WHFVTDWaFCU' },
      { title: 'Ouzi pasta', cuisine: 'Middle Eastern', time: '15 min', image: 'https://img.cliprecipe.com/images/osDECAMJiiAwR6AwII3BKpdTwHHAe70WWA8PBqtplv-tiktokx-origin.image', recipe: 'https://www.cliprecipe.com/recipe/e1626a56-5aba-44d4-802b-921beb454f2d?utm_source=mrecipes', video: 'https://www.tiktok.com/t/ZTkbGn5nC/' }
    ],
    baking: [
      { title: 'Soft cookies', cuisine: 'American', time: '11 min', image: 'https://img.cliprecipe.com/images/ooAVHIYUkEfB5jQIjAIfCFrEYDwzcVItIWysfAtplv-tiktokx-origin.image', recipe: 'https://www.cliprecipe.com/recipe/1208b2b6-93cf-46fa-ab39-eff2cac2812f?utm_source=mrecipes', video: 'https://vm.tiktok.com/ZNRnuKGwh/' },
      { title: 'Classic cookies', cuisine: 'American', time: '34 min', image: 'https://img.cliprecipe.com/thumbnails/ABiySQk9eqHjAuXSsynvXq.jpg', recipe: 'https://www.cliprecipe.com/recipe/0f4ceac0-c698-4aa2-a2f2-e24eed5dfdb7?utm_source=mrecipes', video: 'https://www.instagram.com/reel/CwfksGns-Vf/' },
      { title: 'New York cookies', cuisine: 'American', time: '10 min', image: 'https://img.cliprecipe.com/thumbnails/GBrNEXLtmarE3NWkcfefu9.webp', recipe: 'https://www.cliprecipe.com/recipe/4fa85b71-a832-4345-9b90-8e59add6517c?utm_source=mrecipes', video: 'https://youtu.be/P1gqm9CG8sw' }
    ]
  };

  const slug = decodeURIComponent(window.location.pathname.split('/').pop() || '').replace(/\\.html$/i, '').toLowerCase();
  const category = /chicken|tandoori|shakshuka|taco|beef|stir-fry/.test(slug)
    ? 'chicken'
    : /pasta|spaghetti|tortellini|orzo/.test(slug)
      ? 'pasta'
      : /cookie|brownie|muffin|banana-bread|crumble|baking/.test(slug)
        ? 'baking'
        : null;
  if (!category || !videos[category]) return;

  const locale = (document.documentElement.lang || 'en').toLowerCase().split('-')[0];
  const labels = {
    en: { heading: 'Related cooking videos', intro: 'Watch recipe ideas from the Clip Recipe community.', recipe: 'View recipe', watch: 'Watch video', time: 'Total time' },
    ar: { heading: 'فيديوهات وصفات ذات صلة', intro: 'شاهد أفكارًا لتحضير وصفات من مجتمع Clip Recipe.', recipe: 'عرض الوصفة', watch: 'مشاهدة الفيديو', time: 'الوقت الإجمالي' },
    fr: { heading: 'Vidéos de recettes associées', intro: 'Découvrez des idées de recettes de la communauté Clip Recipe.', recipe: 'Voir la recette', watch: 'Voir la vidéo', time: 'Durée totale' },
    es: { heading: 'Vídeos de recetas relacionadas', intro: 'Mira ideas de recetas de la comunidad Clip Recipe.', recipe: 'Ver receta', watch: 'Ver vídeo', time: 'Tiempo total' },
    ru: { heading: 'Похожие видео с рецептами', intro: 'Идеи приготовления от сообщества Clip Recipe.', recipe: 'Открыть рецепт', watch: 'Смотреть видео', time: 'Общее время' }
  }[locale] || { heading: 'Related cooking videos', intro: 'Watch recipe ideas from the Clip Recipe community.', recipe: 'View recipe', watch: 'Watch video', time: 'Total time' };

  const article = document.querySelector('main article') || document.querySelector('main .content-page');
  if (!article || article.querySelector('[data-clip-recipe-videos]')) return;

  const section = document.createElement('section');
  section.className = 'clip-recipe-videos';
  section.dataset.clipRecipeVideos = '';
  section.setAttribute('aria-labelledby', 'clip-recipe-videos-title');

  const heading = document.createElement('h2');
  heading.id = 'clip-recipe-videos-title';
  heading.textContent = labels.heading;
  const intro = document.createElement('p');
  intro.className = 'clip-recipe-videos-intro';
  intro.textContent = labels.intro;
  const grid = document.createElement('div');
  grid.className = 'clip-recipe-videos-grid';

  videos[category].forEach(item => {
    const card = document.createElement('article');
    card.className = 'clip-recipe-video-card';
    const imageLink = document.createElement('a');
    imageLink.className = 'clip-recipe-video-image';
    imageLink.href = item.video;
    imageLink.target = '_blank';
    imageLink.rel = 'noopener noreferrer';
    imageLink.setAttribute('aria-label', labels.watch + ': ' + item.title);
    const image = document.createElement('img');
    image.src = item.image;
    image.alt = item.title;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';
    imageLink.appendChild(image);
    const body = document.createElement('div');
    body.className = 'clip-recipe-video-copy';
    const title = document.createElement('h3');
    title.textContent = item.title;
    const meta = document.createElement('p');
    meta.className = 'clip-recipe-video-meta';
    meta.textContent = [item.cuisine, item.time].filter(Boolean).join(' · ');
    const actions = document.createElement('div');
    actions.className = 'clip-recipe-video-actions';
    const recipeLink = document.createElement('a');
    recipeLink.href = item.recipe;
    recipeLink.target = '_blank';
    recipeLink.rel = 'noopener noreferrer';
    recipeLink.textContent = labels.recipe;
    const videoLink = document.createElement('a');
    videoLink.href = item.video;
    videoLink.target = '_blank';
    videoLink.rel = 'noopener noreferrer';
    videoLink.textContent = labels.watch;
    actions.append(recipeLink, videoLink);
    body.append(title, meta, actions);
    card.append(imageLink, body);
    grid.appendChild(card);
  });

  section.append(heading, intro, grid);
  const author = [...article.querySelectorAll('p')].find(node => /recipe by|recipe content by|وصفة بواسطة/i.test(node.textContent || ''));
  if (author) author.parentNode.insertBefore(section, author);
  else article.appendChild(section);
})();
