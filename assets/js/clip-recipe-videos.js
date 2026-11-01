(() => {
  'use strict';

  if (!document.querySelector('link[data-clip-recipe-video-styles]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = '/assets/css/clip-recipe-videos.css';
    stylesheet.dataset.clipRecipeVideoStyles = 'true';
    document.head.appendChild(stylesheet);
  }

  // Exact recipe-to-video matches. No broad category fallbacks: a page only shows
  // videos whose Clip Recipe title matches that recipe.
  const videos = {
    'marry-me-chicken': [
      { title: 'Marry Me Chicken', cuisine: 'Italian', image: 'https://img.cliprecipe.com/thumbs/da7ddd3a-0bad-4cb6-9165-6b59c896051a.jpg', recipe: 'https://www.cliprecipe.com/recipe/612d325e-b2ad-48de-8ec1-c7816575e66a?utm_source=mrecipes', video: 'https://www.tiktok.com/t/ZTUEnurxS/' }
    ],
    'creamy-garlic-chicken': [
      { title: 'Creamy Garlic Chicken', cuisine: 'American', image: 'https://img.cliprecipe.com/thumbs/d13e02b5-c949-4b87-b64f-1a35537261a1.jpg', recipe: 'https://www.cliprecipe.com/recipe/c2a24986-7cc6-4fc1-a2b0-8014989acc63?utm_source=mrecipes', video: 'https://www.facebook.com/share/r/1EoPwGnQFn/?mibextid=wwXIfr' },
      { title: 'Creamy garlic chicken', cuisine: 'Italian', image: 'https://img.cliprecipe.com/images/628416974_18096966784933444_6212405180105697792_n.jpg', recipe: 'https://www.cliprecipe.com/recipe/a58df30b-86d7-4745-910e-fbc6a37bd6fa?utm_source=mrecipes', video: 'https://www.instagram.com/reel/DUYB9epjRKj/' }
    ],
    'garlic-butter-pasta': [
      { title: 'Garlic Butter Pasta', cuisine: 'Italian', image: 'https://img.cliprecipe.com/thumbs/e63c7c24-eb09-47e7-b25b-bc18a1071f4b.jpg', recipe: 'https://www.cliprecipe.com/recipe/bb58bcc5-11c6-4b39-97f7-41bc139fdd5d?utm_source=mrecipes', video: 'https://www.facebook.com/watch?v=1259586506183820' },
      { title: 'Garlic Butter Pasta', cuisine: 'Italian', time: '20 min', image: 'https://img.cliprecipe.com/thumbnails/bxiLseXhZikvWQTwczxcwS.jpg', recipe: 'https://www.cliprecipe.com/recipe/09d3e85a-e3b8-4761-afc1-95c8bf419a85?utm_source=mrecipes', video: 'https://www.instagram.com/reel/DJ98gwmyI8g/' }
    ],
    'easy-shakshuka': [
      { title: 'Shakshuka', cuisine: 'Middle Eastern', image: 'https://img.cliprecipe.com/images/maxresdefault.jpg', recipe: 'https://www.cliprecipe.com/recipe/03702d35-b499-433a-b8e6-262c2f74ca71?utm_source=mrecipes', video: 'https://m.youtube.com/shorts/-DQIVg2aKks' },
      { title: 'Shakshuka', cuisine: 'Middle Eastern', time: '30 min', image: 'https://img.cliprecipe.com/thumbnails/X2N8BGqPdzFopHsaSBiqmo.jpg', recipe: 'https://www.cliprecipe.com/recipe/a30742a8-dfef-4b41-bd03-6cb1df13356d?utm_source=mrecipes', video: 'https://www.instagram.com/reel/DJ4azmGJRIy/' }
    ],
    'classic-pancakes': [
      { title: 'Classic American Pancakes', cuisine: 'American', image: 'https://img.cliprecipe.com/images/maxresdefault.webp', recipe: 'https://www.cliprecipe.com/recipe/13999f8e-c97f-4d02-aa9b-034a66243457?utm_source=mrecipes', video: 'https://www.youtube.com/watch?v=RTExkuPgxlI' }
    ],
    'chocolate-chip-cookies': [
      { title: 'Chocolate Chip Cookies', cuisine: 'American', image: 'https://img.cliprecipe.com/thumbs/c4735328-67cd-4ed3-89e5-5c32bb79a952.jpg', recipe: 'https://www.cliprecipe.com/recipe/85effd2f-ff0e-4ac5-976b-d2433649782d?utm_source=mrecipes', video: 'https://www.instagram.com/reel/Dcht-KwxR1o/' },
      { title: 'Chocolate Chip Cookies', cuisine: 'American', image: 'https://img.cliprecipe.com/thumbs/a423ce25-4f90-4507-ad6b-c049ebb176cc.jpg', recipe: 'https://www.cliprecipe.com/recipe/44605d4a-3dbf-4896-93ee-eb34145e1663?utm_source=mrecipes', video: 'https://www.tiktok.com/t/ZTyppB1D1/' },
      { title: 'Chocolate Chip Cookies', cuisine: 'American', time: '9 min', image: 'https://img.cliprecipe.com/images/o4MamwiIIBw1RPCfsFipSBgupxq7iCASBAQIC9tplv-tiktokx-origin.image', recipe: 'https://www.cliprecipe.com/recipe/475b90c6-f26f-48c1-aafc-be96ad7bd02a?utm_source=mrecipes', video: 'https://www.tiktok.com/t/ZP8ptoWwJ/' }
    ],
    'miso-glazed-salmon': [
      { title: 'Miso Glazed Salmon', cuisine: 'Japanese', time: '30 min', image: 'https://img.cliprecipe.com/thumbnails/8KAkA9ifpGa6QaHsq5BXy4.jpg', recipe: 'https://www.cliprecipe.com/recipe/591eca1a-1c28-4cc3-a9db-c63a7f6a63df?utm_source=mrecipes', video: 'https://www.tiktok.com/t/ZT215YRME/' }
    ],
    'beef-vegetable-stir-fry': [
      { title: 'Beef Stir Fry', cuisine: 'Chinese', image: 'https://img.cliprecipe.com/thumbnails/Wutzx7y3vTmCs8v82cJif6.jpg', recipe: 'https://www.cliprecipe.com/recipe/a27d7bdc-7fe0-4508-9230-c766b8c095f2?utm_source=mrecipes', video: 'https://pin.it/51nM3A8jG' }
    ],
    'chicken-fried-rice': [
      { title: 'Chicken Fried Rice', cuisine: 'Chinese', image: 'https://img.cliprecipe.com/thumbs/4d4db6f2-d538-464a-b53e-ffc0faae4f6e.jpg', recipe: 'https://www.cliprecipe.com/recipe/1110a540-5576-4372-9878-9dc004f8fcd3?utm_source=mrecipes', video: 'https://www.youtube.com/watch?v=0Ec1H-7mgZw' }
    ],
    'easy-chickpea-curry': [
      { title: 'Chickpea Curry', cuisine: 'Indian', time: '30 min', image: 'https://img.cliprecipe.com/thumbnails/mjVEGmUs8H4hj88z2fyvgr.jpg', recipe: 'https://www.cliprecipe.com/recipe/f5c51ed8-c7b8-46ca-927e-84e972980760?utm_source=mrecipes', video: 'https://vm.tiktok.com/ZNRJBdUru/' }
    ],
    'ground-beef-tacos': [
      { title: 'Crispy Ground Beef Tacos', cuisine: 'Mexican', image: 'https://img.cliprecipe.com/thumbnails/WgiRzhxxEsEhryZcY6zSxZ.jpg', recipe: 'https://www.cliprecipe.com/recipe/a130a48d-35ad-4b79-8d3f-35c38ffbb293?utm_source=mrecipes', video: 'https://pin.it/5FYF4pBSa' }
    ]
  };

  const slug = decodeURIComponent(window.location.pathname.split('/').pop() || '').replace(/\.html$/i, '').toLowerCase();
  const matchedVideos = videos[slug];
  if (!matchedVideos || !matchedVideos.length) return;

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

  matchedVideos.forEach(item => {
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
