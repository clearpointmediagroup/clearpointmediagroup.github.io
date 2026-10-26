/*
 * CPMG order forms: shared helpers — cpmg-order.js
 * v1.0 (Oct 25, 2026)
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
  function fmtPhone(s) { var d = digits(s); return d.length === 10 ? '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6) : String(s || '').trim(); }
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
      if (j && j.ok) return j;
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
      btn.innerHTML = '<span class="spin" aria-hidden="true"></span><span>' + esc(text || 'Sending…') + '</span>';
    } else {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      btn.textContent = text || 'Send';
    }
  }

  function hp() { var h = $('cpmgHp'); return h ? h.value : ''; }

  return {
    $: $, each: each, words: words, lines: lines, esc: esc, digits: digits, emailOk: emailOk, fmtPhone: fmtPhone,
    showErr: showErr, urlReady: urlReady, syncOpts: syncOpts, watchOpts: watchOpts, param: param,
    shrinkPhoto: shrinkPhoto, photoPicker: photoPicker, sendOrder: sendOrder, lookupClient: lookupClient,
    failText: failText, busy: busy, honeypot: hp, MAX_PHOTOS: MAX_PHOTOS
  };
})();
