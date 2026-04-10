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
    refreshSiteStats();
  }

  /** 访问计数状态：由 CountAPI 异步写入 */
  var visitPvState = { status: "idle", value: null };

  function parseLaunchMs(launchStr) {
    if (!launchStr || !String(launchStr).trim()) return NaN;
    var s = String(launchStr).trim();
    // 完整 ISO 时间，如 2026-04-11T00:00:00+08:00
    if (/T/.test(s)) return new Date(s).getTime();
    // 仅日期 YYYY-MM-DD，按本地 0 点
    return new Date(s + "T00:00:00").getTime();
  }

  function formatUptime(launchMs, lang) {
    var diff = Math.max(0, Date.now() - launchMs);
    var days = Math.floor(diff / 86400000);
    var hours = Math.floor((diff % 86400000) / 3600000);
    var mins = Math.floor((diff % 3600000) / 60000);
    var secs = Math.floor((diff % 60000) / 1000);
    if (lang === "en") {
      return days + "d " + hours + "h " + mins + "m " + secs + "s";
    }
    return days + " 天 " + hours + " 小时 " + mins + " 分 " + secs + " 秒";
  }

  function refreshSiteStats() {
    var lang = getLang();
    var dict = window.I18N && window.I18N[lang];
    var uptimeEl = document.getElementById("stat-uptime");
    var visitEl = document.getElementById("stat-visits");
    var launchStr = document.body && document.body.getAttribute("data-site-launch");

    if (uptimeEl && launchStr) {
      var ms = parseLaunchMs(launchStr);
      uptimeEl.textContent = !isNaN(ms) ? formatUptime(ms, lang) : "—";
    } else if (uptimeEl) {
      uptimeEl.textContent = "—";
    }

    if (!visitEl || !dict) return;
    if (visitPvState.status === "na") {
      visitEl.textContent = dict["stats.visits_na"] || "—";
    } else if (visitPvState.status === "ok" && visitPvState.value != null) {
      visitEl.textContent = String(visitPvState.value);
    } else if (visitPvState.status === "err") {
      visitEl.textContent = dict["stats.visits_err"] || "—";
    } else {
      visitEl.textContent = (dict["stats.loading"] || "") + "…";
    }
  }

  function fetchVisitCountOnce() {
    var ns = document.body && document.body.getAttribute("data-count-namespace");
    var key = (document.body && document.body.getAttribute("data-count-key")) || "pv";
    if (!ns || !String(ns).trim()) {
      visitPvState = { status: "na", value: null };
      refreshSiteStats();
      return;
    }
    visitPvState = { status: "loading", value: null };
    refreshSiteStats();
    var url =
      "https://api.countapi.xyz/hit/" +
      encodeURIComponent(String(ns).trim()) +
      "/" +
      encodeURIComponent(String(key).trim());
    fetch(url)
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (data && data.value != null) {
          visitPvState = { status: "ok", value: data.value };
        } else {
          visitPvState = { status: "err", value: null };
        }
        refreshSiteStats();
      })
      .catch(function () {
        visitPvState = { status: "err", value: null };
        refreshSiteStats();
      });
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
    fetchVisitCountOnce();
    setInterval(function () {
      refreshSiteStats();
    }, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
