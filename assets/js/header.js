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
})();