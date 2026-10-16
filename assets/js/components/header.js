(() => {
  "use strict";
  const links = [
    { href: "/", label: "Home" },
    { href: "/recipes.html", label: "Recipes" },
    { href: "/pages/about.html", label: "About" },
    { href: "/pages/contact.html", label: "Contact" }
  ];
  const path = location.pathname.replace(/\/index\.html$/, "/").replace(/\/$/, "") || "/";
  const active = (href) => href === "/recipes.html" && path.startsWith("/recipes/") || path === href || href === "/" && path === "/";
  const nav = links.map(({href,label}) => `<a href="${href}"${active(href) ? ' aria-current="page"' : ""}>${label}</a>`).join("");
  const root = document.querySelector("[data-site-header]");
  if (!root || root.dataset.initialized) return;
  root.dataset.initialized = "true";
  root.innerHTML = `
    <a class="skip-link" href="#main-content">Skip to content</a>
    <header class="site-header">
      <div class="header-inner">
        <a class="brand" href="/" aria-label="MRecipes home"><span class="brand-mark" aria-hidden="true">M</span><span>MRecipes<span class="brand-dot">.</span></span></a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" aria-label="Open navigation"><span></span><span></span><span></span></button>
        <nav class="primary-nav" id="primary-nav" aria-label="Main navigation">${nav}</nav>
        <form class="header-search" action="/recipes.html" role="search"><label class="visually-hidden" for="header-search-input">Search recipes</label><input id="header-search-input" name="search" type="search" placeholder="Find a recipe…" /><button type="submit" aria-label="Search recipes">⌕</button></form>
        <button class="theme-toggle" type="button" aria-label="Switch to dark mode" aria-pressed="false" title="Switch color theme"><span aria-hidden="true">☾</span></button>
      </div>
    </header>
    <nav class="mobile-tab-bar" aria-label="Mobile navigation">${links.map(({href,label}) => `<a href="${href}"${active(href) ? ' aria-current="page"' : ""}><span aria-hidden="true">${({"Home":"⌂","Recipes":"▤","About":"♡","Contact":"✉"})[label]}</span><small>${label}</small></a>`).join("")}</nav>`;
  const themeButton = root.querySelector(".theme-toggle");
  const themeIcon = themeButton.querySelector("span");
  const setTheme = (theme, persist = false) => {
    const dark = theme === "dark";
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    themeButton.setAttribute("aria-pressed", String(dark));
    themeButton.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    themeIcon.textContent = dark ? "☀" : "☾";
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => meta.setAttribute("content", dark ? "#171420" : "#fcf9ff"));
    if (persist) {
      try { localStorage.setItem("mrecipes-theme", dark ? "dark" : "light"); } catch (_) {}
    }
  };
  let initialTheme = "light";
  try {
    const storedTheme = localStorage.getItem("mrecipes-theme");
    if (storedTheme === "dark" || storedTheme === "light") initialTheme = storedTheme;
  } catch (_) {}
  setTheme(initialTheme);
  themeButton.addEventListener("click", () => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true);
  });

  const button = root.querySelector(".menu-toggle");
  const menu = root.querySelector(".primary-nav");
  const close = () => { button.setAttribute("aria-expanded","false"); button.setAttribute("aria-label","Open navigation"); menu.classList.remove("is-open"); };
  button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    menu.classList.toggle("is-open", open);
  });
  root.addEventListener("click", (event) => { if (event.target.closest(".primary-nav a")) close(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") { close(); button.focus(); } });
})();