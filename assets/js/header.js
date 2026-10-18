/* Compatibility entry point. The shared header is maintained in components/header.js. */
(() => {
  "use strict";
  const root = document.querySelector("[data-site-header]");
  if (!root || root.dataset.initialized || root.dataset.headerLoaderStarted) return;
  root.dataset.headerLoaderStarted = "true";
  const script = document.createElement("script");
  script.src = "/assets/js/components/header.js";
  script.async = false;
  document.head.appendChild(script);

  // Apply the same featured image convention to every localized recipe page.
  const imageScript = document.createElement("script");
  imageScript.src = "/assets/js/article-images.js";
  imageScript.defer = true;
  document.head.appendChild(imageScript);
})();
