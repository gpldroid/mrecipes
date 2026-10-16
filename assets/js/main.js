(() => {
  "use strict";
  const search = new URLSearchParams(location.search).get("search")?.trim().toLowerCase();
  const input = document.querySelector('#header-search-input');
  if (input && search) input.value = search;
  const cards = [...document.querySelectorAll("[data-recipe-card]")];
  if (search && cards.length) {
    let count = 0;
    cards.forEach(card => {
      const matches = card.textContent.toLowerCase().includes(search) || (card.dataset.tags || "").toLowerCase().includes(search);
      card.hidden = !matches;
      if (matches) count++;
    });
    const status = document.querySelector("[data-search-status]");
    if (status) status.textContent = count ? `${count} recipe${count === 1 ? "" : "s"} found for “${search}”.` : `No recipes found for “${search}”. Try another search.`;
  }
  document.querySelectorAll("[data-current-year]").forEach(el => el.textContent = new Date().getFullYear());
  document.querySelectorAll("[data-scroll-top]").forEach(button => {
    button.addEventListener("click", () => window.scrollTo({top: 0, behavior: "smooth"}));
  });
})();