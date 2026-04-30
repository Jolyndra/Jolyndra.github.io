(function () {
  var STORAGE_LANG = "lang";
  var STORAGE_THEME = "theme";

  /** 旅行者1号：参考时刻与距离（km）、外推速率 km/s（与太阳径向量级一致，仅供展示） */
  var VOYAGER_REF_MS = Date.UTC(2025, 0, 1, 0, 0, 0);
  var VOYAGER_REF_KM = 24180000000;
  var VOYAGER_RATE_KMS = 17;

  function getLang() {
    return localStorage.getItem(STORAGE_LANG) === "en" ? "en" : "zh";
  }

  function getDict() {
    var lang = getLang();
    return (window.I18N && window.I18N[lang]) || {};
  }

  function isDark() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  function syncThemeButton() {
    var dict = getDict();
    var btn = document.getElementById("theme-toggle");
    if (!btn || !dict["toolbar.theme_to_light"]) return;
    btn.textContent = isDark() ? dict["toolbar.theme_to_light"] : dict["toolbar.theme_to_dark"];
    btn.setAttribute("aria-pressed", isDark() ? "true" : "false");
  }

  function parseLaunchMs(launchStr) {
    if (!launchStr || !String(launchStr).trim()) return NaN;
    var s = String(launchStr).trim();
    var t = new Date(s).getTime();
    if (!isNaN(t)) return t;
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (m) {
      return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0).getTime();
    }
    return NaN;
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

  function estimateVoyager1EarthKm() {
    var body = document.body;
    if (!body) return NaN;
    var refMs = parseFloat(body.getAttribute("data-voyager-ref-ms"));
    var refKm = parseFloat(body.getAttribute("data-voyager-ref-km"));
    var rate = parseFloat(body.getAttribute("data-voyager-rate-kms"));
    if (!isFinite(refMs)) refMs = VOYAGER_REF_MS;
    if (!isFinite(refKm)) refKm = VOYAGER_REF_KM;
    if (!isFinite(rate) || rate <= 0) rate = VOYAGER_RATE_KMS;
    return refKm + ((Date.now() - refMs) / 1000) * rate;
  }

  function formatVoyagerDistanceKm(km, lang) {
    if (!isFinite(km) || km < 0) return "—";
    var n = Math.round(km);
    var loc = lang === "en" ? "en-US" : "zh-CN";
    return n.toLocaleString(loc) + " km";
  }

  function refreshVoyagerStat() {
    var lang = getLang();
    var dict = getDict();
    var voyagerEl = document.getElementById("stat-voyager");
    if (!voyagerEl) return;
    var vkm = estimateVoyager1EarthKm();
    voyagerEl.textContent = formatVoyagerDistanceKm(vkm, lang);
    var vtitle = dict["stats.voyager_title"];
    if (vtitle) voyagerEl.setAttribute("title", vtitle);
    else voyagerEl.removeAttribute("title");
  }

  function refreshSiteStats() {
    var lang = getLang();
    var uptimeEl = document.getElementById("stat-uptime");
    var launchStr = document.body && document.body.getAttribute("data-site-launch");

    if (uptimeEl) {
      if (launchStr) {
        var ms = parseLaunchMs(launchStr);
        uptimeEl.textContent = !isNaN(ms) ? formatUptime(ms, lang) : "—";
      } else {
        uptimeEl.textContent = "—";
      }
    }
  }

  function applyLang(lang) {
    var dict = window.I18N && window.I18N[lang];
    if (!dict) {
      refreshSiteStats();
      refreshVoyagerStat();
      return;
    }

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
    refreshVoyagerStat();
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

  function initEasterEggRedirect() {
    var targetUrl = "https://travel-wallet-five.vercel.app/";
    var avatar = document.querySelector(".profile-avatar");
    if (!avatar) return;

    var clickCount = 0;
    var firstClickAt = 0;
    var burstWindowMs = 1500;
    var requiredClicks = 5;

    avatar.addEventListener("click", function () {
      var now = Date.now();
      if (now - firstClickAt > burstWindowMs) {
        firstClickAt = now;
        clickCount = 0;
      }

      clickCount += 1;
      if (clickCount >= requiredClicks) {
        window.open(targetUrl, "_blank", "noopener,noreferrer");
        clickCount = 0;
        firstClickAt = 0;
      }
    });
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
    initEasterEggRedirect();
    setInterval(refreshSiteStats, 1000);
    setInterval(refreshVoyagerStat, 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
