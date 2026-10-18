(() => {
  'use strict';
  if (window.__mrecipesAdsenseLoaded) return;
  window.__mrecipesAdsenseLoaded = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6996931662051674';
  s.crossOrigin = 'anonymous';
  document.head.appendChild(s);
})();
