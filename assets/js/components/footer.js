(() => {
  "use strict";
  const root = document.querySelector("[data-site-footer]");
  if (!root || root.dataset.initialized) return;
  root.dataset.initialized = "true";
  root.innerHTML = `
    <footer class="site-footer">
      <div class="footer-grid">
        <div class="footer-brand"><a class="brand brand-footer" href="/"><span class="brand-mark" aria-hidden="true">M</span><span>MRecipes<span class="brand-dot">.</span></span></a><p>Reliable recipes, everyday inspiration, and delicious ideas for your table.</p></div>
        <div><h2>Explore</h2><ul><li><a href="/">Home</a></li><li><a href="/recipes.html">All recipes</a></li><li><a href="/pages/about.html">About us</a></li><li><a href="/pages/contact.html">Contact</a></li></ul></div>
        <div><h2>Information</h2><ul><li><a href="/pages/privacy-policy.html">Privacy policy</a></li><li><a href="/pages/terms.html">Terms of use</a></li><li><a href="/pages/disclaimer.html">Disclaimer</a></li></ul></div>
      </div>
      <div class="footer-bottom"><span>© <span data-current-year></span> MRecipes. All rights reserved.</span><span>Content crafted and managed by <strong>Imad Limrani</strong>.</span></div>
    </footer>`;
  root.querySelector("[data-current-year]").textContent = new Date().getFullYear();
})();