(function () {
  var STORAGE_LANG = "lang";
  var STORAGE_THEME = "theme";

  function getLang() {
    return localStorage.getItem(STORAGE_LANG) === "en" ? "en" : "zh";
  }

  function isDark() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  function syncThemeButton() {
    var lang = getLang();
    var dict = window.I18N && window.I18N[lang];
    var btn = document.getElementById("theme-toggle");
    if (!btn || !dict) return;
    btn.textContent = isDark() ? dict["toolbar.theme_to_light"] : dict["toolbar.theme_to_dark"];
    btn.setAttribute("aria-pressed", isDark() ? "true" : "false");
  }

  function applyLang(lang) {
    var dict = window.I18N && window.I18N[lang];
    if (!dict) return;

    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
    var titleEl = document.querySelector("title");
    if (dict["meta.title"] && titleEl) titleEl.textContent = dict["meta.title"];

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (dict[key] != null) el.textContent = dict[key];
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-html");
      if (dict[key] != null) el.innerHTML = dict[key];
    });

    var av = document.querySelector(".profile-avatar");
    if (av && dict["profile.name"]) av.setAttribute("alt", dict["profile.name"]);

    var langBtn = document.getElementById("lang-toggle");
    if (langBtn && dict["toolbar.lang_switch"]) langBtn.textContent = dict["toolbar.lang_switch"];

    syncThemeButton();
  }

  function injectPlausible() {
    var domain = document.body && document.body.getAttribute("data-plausible-domain");
    if (!domain || !String(domain).trim()) return;
    if (document.querySelector('script[data-domain="' + String(domain).trim() + '"]')) return;
    var s = document.createElement("script");
    s.defer = true;
    s.setAttribute("data-domain", String(domain).trim());
    s.src = "https://plausible.io/js/script.js";
    document.head.appendChild(s);
  }

  function init() {
    var y = document.getElementById("year");
    if (y) y.textContent = String(new Date().getFullYear());

    applyLang(getLang());

    var themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", function () {
        if (isDark()) {
          document.documentElement.removeAttribute("data-theme");
          localStorage.setItem(STORAGE_THEME, "light");
        } else {
          document.documentElement.setAttribute("data-theme", "dark");
          localStorage.setItem(STORAGE_THEME, "dark");
        }
        syncThemeButton();
      });
    }

    var langBtn = document.getElementById("lang-toggle");
    if (langBtn) {
      langBtn.addEventListener("click", function () {
        var next = getLang() === "zh" ? "en" : "zh";
        localStorage.setItem(STORAGE_LANG, next);
        applyLang(next);
      });
    }

    injectPlausible();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
