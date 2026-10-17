(() => {
  "use strict";
  const root = document.querySelector("[data-site-footer]");
  if (!root || root.dataset.initialized) return;
  root.dataset.initialized = "true";
  root.innerHTML = `
    <footer class="site-footer" aria-label="Site footer">
      <div class="footer-grid">
        <div class="footer-brand">
          <a class="brand brand-footer" href="/" aria-label="MRecipes home">
            <span class="brand-mark" aria-hidden="true">M</span>
            <span>MRecipes<span class="brand-dot">.</span></span>
          </a>
          <p>Reliable recipes, everyday inspiration, and delicious ideas for your table.</p>
        </div>
        <div class="footer-links">
          <h2>Explore</h2>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/recipes.html">All recipes</a></li>
            <li><a href="/pages/about.html">About us</a></li>
            <li><a href="/pages/contact.html">Contact</a></li>
          </ul>
        </div>
        <div class="footer-links">
          <h2>Information</h2>
          <ul>
            <li><a href="/pages/privacy-policy.html">Privacy policy</a></li>
            <li><a href="/pages/terms.html">Terms of use</a></li>
            <li><a href="/pages/disclaimer.html">Disclaimer</a></li>
            <li><button class="cookie-preferences-link" type="button" data-open-cookie-preferences>Cookie preferences</button></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© <span data-current-year></span> MRecipes. All rights reserved.</span>
        <span>Content crafted and managed by <strong>Imad Limrani</strong>.</span>
      </div>
    </footer>`;
  root.querySelector("[data-current-year]").textContent = new Date().getFullYear();

  // Consent is stored locally; optional tracking is not loaded by this banner.
  const lang = document.documentElement.lang.toLowerCase().startsWith("ar") ? "ar" : "en";
  const copy = lang === "ar" ? {
    title: "نستخدم ملفات تعريف الارتباط",
    body: "نستخدم التخزين الضروري لتشغيل الموقع وحفظ تفضيلاتك. لن يتم تفعيل أي ملفات اختيارية من خلال هذا الشريط دون موافقتك.",
    accept: "قبول الكل", reject: "رفض الاختيارية", customize: "إدارة التفضيلات",
    save: "حفظ اختياراتي", back: "رجوع", essential: "ضرورية", essentialDesc: "مطلوبة لتشغيل الموقع وحفظ اختيار الموافقة.",
    analytics: "التحليلات", analyticsDesc: "السماح بملفات تساعد على فهم استخدام الموقع.", marketing: "التسويق", marketingDesc: "السماح بملفات للتخصيص والإعلانات.",
    close: "إغلاق تفضيلات ملفات تعريف الارتباط", reopen: "تفضيلات ملفات تعريف الارتباط"
  } : {
    title: "We value your privacy",
    body: "We use essential storage to run this site and remember your choice. Optional cookies will not be enabled by this banner without your consent.",
    accept: "Accept all", reject: "Reject optional", customize: "Manage preferences",
    save: "Save my choices", back: "Back", essential: "Essential", essentialDesc: "Required for site functionality and storing your consent choice.",
    analytics: "Analytics", analyticsDesc: "Allow cookies that help us understand site usage.", marketing: "Marketing", marketingDesc: "Allow cookies for personalization and advertising.",
    close: "Close cookie preferences", reopen: "Cookie preferences"
  };
  const key = "mrecipes-cookie-consent";
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(key) || "null"); } catch (_) {}
  const banner = document.createElement("section");
  banner.className = "cookie-consent";
  banner.hidden = !!(saved && saved.version === 1);
  banner.setAttribute("aria-label", copy.title);
  banner.innerHTML = `
    <div class="cookie-consent__copy"><h2>${copy.title}</h2><p>${copy.body} <a href="/pages/privacy-policy.html">${lang === "ar" ? "سياسة الخصوصية" : "Privacy policy"}</a></p></div>
    <div class="cookie-consent__actions">
      <button type="button" class="button cookie-consent__accept" data-cookie-accept>${copy.accept}</button>
      <button type="button" class="cookie-consent__reject" data-cookie-reject>${copy.reject}</button>
      <button type="button" class="cookie-consent__customize" data-cookie-customize>${copy.customize}</button>
    </div>
    <div class="cookie-consent__preferences" data-cookie-panel hidden>
      <h3>${copy.customize}</h3>
      <label class="cookie-choice"><input type="checkbox" checked disabled><span><strong>${copy.essential}</strong><small>${copy.essentialDesc}</small></span></label>
      <label class="cookie-choice"><input type="checkbox" data-cookie-analytics><span><strong>${copy.analytics}</strong><small>${copy.analyticsDesc}</small></span></label>
      <label class="cookie-choice"><input type="checkbox" data-cookie-marketing><span><strong>${copy.marketing}</strong><small>${copy.marketingDesc}</small></span></label>
      <div class="cookie-consent__actions"><button type="button" class="button cookie-consent__accept" data-cookie-save>${copy.save}</button><button type="button" class="cookie-consent__reject" data-cookie-back>${copy.back}</button></div>
    </div>`;
  document.body.appendChild(banner);
  const panel = banner.querySelector("[data-cookie-panel]");
  const openPreferences = () => {
    banner.hidden = false; panel.hidden = false;
    banner.querySelector("[data-cookie-analytics]").checked = !!(saved && saved.analytics);
    banner.querySelector("[data-cookie-marketing]").checked = !!(saved && saved.marketing);
    banner.querySelector("[data-cookie-customize]").hidden = true;
    banner.querySelector("[data-cookie-accept]").hidden = true;
    banner.querySelector("[data-cookie-reject]").hidden = true;
    banner.querySelector("[data-cookie-analytics]").focus();
  };
  const closePreferences = () => {
    panel.hidden = true;
    banner.querySelector("[data-cookie-customize]").hidden = false;
    banner.querySelector("[data-cookie-accept]").hidden = false;
    banner.querySelector("[data-cookie-reject]").hidden = false;
  };
  const saveConsent = (analytics, marketing) => {
    saved = { version: 1, essential: true, analytics: !!analytics, marketing: !!marketing, updatedAt: new Date().toISOString() };
    try { localStorage.setItem(key, JSON.stringify(saved)); } catch (_) {}
    banner.hidden = true;
    closePreferences();
    window.dispatchEvent(new CustomEvent("mrecipes:consent-updated", { detail: { ...saved } }));
  };
  banner.querySelector("[data-cookie-accept]").addEventListener("click", () => saveConsent(true, true));
  banner.querySelector("[data-cookie-reject]").addEventListener("click", () => saveConsent(false, false));
  banner.querySelector("[data-cookie-customize]").addEventListener("click", openPreferences);
  banner.querySelector("[data-cookie-save]").addEventListener("click", () => saveConsent(banner.querySelector("[data-cookie-analytics]").checked, banner.querySelector("[data-cookie-marketing]").checked));
  banner.querySelector("[data-cookie-back]").addEventListener("click", closePreferences);
  root.querySelector("[data-open-cookie-preferences]").addEventListener("click", openPreferences);
  window.MRecipesConsent = Object.freeze({ get: () => saved ? { ...saved } : null, openPreferences });
})();