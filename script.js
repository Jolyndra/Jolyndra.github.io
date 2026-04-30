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

  function getThemeChoiceValue() {
    var p = document.documentElement.getAttribute("data-palette");
    if (p === "sakura" || p === "midnight" || p === "amber") return p;
    if (document.documentElement.getAttribute("data-theme") === "dark") return "dark";
    return "light";
  }

  function applyThemeChoice(val) {
    var root = document.documentElement;
    if (val === "sakura" || val === "midnight" || val === "amber") {
      root.setAttribute("data-palette", val);
      root.removeAttribute("data-theme");
    } else if (val === "dark") {
      root.setAttribute("data-theme", "dark");
      root.removeAttribute("data-palette");
    } else {
      root.removeAttribute("data-theme");
      root.removeAttribute("data-palette");
    }
    localStorage.setItem(STORAGE_THEME, val);
    syncThemeColorMeta();
  }

  function syncThemeColorMeta() {
    var meta = document.getElementById("meta-theme-color");
    if (!meta) return;
    var raw = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    if (raw) {
      meta.setAttribute("content", raw);
      return;
    }
    var bc = getComputedStyle(document.body).backgroundColor;
    if (bc && bc !== "rgba(0, 0, 0, 0)" && bc !== "transparent") {
      meta.setAttribute("content", bc);
    }
  }

  function getSiteBase() {
    var b = document.body && document.body.getAttribute("data-site-base");
    return String(b || "https://jolyndra.github.io").replace(/\/$/, "");
  }

  function toAbsAsset(path) {
    return getSiteBase() + "/" + String(path).replace(/^\//, "");
  }

  function updateSocialMeta(dict, lang) {
    var desc = dict["meta.description"];
    if (desc) {
      var md = document.getElementById("meta-description");
      if (md) md.setAttribute("content", desc);
      var ogd = document.getElementById("meta-og-description");
      if (ogd) ogd.setAttribute("content", desc);
      var twd = document.getElementById("meta-twitter-description");
      if (twd) twd.setAttribute("content", desc);
    }
    var mt = dict["meta.title"] || "jolyndra";
    var name = dict["profile.name"] || "";
    var socialTitle = name ? mt + " · " + name : mt;
    var ogt = document.getElementById("meta-og-title");
    if (ogt) ogt.setAttribute("content", socialTitle);
    var twtitle = document.getElementById("meta-twitter-title");
    if (twtitle) twtitle.setAttribute("content", socialTitle);

    var base = getSiteBase();
    var canon = document.getElementById("link-canonical");
    if (canon) canon.setAttribute("href", base + "/");
    var ogUrl = document.getElementById("meta-og-url");
    if (ogUrl) ogUrl.setAttribute("content", base + "/");
    var imgUrl = toAbsAsset("avatar.jpg");
    var ogi = document.getElementById("meta-og-image");
    if (ogi) ogi.setAttribute("content", imgUrl);
    var twi = document.getElementById("meta-twitter-image");
    if (twi) twi.setAttribute("content", imgUrl);

    var locEl = document.getElementById("meta-og-locale");
    if (locEl) locEl.setAttribute("content", lang === "en" ? "en_US" : "zh_CN");
  }

  function initBackToTop() {
    var btn = document.getElementById("back-to-top");
    if (!btn) return;

    function syncVisibility() {
      var show = window.scrollY > 360;
      btn.hidden = !show;
      btn.classList.toggle("is-visible", show);
    }

    btn.addEventListener("click", function () {
      var reduce = false;
      try {
        reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      } catch (e) {}
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });

    window.addEventListener("scroll", syncVisibility, { passive: true });
    syncVisibility();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function wrapSkillPills() {
    document.querySelectorAll(".skill-items").forEach(function (el) {
      var text = el.textContent.trim();
      if (!text) return;
      var parts = text.split(/(?:,|，|、)\s*/).map(function (s) {
        return s.trim();
      }).filter(Boolean);
      if (!parts.length) return;
      el.innerHTML = parts
        .map(function (p) {
          return '<span class="skill-pill">' + escapeHtml(p) + "</span>";
        })
        .join("");
    });
  }

  function initNavScrollSpy() {
    var nav = document.querySelector(".quick-nav");
    if (!nav) return;
    var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
    var sections = links
      .map(function (a) {
        var id = (a.getAttribute("href") || "").replace(/^#/, "");
        return id ? document.getElementById(id) : null;
      })
      .filter(Boolean);

    if (!sections.length) return;

    function update() {
      var navOffset = 88;
      var y = window.scrollY + navOffset;
      var currentId = "";
      for (var i = sections.length - 1; i >= 0; i--) {
        var sec = sections[i];
        if (sec.offsetTop <= y) {
          currentId = sec.id;
          break;
        }
      }
      links.forEach(function (a) {
        var href = a.getAttribute("href") || "";
        a.classList.toggle("is-active", href === "#" + currentId);
      });
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  function syncThemeSelect() {
    var dict = getDict();
    var sel = document.getElementById("theme-select");
    if (!sel) return;
    sel.value = getThemeChoiceValue();
    if (dict["toolbar.theme_label"]) sel.setAttribute("aria-label", dict["toolbar.theme_label"]);
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
    updateSocialMeta(dict, lang);

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

    var btt = document.getElementById("back-to-top");
    if (btt && dict["a11y.back_to_top"]) btt.setAttribute("aria-label", dict["a11y.back_to_top"]);

    syncThemeSelect();
    wrapSkillPills();
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

  function copyPageUrlWithFeedback(feedbackEl) {
    var url = getSiteBase() + "/";
    var dict = getDict();
    function flash(ok) {
      if (!feedbackEl) return;
      if (ok && dict["share.copied"]) {
        feedbackEl.textContent = dict["share.copied"];
        feedbackEl.hidden = false;
        window.setTimeout(function () {
          feedbackEl.hidden = true;
        }, 2200);
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { flash(true); }).catch(function () { flash(false); });
      return;
    }
    try {
      var ta = document.createElement("textarea");
      ta.value = url;
      ta.setAttribute("aria-hidden", "true");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      flash(true);
    } catch (e) {
      flash(false);
    }
  }

  function loadQRCodeModule() {
    if (window.__shareQrModP) return window.__shareQrModP;
    window.__shareQrModP = import("https://esm.sh/qrcode@1.5.3")
      .then(function (m) {
        return m.default || m;
      })
      .catch(function () {
        return import("https://cdn.jsdelivr.net/npm/qrcode@1.5.3/+esm").then(function (m2) {
          return m2.default || m2;
        });
      });
    return window.__shareQrModP;
  }

  function renderQrCanvas(pageUrl, size) {
    return loadQRCodeModule().then(function (mod) {
      var QRCode = mod;
      if (QRCode && typeof QRCode.toCanvas !== "function" && QRCode.default) {
        QRCode = QRCode.default;
      }
      var c = document.createElement("canvas");
      var opts = { width: size, margin: 2, color: { dark: "#0f172a", light: "#ffffff" } };
      return new Promise(function (resolve, reject) {
        try {
          if (!QRCode || typeof QRCode.toCanvas !== "function") {
            reject(new Error("no toCanvas"));
            return;
          }
          QRCode.toCanvas(c, pageUrl, opts, function (err) {
            if (err) reject(err);
            else resolve(c);
          });
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  function pathRoundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    if (typeof ctx.roundRect === "function") {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      return;
    }
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function wrapLinesCanvas(ctx, text, maxW, maxLines) {
    text = String(text || "").replace(/\s+/g, " ").trim();
    var lines = [];
    var i = 0;
    while (i < text.length && lines.length < maxLines) {
      var end = i + 1;
      while (end <= text.length && ctx.measureText(text.slice(i, end)).width <= maxW) end += 1;
      end -= 1;
      if (end <= i) end = i + 1;
      lines.push(text.slice(i, end));
      i = end;
      while (text[i] === " ") i += 1;
    }
    if (i < text.length && lines.length >= maxLines) {
      var L = lines[maxLines - 1];
      lines[maxLines - 1] = L.length > 2 ? L.slice(0, -2) + "…" : L + "…";
    }
    return lines;
  }

  function truncateCanvasLine(ctx, text, maxW) {
    text = String(text || "");
    if (ctx.measureText(text).width <= maxW) return text;
    var t = text;
    while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
    return t + "…";
  }

  function generateShareCardImage() {
    var dict = getDict();
    var pageUrl = getSiteBase() + "/";
    var W = 900;
    var H = 520;
    var P = 48;
    var leftColInnerW = 500;
    var splitX = P + leftColInnerW + 20;
    var avatarS = 112;
    var qrS = 196;

    function ensureFontsLoaded() {
      if (!document.fonts || !document.fonts.ready) return Promise.resolve();
      return document.fonts.ready.then(function () {
        return document.fonts.load('600 28px "Noto Serif SC", serif').catch(function () {});
      });
    }

    function loadAvatarImg() {
      return new Promise(function (resolve, reject) {
        var img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function () {
          resolve(img);
        };
        img.onerror = function () {
          reject(new Error("avatar"));
        };
        img.src = new URL("./avatar.jpg", window.location.href).href;
      });
    }

    var canvas = document.getElementById("share-image-canvas");
    if (!canvas) return Promise.reject(new Error("no canvas"));
    var ctx = canvas.getContext("2d");
    if (!ctx) return Promise.reject(new Error("no ctx"));
    canvas.width = W;
    canvas.height = H;

    return Promise.all([ensureFontsLoaded(), loadAvatarImg(), renderQrCanvas(pageUrl, qrS)])
      .then(function (parts) {
        var avatarImg = parts[1];
        var qrCanvas = parts[2];

        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 2;
        pathRoundRect(ctx, 12, 12, W - 24, H - 24, 20);
        ctx.stroke();

        /* 左栏：头像 + 文案 */
        var ax = P + 16;
        var ay = P + 20;
        ctx.save();
        pathRoundRect(ctx, ax, ay, avatarS, avatarS, 18);
        ctx.clip();
        ctx.drawImage(avatarImg, ax, ay, avatarS, avatarS);
        ctx.restore();

        var textLeft = ax;
        var textMaxW = splitX - textLeft - 20;
        var ty = ay + avatarS + 24;

        ctx.fillStyle = "#0f172a";
        ctx.font = '600 26px "Noto Serif SC", "Songti SC", Georgia, serif';
        var titleLine = truncateCanvasLine(
          ctx,
          (dict["meta.title"] || "jolyndra") + " · " + (dict["profile.name"] || ""),
          textMaxW
        );
        ctx.fillText(titleLine, textLeft, ty);
        ty += 32;

        ctx.fillStyle = "#64748b";
        ctx.font = '16px "Noto Serif SC", "Songti SC", Georgia, serif';
        ctx.fillText(truncateCanvasLine(ctx, dict["profile.school"] || "", textMaxW), textLeft, ty);
        ty += 28;

        ctx.fillStyle = "#475569";
        ctx.font = '14px "Noto Serif SC", "Songti SC", Georgia, serif';
        var descLines = wrapLinesCanvas(ctx, dict["meta.description"] || "", textMaxW, 6);
        descLines.forEach(function (line) {
          ctx.fillText(line, textLeft, ty);
          ty += 22;
        });

        ctx.fillStyle = "#94a3b8";
        ctx.font = '12px ui-monospace, Menlo, monospace';
        ctx.fillText(
          truncateCanvasLine(ctx, pageUrl.replace(/^https:\/\//, "").replace(/\/$/, ""), textMaxW),
          textLeft,
          H - P - 26
        );

        /* 分隔线 */
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(splitX, P + 28);
        ctx.lineTo(splitX, H - P - 28);
        ctx.stroke();

        /* 右栏：主页二维码（垂直居中） */
        var rightInnerW = W - splitX - P;
        var qrX = splitX + (rightInnerW - qrS) / 2;
        var qrY = (H - qrS - 42) / 2;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(qrX - 10, qrY - 10, qrS + 20, qrS + 20);
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1;
        ctx.strokeRect(qrX - 10, qrY - 10, qrS + 20, qrS + 20);
        ctx.drawImage(qrCanvas, qrX, qrY, qrS, qrS);

        ctx.fillStyle = "#64748b";
        ctx.font = '13px "Noto Serif SC", "Songti SC", serif';
        var cap = dict["share.qr_caption"] || "";
        var cw = ctx.measureText(cap).width;
        ctx.fillText(cap, qrX + (qrS - cw) / 2, qrY + qrS + 22);

        return canvas;
      });
  }

  function initShareImageGen() {
    var openBtn = document.getElementById("share-open");
    var dlg = document.getElementById("share-image-dialog");
    var loading = document.getElementById("share-image-loading");
    var preview = document.getElementById("share-image-preview");
    var errEl = document.getElementById("share-image-error");
    var closeBtn = document.getElementById("share-image-close");
    var actions = document.getElementById("share-image-actions");
    var saveBtn = document.getElementById("share-image-save");
    var copyBtn = document.getElementById("share-image-copy-link");
    var copyFb = document.getElementById("share-image-copy-feedback");
    if (!openBtn || !dlg) return;

    var canUseNativeDialog = typeof dlg.showModal === "function";
    function openDialog() {
      if (canUseNativeDialog) dlg.showModal();
      else dlg.setAttribute("open", "");
    }
    function closeDialog() {
      if (canUseNativeDialog && typeof dlg.close === "function") dlg.close();
      else dlg.removeAttribute("open");
    }

    function resetUi() {
      dlg.removeAttribute("data-share-ready");
      errEl.hidden = true;
      preview.hidden = true;
      preview.removeAttribute("src");
      loading.hidden = false;
      if (actions) actions.hidden = false;
      if (saveBtn) saveBtn.disabled = true;
      if (copyFb) copyFb.hidden = true;
    }

    openBtn.addEventListener("click", function () {
      openDialog();
      resetUi();
      generateShareCardImage()
        .then(function () {
          var canvas = document.getElementById("share-image-canvas");
          if (!canvas) return;
          preview.src = canvas.toDataURL("image/png");
          loading.hidden = true;
          preview.hidden = false;
          dlg.setAttribute("data-share-ready", "1");
          if (actions) actions.hidden = false;
          if (saveBtn) saveBtn.disabled = false;
        })
        .catch(function () {
          dlg.removeAttribute("data-share-ready");
          loading.hidden = true;
          errEl.textContent = getDict()["share.err_generate"] || "";
          errEl.hidden = false;
          if (actions) actions.hidden = true;
          if (actions) actions.hidden = false;
          if (saveBtn) saveBtn.disabled = true;
        });
    });

    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        if (dlg.getAttribute("data-share-ready") !== "1") return;
        var canvas = document.getElementById("share-image-canvas");
        if (!canvas) return;
        canvas.toBlob(function (blob) {
          if (!blob) return;
          var url = URL.createObjectURL(blob);
          var a = document.createElement("a");
          a.href = url;
          a.download = "jolyndra-share.png";
          a.rel = "noopener";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, "image/png");
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        copyPageUrlWithFeedback(copyFb);
      });
    }

    if (closeBtn) closeBtn.addEventListener("click", function () { closeDialog(); });
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg) closeDialog();
    });
  }

  function initWeChatDialog() {
    var openBtn = document.getElementById("wechat-open");
    var dlg = document.getElementById("wechat-dialog");
    var closeBtn = document.getElementById("wechat-dialog-close");
    if (!openBtn || !dlg) return;
    var canUseNativeDialog = typeof dlg.showModal === "function";
    function openDialog() {
      if (canUseNativeDialog) dlg.showModal();
      else dlg.setAttribute("open", "");
    }
    function closeDialog() {
      if (canUseNativeDialog && typeof dlg.close === "function") dlg.close();
      else dlg.removeAttribute("open");
    }

    openBtn.addEventListener("click", function () {
      openDialog();
    });
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        closeDialog();
      });
    }
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg) closeDialog();
    });
  }

  function initEasterEggRedirect() {
    var targetUrl = "https://www.jolyndra.top/";
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

    var themeSel = document.getElementById("theme-select");
    if (themeSel) {
      themeSel.addEventListener("change", function () {
        applyThemeChoice(themeSel.value);
      });
    }
    syncThemeColorMeta();

    var langBtn = document.getElementById("lang-toggle");
    if (langBtn) {
      langBtn.addEventListener("click", function () {
        var next = getLang() === "zh" ? "en" : "zh";
        localStorage.setItem(STORAGE_LANG, next);
        applyLang(next);
      });
    }

    injectPlausible();
    initShareImageGen();
    initWeChatDialog();
    initEasterEggRedirect();
    initBackToTop();
    initNavScrollSpy();
    setInterval(refreshSiteStats, 1000);
    setInterval(refreshVoyagerStat, 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
