/*
 * CPMG order forms: shared helpers — cpmg-order.js
 * v1.5 (Oct 28, 2026)
 *
 * Used by detail-order/index.html and quick-order/index.html.
 * - Word and line counting (same rules as the previews)
 * - Photo shrink: max 1600 px on the long side, JPEG quality 0.85, before sending
 * - Sending: POST to CPMG_SCRIPT_URL as text/plain JSON (no CORS preflight), reads the JSON reply
 * - Quick Order lookup: GET ?action=client&k=KEY
 * Written in plain older JavaScript (var, no arrow functions) so it runs on old Android Chrome
 * and iPhone Safari.
 *
 * REVISION LOG
 *   v1.5 (Oct 28, 2026) lookupClient: a client record marked "(retired" counts as not found, so the
 *                       phone forgets it and the form starts as a brand-new client (free first graphic).
 *   v1.4 (Oct 28, 2026) busy(): the button shows the green sending bar (fill + sweeping light,
 *                       styles in cpmg-order.css v1.1) instead of the small spinner.
 *   v1.3 (Oct 27, 2026) Prices: getPrices (asks the order system for every price, rush seats left today
 *                       and the monthly plan), graphicPrice and orderTotal (promo, Phone + Wide, first
 *                       graphic free, monthly plan $0, rush once per order). Same math as the order system.
 *   v1.2 (Oct 26, 2026) Saved info on the phone: savedKey / rememberKey / forgetKey / keyInLink, so
 *                       both forms know a returning customer. Address helpers (addrLine, stateOk,
 *                       zipOk) and typeFor (saved business type -> the forms' list wording).
 *   v1.1 (Oct 26, 2026) Phone boxes now format the number when you leave the box
 *                       (8435550100 becomes (843) 555-0100). A leading 1 is dropped.
 *   v1.0 (Oct 25, 2026) First version.
 */
