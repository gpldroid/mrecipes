(() => {
  "use strict";

  // Public browser credentials only. Never place a Supabase secret/service_role key here.
  const SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";
  const search = new URLSearchParams(location.search).get("search")?.trim().toLowerCase();
  const input = document.querySelector("#header-search-input");
  if (input && search) input.value = search;

  // Contact form uses the configured mailto action. Do not intercept submit.
  const contactForm = document.querySelector("[data-contact-form]");
  if (contactForm) {
    const status = contactForm.querySelector("[data-contact-status]");
    contactForm.addEventListener("submit", event => {
      if (!contactForm.reportValidity()) {
        event.preventDefault();
        return;
      }
      if (status) status.textContent = "Your email app should open with the message addressed to info@larache.xyz. Please review and send it there.";
    });
  }

  // Home page pagination: exactly 6 recipes are visible initially.
  const PAGE_SIZE = 6;
  const isHomePage = ["/", "/index.html", "/ar/", "/ar/index.html"].includes(location.pathname);
  const gridState = new WeakMap();

  const getGridState = grid => {
    if (!gridState.has(grid)) {
      let button = grid.parentElement?.querySelector(":scope > .load-more-button");
      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.className = "button load-more-button";
        button.textContent = "Load more recipes";
        grid.insertAdjacentElement("afterend", button);
      }

      const initialCount = Number(grid.dataset.initialCount) || PAGE_SIZE;
      button.addEventListener("click", () => {
        const state = gridState.get(grid);
        if (!state) return;
        state.limit += PAGE_SIZE;
        updateGrid(grid);
      });

      gridState.set(grid, {
        limit: initialCount,
        pageSize: PAGE_SIZE,
        button
      });
    }
    return gridState.get(grid);
  };

  const updateGrid = grid => {
    const state = getGridState(grid);
    const cards = [...grid.querySelectorAll("[data-recipe-card]")];
    const matching = cards.filter(card => card.dataset.searchMatch !== "false");

    cards.forEach(card => {
      const index = matching.indexOf(card);
      card.hidden = index === -1 || index >= state.limit;
    });

    const shown = Math.min(state.limit, matching.length);
    state.button.hidden = matching.length <= state.limit;
    state.button.setAttribute("aria-label", `Load more recipes; showing ${shown} of ${matching.length}`);

    let status = grid.parentElement.querySelector("[data-pagination-status]");
    if (!status) {
      status = document.createElement("p");
      status.className = "pagination-status";
      status.dataset.paginationStatus = "";
      status.setAttribute("aria-live", "polite");
      grid.insertAdjacentElement("afterend", status);
    }
    status.textContent = matching.length ? `Showing ${shown} of ${matching.length} recipes` : "No recipes to show.";
    status.hidden = matching.length === 0;
  };

  const updateAllGrids = () => {
    if (isHomePage) document.querySelectorAll("[data-supabase-recipes]").forEach(updateGrid);
  };

  const applySearch = () => {
    const cards = [...document.querySelectorAll("[data-recipe-card]")];
    let count = 0;
    cards.forEach(card => {
      const matches = !search || card.textContent.toLowerCase().includes(search) || (card.dataset.tags || "").toLowerCase().includes(search);
      card.dataset.searchMatch = matches ? "true" : "false";
      if (matches) count++;
    });

    const status = document.querySelector("[data-search-status]");
    if (status && search) {
      status.textContent = count
        ? `${count} recipe${count === 1 ? "" : "s"} found for “${search}”.`
        : `No recipes found for “${search}”. Try another search.`;
    }
    updateAllGrids();
  };

  if (isHomePage) document.querySelectorAll("[data-supabase-recipes]").forEach(getGridState);
  applySearch();
  document.querySelectorAll("[data-current-year]").forEach(el => el.textContent = new Date().getFullYear());
  document.querySelectorAll("[data-scroll-top]").forEach(button => button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" })));

  // Recipe/article recommendations and category cards.
  // The previous implementation used an over-escaped pathname regex, so the
  // related section could silently fail on published /recipes/*.html pages.
  const relatedRecipes = [
    { slug: "creamy-garlic-chicken", title: "Creamy Garlic Chicken", category: "Easy dinner", description: "Tender chicken in a silky garlic cream sauce." },
    { slug: "classic-pancakes", title: "Fluffy Classic Pancakes", category: "Breakfast", description: "Golden, soft pancakes for a cozy morning." },
    { slug: "mediterranean-pasta", title: "Mediterranean Pasta", category: "Weeknight", description: "Tomatoes, olives, and herbs tossed with pasta." },
    { slug: "chocolate-chip-cookies", title: "Chocolate Chip Cookies", category: "Baking", description: "Soft centers and crisp edges with chocolate." },
    { slug: "fresh-greek-salad", title: "Fresh Greek Salad", category: "Fresh & easy", description: "Crisp vegetables, feta, olives, and lemon dressing." },
    { slug: "homemade-margherita-pizza", title: "Homemade Margherita Pizza", category: "Family favorite", description: "Tomato, mozzarella, basil, and a crisp crust." },
    { slug: "one-pot-chicken-orzo", title: "One-Pot Chicken Orzo", category: "One-pot dinner", description: "Chicken, lemon, spinach, and orzo in savory broth." },
    { slug: "easy-chickpea-curry", title: "Easy Coconut Chickpea Curry", category: "Vegetarian", description: "A fragrant tomato and coconut curry with chickpeas." },
    { slug: "moist-banana-bread", title: "Moist Banana Bread", category: "Easy baking", description: "A tender banana loaf made with ripe bananas." },
    { slug: "lemon-garlic-shrimp-pasta", title: "Lemon Garlic Shrimp Pasta", category: "Quick seafood", description: "Shrimp, garlic, lemon, and pasta in a glossy sauce." }
  ];

  const categoryCards = [
    { name: "Easy Dinners", search: "dinner", icon: "🍽️", description: "Simple recipes for busy evenings." },
    { name: "Breakfast", search: "breakfast", icon: "🥞", description: "Comforting ideas to start the day." },
    { name: "Pasta", search: "pasta", icon: "🍝", description: "Quick, creamy and satisfying pasta." },
    { name: "Chicken", search: "chicken", icon: "🍗", description: "Reliable chicken recipes for every table." },
    { name: "Baking", search: "baking", icon: "🧁", description: "Sweet bakes, breads and treats." },
    { name: "Fresh & Easy", search: "salad", icon: "🥗", description: "Fresh vegetables and lighter meals." }
  ];

  const getRecipeSlug = () => {
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts.length === 2 && parts[0] === "recipes" && parts[1].endsWith(".html")) {
      return decodeURIComponent(parts[1].slice(0, -5));
    }
    return null;
  };

  const injectArticleStyles = () => {
    if (document.getElementById("mrecipes-recommendation-styles")) return;
    const style = document.createElement("style");
    style.id = "mrecipes-recommendation-styles";
    style.textContent = `
      .related-posts,.recipe-categories{width:min(1160px,calc(100% - 2.5rem));margin:0 auto;padding:0 0 4.5rem}
      .related-posts__heading,.recipe-categories__heading{margin-bottom:1.5rem}
      .related-posts__heading h2,.recipe-categories__heading h2{margin:.45rem 0 .35rem}
      .related-posts__heading p,.recipe-categories__heading p{margin:0;color:var(--muted)}
      .related-posts__grid,.recipe-categories__grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.5rem}
      .related-post-card{height:100%}
      .category-card{display:flex;flex-direction:column;gap:.55rem;min-height:170px;padding:1.35rem;border:1px solid var(--line);border-radius:var(--radius);background:var(--surface);box-shadow:0 3px 14px rgba(48,37,69,.025);text-decoration:none;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
      .category-card:hover{transform:translateY(-3px);box-shadow:var(--shadow);border-color:var(--green)}
      .category-card__icon{font-size:2rem;line-height:1}
      .category-card h3{margin:.1rem 0 0;color:var(--ink)}
      .category-card p{margin:0;color:var(--muted);font-size:.9rem;line-height:1.6}
      .load-more-button{display:flex;margin:1.75rem auto 0;min-width:190px}
      .pagination-status{margin:.85rem 0 0;text-align:center;color:var(--muted);font-size:.875rem}
      @media (max-width:760px){
        .related-posts,.recipe-categories{width:min(100% - 1.5rem,1160px);padding-bottom:3rem}
        .related-posts__grid,.recipe-categories__grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}
      }
      @media (max-width:480px){
        .related-posts__grid,.recipe-categories__grid{grid-template-columns:1fr}
      }
    `;
    document.head.appendChild(style);
  };

  const createRelatedSection = (articleMain, currentSlug) => {
    const section = document.createElement("section");
    section.className = "related-posts";
    section.setAttribute("aria-labelledby", "related-posts-title");

    const heading = document.createElement("div");
    heading.className = "related-posts__heading";
    heading.innerHTML = '<span class="eyebrow">Keep exploring</span><h2 id="related-posts-title">Maybe you like</h2><p>More recipes you might enjoy.</p>';

    const grid = document.createElement("div");
    grid.className = "related-posts__grid";

    relatedRecipes.filter(recipe => recipe.slug !== currentSlug).slice(0, 6).forEach(recipe => {
      const card = document.createElement("article");
      card.className = "recipe-card related-post-card";

      const link = document.createElement("a");
      link.className = "recipe-image";
      link.href = `/recipes/${recipe.slug}.html`;
      link.setAttribute("aria-label", recipe.title);

      const img = document.createElement("img");
      img.src = `/assets/images/recipes/${recipe.slug}.svg`;
      img.alt = recipe.title;
      img.loading = "lazy";
      img.decoding = "async";
      img.onerror = () => { img.remove(); link.textContent = "🍽️"; };
      link.appendChild(img);

      const content = document.createElement("div");
      content.className = "recipe-content";
      const meta = document.createElement("div");
      meta.className = "recipe-meta";
      const category = document.createElement("span");
      category.textContent = recipe.category;
      meta.appendChild(category);
      const h3 = document.createElement("h3");
      const titleLink = document.createElement("a");
      titleLink.href = link.href;
      titleLink.textContent = recipe.title;
      h3.appendChild(titleLink);
      const desc = document.createElement("p");
      desc.textContent = recipe.description;
      content.append(meta, h3, desc);
      card.append(link, content);
      grid.appendChild(card);
    });

    section.append(heading, grid);
    return section;
  };

  const createCategorySection = () => {
    const section = document.createElement("section");
    section.className = "recipe-categories";
    section.setAttribute("aria-labelledby", "recipe-categories-title");

    const heading = document.createElement("div");
    heading.className = "recipe-categories__heading";
    heading.innerHTML = '<span class="eyebrow">Browse by taste</span><h2 id="recipe-categories-title">Categories</h2><p>Explore recipes by the kind of meal you are craving.</p>';

    const grid = document.createElement("div");
    grid.className = "recipe-categories__grid";

    categoryCards.forEach(category => {
      const card = document.createElement("a");
      card.className = "category-card";
      card.href = `/recipes.html?search=${encodeURIComponent(category.search)}`;
      card.innerHTML = `<span class="category-card__icon" aria-hidden="true">${category.icon}</span><h3>${category.name}</h3><p>${category.description}</p>`;
      grid.appendChild(card);
    });

    section.append(heading, grid);
    return section;
  };

  const currentRecipeSlug = getRecipeSlug();
  const articleMain = document.querySelector("#main-content .content-page");
  if (currentRecipeSlug && currentRecipeSlug !== "recipe-template" && articleMain) {
    injectArticleStyles();
    // Replace any old dynamically inserted sections so the result is deterministic after reloads.
    document.querySelectorAll("#main-content > .related-posts,#main-content > .recipe-categories").forEach(el => el.remove());
    articleMain.insertAdjacentElement("afterend", createRelatedSection(articleMain, currentRecipeSlug));
    document.querySelector("#main-content > .related-posts").insertAdjacentElement("afterend", createCategorySection());
  }

  const configured = /^https:\/\/[^/]+\.supabase\.co$/.test(SUPABASE_URL)
    && !SUPABASE_URL.includes("YOUR_PROJECT_REF")
    && SUPABASE_PUBLISHABLE_KEY
    && !SUPABASE_PUBLISHABLE_KEY.includes("YOUR_SUPABASE");

  const loadClient = () => new Promise((resolve, reject) => {
    if (window.supabase?.createClient) return resolve(window.supabase);
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    script.async = true;
    script.onload = () => window.supabase?.createClient ? resolve(window.supabase) : reject(new Error("Supabase client unavailable"));
    script.onerror = reject;
    document.head.appendChild(script);
  });

  const str = value => String(value ?? "");

  const renderCards = (container, recipes) => {
    const fragment = document.createDocumentFragment();
    recipes.forEach(recipe => {
      const card = document.createElement("article");
      card.className = "recipe-card";
      card.dataset.recipeCard = "";
      card.dataset.tags = [recipe.title, recipe.category, recipe.excerpt].join(" ").toLowerCase();

      const imageLink = document.createElement("a");
      imageLink.className = "recipe-image";
      imageLink.href = `/recipes/${encodeURIComponent(recipe.slug)}.html`;
      imageLink.setAttribute("aria-label", str(recipe.title));
      if (recipe.image_url) {
        const img = document.createElement("img");
        img.src = recipe.image_url;
        img.alt = str(recipe.title);
        img.loading = "lazy";
        img.decoding = "async";
        imageLink.appendChild(img);
      } else {
        imageLink.textContent = "🍽️";
      }

      const content = document.createElement("div");
      content.className = "recipe-content";
      const meta = document.createElement("div");
      meta.className = "recipe-meta";
      const time = document.createElement("span");
      time.textContent = `${Number(recipe.prep_minutes || 0) + Number(recipe.cook_minutes || 0)} min`;
      const category = document.createElement("span");
      category.textContent = str(recipe.category || "Recipe");
      meta.append(time, category);
      const h3 = document.createElement("h3");
      const title = document.createElement("a");
      title.href = imageLink.href;
      title.textContent = str(recipe.title);
      h3.appendChild(title);
      const excerpt = document.createElement("p");
      excerpt.textContent = str(recipe.excerpt);
      content.append(meta, h3, excerpt);
      card.append(imageLink, content);
      fragment.appendChild(card);
    });
    container.replaceChildren(fragment);
  };

  if (!configured) {
    window.MRecipesData = Object.freeze({ enabled: false, reason: "Configure the Supabase URL and publishable key in assets/js/main.js." });
    return;
  }

  loadClient().then(library => {
    const client = library.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    window.MRecipesData = Object.freeze({
      enabled: true,
      async getPublishedRecipes() {
        const { data, error } = await client.from("recipes").select("slug,title,excerpt,category,image_url,prep_minutes,cook_minutes,published_at").eq("status", "published").order("published_at", { ascending: false }).limit(60);
        if (error) throw error;
        return data || [];
      },
      async getApprovedComments(slug) {
        const { data, error } = await client.from("recipe_comments").select("display_name,body,created_at,recipes!inner(slug)").eq("status", "approved").eq("recipes.slug", slug).order("created_at", { ascending: false });
        if (error) throw error;
        return data || [];
      },
      async submitComment({ slug, displayName, body }) {
        const name = str(displayName).trim();
        const comment = str(body).trim();
        if (name.length < 2 || name.length > 80 || comment.length < 5 || comment.length > 2000) {
          throw new Error("Name must be 2–80 characters and comment 5–2000 characters.");
        }
        const { data: recipe, error: lookupError } = await client.from("recipes").select("id").eq("slug", slug).eq("status", "published").single();
        if (lookupError) throw lookupError;
        const { error } = await client.from("recipe_comments").insert({ recipe_id: recipe.id, display_name: name, body: comment, status: "pending" });
        if (error) throw error;
      }
    });

    const container = document.querySelector("[data-supabase-recipes]");
    if (!container) return;
    window.MRecipesData.getPublishedRecipes().then(recipes => {
      if (recipes.length) {
        renderCards(container, recipes);
        applySearch();
      }
    }).catch(error => console.error("Supabase query failed; keeping static recipe cards.", error));
  }).catch(error => console.error("Supabase client failed to load; keeping static content.", error));
})();
