/* Compatibility entry point. The shared footer is maintained in components/footer.js. */
(() => {
  "use strict";
  const root = document.querySelector("[data-site-footer]");
  if (!root || root.dataset.initialized || root.dataset.footerLoaderStarted) return;
  root.dataset.footerLoaderStarted = "true";
  const script = document.createElement("script");
  script.src = "/assets/js/components/footer.js";
  script.async = false;
  document.head.appendChild(script);
})();