var CPMG = (function () {
  'use strict';
  var MAX_SIDE = 1600, JPEG_Q = 0.85, MAX_PHOTOS = 3;
  var SEND_TIMEOUT_MS = 120000, LOOKUP_TIMEOUT_MS = 20000;

  function $(id) { return document.getElementById(id); }
  function each(list, fn) { Array.prototype.forEach.call(list || [], fn); }
  function words(s) { return String(s || '').trim().split(/\s+/).filter(Boolean).length; }
  function lines(s) { return String(s || '').split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean); }
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }
  function emailOk(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim()); }
  function fmtPhone(s) { var d = digits(s); if (d.length === 11 && d.charAt(0) === '1') d = d.slice(1); return d.length === 10 ? '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6) : String(s || '').trim(); }
  function showErr(el, msg) { if (!el) return; el.textContent = msg || ''; el.hidden = !msg; }

  /** True once the script link has been put into cpmg-order-config.js. */
  function urlReady() {
    return typeof CPMG_SCRIPT_URL === 'string' && /^https:\/\//.test(CPMG_SCRIPT_URL);
  }

  /** Lights up the chosen tap-choice box. Works where CSS :has() doesn't (older phones). */
  function syncOpts(root) {
    each((root || document).querySelectorAll('.opt'), function (o) {
      var i = o.querySelector('input');
      if (i) o.className = o.className.replace(/\s*\bon\b/g, '') + (i.checked ? ' on' : '');
    });
  }
  function watchOpts(root) {
    (root || document).addEventListener('change', function (e) {
      if (e.target && (e.target.type === 'radio' || e.target.type === 'checkbox')) syncOpts(root);
    });
    syncOpts(root);
  }

  /** Reads ?name= from the page link. */
  function param(name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(location.search);
    if (!m) return '';
    try { return decodeURIComponent(m[1].replace(/\+/g, ' ')); } catch (e) { return ''; }
  }

  /**
   * Shrinks one picked image file and returns a Promise of
   * {name, mimeType:'image/jpeg', dataBase64, url} (url is for the thumbnail).
   */
  function shrinkPhoto(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type || 'image/')) { reject(new Error('notimage')); return; }
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('read')); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('decode')); };
        img.onload = function () {
          try {
            var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
            var scale = Math.min(1, MAX_SIDE / Math.max(w, h));
            var cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
            var c = document.createElement('canvas');
            c.width = cw; c.height = ch;
            var ctx = c.getContext('2d');
            ctx.fillStyle = '#ffffff';            // logos with see-through parts get a white back, not black
            ctx.fillRect(0, 0, cw, ch);
            ctx.drawImage(img, 0, 0, cw, ch);
            var url = c.toDataURL('image/jpeg', JPEG_Q);
            var base = String(file.name || 'photo').replace(/\.[^.]*$/, '').replace(/[^\w\-]+/g, '_').slice(0, 60) || 'photo';
            resolve({ name: base + '.jpg', mimeType: 'image/jpeg', dataBase64: url.split(',')[1] || '', url: url });
          } catch (err) { reject(err); }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Wires a file picker + thumbnail row + message line.
   * Returns {list:function(){...photos}, clear:function(){}}.
   */
  function photoPicker(input, thumbs, msgEl, onChange) {
    var photos = [];
    function draw() {
      thumbs.innerHTML = '';
      photos.forEach(function (p, i) {
        var im = document.createElement('img');
        im.src = p.url; im.alt = 'Your photo ' + (i + 1);
        thumbs.appendChild(im);
      });
      thumbs.hidden = !photos.length;
      if (onChange) onChange(photos);
    }
    input.addEventListener('change', function () {
      var files = [].slice.call(input.files || []);
      if (!files.length) return;
      showErr(msgEl, '');
      var room = MAX_PHOTOS - photos.length, extra = files.length > room;
      files = files.slice(0, Math.max(0, room));
      if (!files.length) { showErr(msgEl, 'You can add up to ' + MAX_PHOTOS + ' photos. Tap "Clear photos" to pick again.'); input.value = ''; return; }
      showErr(msgEl, 'Getting your photo ready…');
      Promise.all(files.map(function (f) {
        return shrinkPhoto(f).then(function (p) { return p; }, function () { return null; });
      })).then(function (done) {
        var bad = 0;
        done.forEach(function (p) { if (p) photos.push(p); else bad++; });
        var msg = '';
        if (extra) msg = 'You can add up to ' + MAX_PHOTOS + ' photos, so we kept the first ' + photos.length + '.';
        if (bad) msg += (msg ? ' ' : '') + 'One photo could not be opened. Please try a JPG or PNG.';
        showErr(msgEl, msg);
        input.value = '';
        draw();
      });
    });
    return {
      list: function () { return photos.map(function (p) { return { name: p.name, mimeType: p.mimeType, dataBase64: p.dataBase64 }; }); },
      count: function () { return photos.length; },
      clear: function () { photos = []; draw(); }
    };
  }

  /** Low-level request. Uses fetch, or XMLHttpRequest on phones that don't have fetch. */
  function request(method, url, body, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var finished = false;
      var timer = setTimeout(function () { if (!finished) { finished = true; reject(new Error('timeout')); } }, timeoutMs);
      function ok(text) { if (finished) return; finished = true; clearTimeout(timer); resolve(text); }
      function bad(err) { if (finished) return; finished = true; clearTimeout(timer); reject(err); }
      if (window.fetch) {
        var opts = { method: method, redirect: 'follow', credentials: 'omit' };
        if (body != null) { opts.headers = { 'Content-Type': 'text/plain;charset=utf-8' }; opts.body = body; }
        window.fetch(url, opts).then(function (r) { return r.text(); }).then(ok, bad);
      } else {
        var x = new XMLHttpRequest();
        x.open(method, url, true);
        if (body != null) x.setRequestHeader('Content-Type', 'text/plain;charset=utf-8');
        x.onload = function () { ok(x.responseText); };
        x.onerror = function () { bad(new Error('network')); };
        x.send(body);
      }
    });
  }

  function parse(text) {
    try { var j = JSON.parse(text); if (j && typeof j === 'object') return j; } catch (e) { /* not JSON */ }
    return { ok: false, error: 'bad-reply' };
  }

  /** Sends the order. Resolves to the script's reply {ok, orderCode, message} or {ok:false, error}. */
  function sendOrder(payload) {
    if (!urlReady()) return Promise.resolve({ ok: false, error: 'not-set-up' });
    var body;
    try { body = JSON.stringify(payload); } catch (e) { return Promise.resolve({ ok: false, error: 'pack' }); }
    return request('POST', CPMG_SCRIPT_URL, body, SEND_TIMEOUT_MS).then(parse, function (err) {
      return { ok: false, error: err && err.message === 'timeout' ? 'timeout' : 'network' };
    });
  }

  /**
   * Quick Order: looks up a regular customer by their key.
   * Resolves to the reply {ok:true,...}, false if the script answered "no such key",
   * or null if it couldn't be reached (signal, timeout, not set up).
   */
  function lookupClient(key) {
    if (!key || !urlReady()) return Promise.resolve(null);
    var url = CPMG_SCRIPT_URL + (CPMG_SCRIPT_URL.indexOf('?') > -1 ? '&' : '?') + 'action=client&k=' + encodeURIComponent(key);
    return request('GET', url, null, LOOKUP_TIMEOUT_MS).then(function (t) {
      var j = parse(t);
      if (j && j.ok) return /\(retired/i.test(String(j.business || '')) ? false : j;   // v1.4: retired test record = start fresh
      return j && j.error && j.error !== 'bad-reply' ? false : null;
    }, function () { return null; });
  }

  /** Plain-words message for a failed send. Keeps the script's own words when it gave some. */
  function failText(reply) {
    var e = reply && reply.error ? String(reply.error) : '';
    if (e === 'not-set-up') return 'This form is not switched on yet. Please email randy.turner@cpmgdata.com and we will take your order.';
    if (e === 'timeout') return 'This is taking too long. Check your signal, then tap the button again. What you typed is still here.';
    if (e === 'network' || e === 'bad-reply' || e === 'pack' || !e) return 'We could not send your order. Check your signal, then tap the button again. What you typed is still here.';
    return e + ' What you typed is still here.';
  }

  /** Button spinner on/off. */
  function busy(btn, on, text) {
    if (on) {
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      btn.classList.add('btn-sending');
      btn.innerHTML = '<span class="sfill" aria-hidden="true"></span><span class="sshine" aria-hidden="true"></span><span class="slbl">' + esc(text || 'Sending…') + '</span>';
    } else {
      btn.disabled = false;
      btn.classList.remove('btn-sending');
      btn.removeAttribute('aria-busy');
      btn.textContent = text || 'Send';
    }
  }

  /** v1.1: format every phone box when the customer leaves it. */
  function tidyPhone(e) {
    var t = e && e.target;
    if (!t || t.tagName !== 'INPUT' || t.type !== 'tel') return;
    var f = fmtPhone(t.value);
    if (f !== t.value) t.value = f;
  }
  document.addEventListener('focusout', tidyPhone, true);
  document.addEventListener('change', tidyPhone, true);


  // ===== v1.2: saved info on this phone, address helpers =====
  var KEY_STORE = 'cpmgQuickKey';               // same name the Quick Order used in v1.0-v1.3
  /** The customer's key saved on this phone ('' if none or storage is blocked). */
  function savedKey() { try { return window.localStorage.getItem(KEY_STORE) || ''; } catch (e) { return ''; } }
  function rememberKey(k) { try { if (k) window.localStorage.setItem(KEY_STORE, k); } catch (e) { /* blocked: fine */ } }
  function forgetKey() { try { window.localStorage.removeItem(KEY_STORE); } catch (e) { /* fine */ } }
  /** Puts ?k=KEY in the page link (no reload), so "Add to Home screen" saves their own link. */
  function keyInLink(k) {
    try { window.history.replaceState(null, '', location.pathname + (k ? '?k=' + encodeURIComponent(k) : '')); } catch (e) { /* old phone */ }
  }
  /** "123 Main St, Myrtle Beach, SC 29579" from {street, city, state, zip}; blank parts left out. */
  function addrLine(a) {
    if (!a) return '';
    var sz = [String(a.state || '').trim().toUpperCase(), String(a.zip || '').trim()].filter(Boolean).join(' ');
    return [String(a.street || '').trim(), String(a.city || '').trim(), sz].filter(Boolean).join(', ');
  }
  function stateOk(s) { s = String(s || '').trim(); return !s || /^[A-Za-z]{2}$/.test(s); }
  function zipOk(s) { s = String(s || '').trim(); return !s || /^\d{5}(-\d{4})?$/.test(s); }
  /** Saved business type (a sheet tab name like "Restaurant") -> the forms' list wording. */
  var TYPE_LIST = ['Restaurant or bar', 'Real estate', 'Plumbing', 'HVAC', 'Lawn care', 'Salon or spa', 'Other'];
  function typeFor(seg) {
    var s = String(seg || '').trim().toLowerCase();
    if (!s) return '';
    var map = { 'restaurant': 'Restaurant or bar', 'real estate': 'Real estate', 'lawn care': 'Lawn care' };
    if (map[s]) return map[s];
    for (var i = 0; i < TYPE_LIST.length; i++) if (TYPE_LIST[i].toLowerCase() === s) return TYPE_LIST[i];
    return 'Other';
  }

  // ===== v1.3: prices (rush, promo, monthly plan) =====
  var PRICE_DEFAULTS = { each: 25, pair: 40, promo: 45, promoPair: 60, rush: 10, rushMax: 2, rushLeft: null, firstOff: 25, monthlyPlan: false };
  /** Asks the order system for its prices. Always resolves; uses the defaults if it can't be reached (rushLeft null = unknown). */
  function getPrices(key) {
    var out = {}, k;
    for (k in PRICE_DEFAULTS) out[k] = PRICE_DEFAULTS[k];
    if (!urlReady()) return Promise.resolve(out);
    var url = CPMG_SCRIPT_URL + (CPMG_SCRIPT_URL.indexOf('?') > -1 ? '&' : '?') + 'action=prices' + (key ? '&k=' + encodeURIComponent(key) : '');
    return request('GET', url, null, LOOKUP_TIMEOUT_MS).then(function (t) {
      var j = parse(t);
      if (j && j.ok) { for (k in PRICE_DEFAULTS) if (j[k] !== undefined && j[k] !== null) out[k] = j[k]; }
      return out;
    }, function () { return out; });
  }
  /** One graphic: Phone + Wide pair or not, promo look or not. */
  function graphicPrice(P, pair, promo) { return promo ? (pair ? P.promoPair : P.promo) : (pair ? P.pair : P.each); }
  /** list = [{pair, promo}]. Returns {graphics, off, rush, total}: first graphic free for a new customer, monthly plan $0, rush once. */
  function orderTotal(P, list, isNew, rush) {
    var g = 0;
    list.forEach(function (x) { g += P.monthlyPlan ? 0 : graphicPrice(P, x.pair, x.promo); });
    var off = isNew && !P.monthlyPlan ? Math.min(g, P.firstOff) : 0;
    var r = rush ? P.rush : 0;
    return { graphics: g, off: off, rush: r, total: g - off + r };
  }

  function hp() { var h = $('cpmgHp'); return h ? h.value : ''; }

  return {
    $: $, each: each, words: words, lines: lines, esc: esc, digits: digits, emailOk: emailOk, fmtPhone: fmtPhone,
    showErr: showErr, urlReady: urlReady, syncOpts: syncOpts, watchOpts: watchOpts, param: param,
    shrinkPhoto: shrinkPhoto, photoPicker: photoPicker, sendOrder: sendOrder, lookupClient: lookupClient,
    failText: failText, busy: busy, honeypot: hp, MAX_PHOTOS: MAX_PHOTOS,
    savedKey: savedKey, rememberKey: rememberKey, forgetKey: forgetKey, keyInLink: keyInLink,
    addrLine: addrLine, stateOk: stateOk, zipOk: zipOk, typeFor: typeFor, TYPE_LIST: TYPE_LIST,
    getPrices: getPrices, graphicPrice: graphicPrice, orderTotal: orderTotal
  };
})();
