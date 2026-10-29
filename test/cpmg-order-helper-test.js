/*
 * CPMG order forms: "How to order" help bubble — cpmg-order-helper.js
 * v3.1 (Oct 29, 2026)
 * A green "How to order" button near the top of an order form, plus a cute green helper buddy who
 * hops, waves and blinks in the bottom-right corner ("Hi! Need help? Tap me!"). Tapping either one opens
 * the helper at the top of the screen. It walks through
 * the form one short tip at a time, scrolls to each part, and lights it up with a green ring.
 * Silent (no sound). Moves on by itself every few seconds; Back, Next and Close buttons too.
 * The helper always waves and the lit-up part always glows, even when a device has animations turned off.
 * HOW A PAGE USES IT
 *   Before loading this file, the page sets window.CPMG_HELP = [ { t:'Big line', s:'Small line',
 *   el: function(){ return element or null } }, ... ]. Then: <script src="../assets/cpmg-order-helper.js?v=1.0"></script>
 * REVISION LOG
 *   v3.1 (Oct 29, 2026) CC-016: new cute helper buddy Randy and Cindy picked (round green body, big blinking
 *                       eyes, rosy cheeks, smile, a leaf on top). He lives in the bottom-right corner, hops,
 *                       waves and wiggles his leaf, with a "Hi! Need help? Tap me!" bubble; tapping him opens
 *                       the help. The same buddy (smaller) shows in the help box. Extra space at the bottom of
 *                       the page so he never covers the Send button. Moves even with "reduce motion" on.
 *   v3.0 (Oct 29, 2026) CC-012: the helper always waves (bigger wave, with a hand) and the part of the form
 *                       it's talking about gets a pulsing green glow. No longer switched off by a device's
 *                       "reduce motion" setting, which is why it stood still on some phones and laptops.
 *   v2.9 (Oct 28, 2026) Every tip stays 9 seconds, the first one too (was 10).
 *   v2.8 (Oct 28, 2026) Every tip stays 10 seconds, the first one too (was 3 seconds), so it never feels rushed.
 *   v2.7 (Oct 28, 2026) 10 seconds a tip (was 8). First tip stays 3 seconds.
 *   v2.6 (Oct 28, 2026) 8 seconds a tip (was 7). First tip stays 3 seconds.
 *   v2.5 (Oct 28, 2026) 7 seconds a tip (was 6.5). First tip stays 3 seconds.
 *   v2.4 (Oct 28, 2026) 6.5 seconds a tip (was 6). First tip stays 3 seconds.
 *   v2.3 (Oct 28, 2026) 6 seconds a tip (was 5). First tip stays 3 seconds.
 *   v2.2 (Oct 28, 2026) 5 seconds a tip (was 7). First tip stays 3 seconds.
 *   v2.1 (Oct 28, 2026) 7 seconds a tip (was 8). First tip stays 3 seconds.
 *   v2.0 (Oct 28, 2026) 8 seconds a tip (was 10). First tip stays 3 seconds.
 *   v1.9 (Oct 28, 2026) The "Hi!" tip drops down to the first section after 3 seconds; every tip after that
 *                       waits 10 seconds (was 12).
 *   v1.8 (Oct 28, 2026) 12 seconds a tip (was 10). First tip stays 3 seconds.
 *   v1.7 (Oct 28, 2026) Slower: 10 seconds a tip (was 6). First tip stays 3 seconds.
 *   v1.6 (Oct 28, 2026) Slower again now that the fill-up bar shows it's moving: 6 seconds a tip (was 4),
 *                       first tip 3 seconds (was 2).
 *   v1.5 (Oct 28, 2026) Faster: each tip moves on after 4 seconds (was 7). A thin green bar fills up under
 *                       each tip, so people can see it's about to move on. The bar goes away once they tap
 *                       Next or Back (then they move at their own pace).
 *   v1.4 (Oct 28, 2026) The first tip ("Hi!") moves on after 2 seconds, so people quickly see the helper
 *                       walk down the form. The other tips still wait 7 seconds each.
 *   v1.3 (Oct 28, 2026) Smaller help box (smaller face, words and buttons) so it takes less of the screen.
 *                       Each part now scrolls to sit just under the help box, never hidden behind it.
 *                       Brought back the row of slide dots (one per tip) instead of "Tip 3 of 11".
 *   v1.2 (Oct 28, 2026) Shows "Tip 3 of 11" instead of dots. Stops moving on by itself once the client
 *                       taps Next or Back, so slow readers aren't rushed. A tip marked opt:true is skipped
 *                       when its part isn't on the screen (e.g. Rush when today's rush spots are taken).
 *                       Moves on by itself every 7 seconds (was 6).
 *   v1.1 (Oct 28, 2026) Bigger, easier-to-see button: full-width orange box right under the top line,
 *                       "Need help? Tap here", with a gentle glow 3 times so it catches the eye.
 *   v1.0 (Oct 28, 2026) First version, for the Detail Order form (approved preview in chat).
 */
(function () {
  var STEPS = window.CPMG_HELP || [];
  if (!STEPS.length) return;
  var WAIT = 9000, FIRST_WAIT = 9000;   // v2.8: same steady pace for every tip

  var css = '' +
    '.hlp-btn{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;font:800 21px var(--display);background:var(--amber);color:var(--amberbg);border:0;border-radius:14px;padding:14px 16px;cursor:pointer;min-height:60px}' +
    '.hlp-btn .q{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:var(--amberbg);color:var(--amber);font:800 22px var(--display);flex:none}' +
    '.hlp{position:fixed;left:0;right:0;top:0;z-index:50;padding:6px 10px;padding-top:calc(6px + env(safe-area-inset-top,0px))}' +
    '.hlp-in{max-width:520px;margin:0 auto;background:var(--deep);border:2px solid var(--green);border-radius:16px;padding:8px 10px;display:flex;flex-direction:column;gap:4px}' +
    '.hlp-row{display:flex;gap:8px;align-items:center}' +
    '.hlp-txt{flex:1;min-width:0}' +
    '.hlp-t{font:800 17px var(--display);color:var(--fg);line-height:1.2}' +
    '.hlp-s{font-size:15px;color:var(--muted);line-height:1.3;margin-top:1px}' +
    '.hlp-ft{display:flex;align-items:center;justify-content:space-between;gap:8px}' +
    '.hlp-dots{font-size:12px;color:var(--green);letter-spacing:2px}' +
    '.hlp-ft button{font:700 15px var(--body);background:transparent;color:var(--green);border:2px solid var(--green);border-radius:10px;padding:3px 12px;min-height:34px;cursor:pointer}' +
    '.hlp-ft .nx{background:var(--green);color:var(--ink)}' +
    '.hlp-bar{height:5px;border-radius:3px;background:var(--line);overflow:hidden}' +
    '.hlp-bar i{display:block;height:100%;width:0;background:var(--green)}' +
    '.hlp-x{background:transparent;border:0;color:var(--muted);font-size:24px;line-height:1;padding:0 4px;min-width:32px;min-height:32px;cursor:pointer;align-self:flex-start}' +
    '.cpmg-hl{outline:3px solid var(--green)!important;outline-offset:4px;border-radius:12px}' +
    '.hlp-bob{animation:hlpBob 2s ease-in-out infinite;flex:none}' +
    '.hlp-arm{transform-box:view-box;transform-origin:58px 50px;animation:hlpWave .9s ease-in-out infinite}' +
    '.cpmg-hl{animation:hlpGlowRing 1.4s ease-in-out infinite}' +
    '.hlp-btn{animation:hlpGlow 1.6s ease-in-out 3}' +
    '.hlp-in{animation:hlpIn .25s ease-out}' +
    '@keyframes hlpGlow{0%,100%{box-shadow:0 0 0 0 rgba(250,199,117,0)}50%{box-shadow:0 0 0 8px rgba(250,199,117,.35)}}' +
    '@keyframes hlpBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}' +
    '@keyframes hlpWave{0%,100%{transform:rotate(10deg)}50%{transform:rotate(-35deg)}}' +
    '@keyframes hlpGlowRing{0%,100%{outline-offset:4px;box-shadow:0 0 0 0 rgba(95,196,140,.15),0 0 6px 2px rgba(95,196,140,.25)}50%{outline-offset:8px;box-shadow:0 0 0 10px rgba(95,196,140,.28),0 0 22px 8px rgba(95,196,140,.55)}}' +
    '@keyframes hlpIn{from{transform:translateY(-12px);opacity:0}to{transform:none;opacity:1}}' +
    /* v3.1 CC-016: buddy */
    '.bdy-hop{animation:bdyHop 1.6s ease-in-out infinite;transform-origin:50% 100%;transform-box:view-box}' +
    '.bdy-arm{animation:bdyWave .9s ease-in-out infinite;transform-origin:118px 92px;transform-box:view-box}' +
    '.bdy-lid{animation:bdyBlink 4s infinite;transform-origin:center;transform-box:fill-box}' +
    '.bdy-leaf{animation:bdySway 2s ease-in-out infinite;transform-origin:80px 32px;transform-box:view-box}' +
    '@keyframes bdyHop{0%,100%{transform:translateY(0) scaleY(1)}40%{transform:translateY(-10px) scaleY(1.03)}55%{transform:translateY(0) scaleY(.96)}}' +
    '@keyframes bdyWave{0%,100%{transform:rotate(-10deg)}50%{transform:rotate(28deg)}}' +
    '@keyframes bdyBlink{0%,92%,100%{transform:scaleY(0)}95%{transform:scaleY(1)}}' +
    '@keyframes bdySway{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}' +
    '.bdy{position:fixed;right:10px;bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:40;display:flex;align-items:flex-end;gap:4px;background:transparent;border:0;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
    '.bdy-bub{background:#fff;color:#173404;border:2px solid #3B6D11;border-radius:14px;padding:6px 10px;font:800 15px var(--body);line-height:1.2;text-align:left;margin-bottom:58px;animation:bdyPop 3s ease-in-out infinite}' +
    '@keyframes bdyPop{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}' +
    'body.bdy-room{padding-bottom:130px}' +
    '.hlp-bdy{flex:none}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // v3.1 CC-016: the buddy (one drawing, used big in the corner and small in the help box)
  function buddy(w, cls) {
    return '<svg class="' + cls + '" width="' + w + '" height="' + Math.round(w * 190 / 170) + '" viewBox="0 0 170 190" overflow="visible" aria-hidden="true"><g class="bdy-hop">' +
      '<g class="bdy-leaf"><path d="M80 32 C70 12 88 4 96 12 C92 20 86 26 80 32Z" fill="#97C459" stroke="#27500A" stroke-width="2"/><line x1="80" y1="32" x2="80" y2="42" stroke="#27500A" stroke-width="3" stroke-linecap="round"/></g>' +
      '<ellipse cx="80" cy="182" rx="40" ry="6" fill="#000" opacity=".15"/>' +
      '<rect x="56" y="150" width="16" height="26" rx="8" fill="#3B6D11"/><rect x="88" y="150" width="16" height="26" rx="8" fill="#3B6D11"/>' +
      '<path d="M30 70 C38 108 34 116 40 116" stroke="#3B6D11" stroke-width="14" stroke-linecap="round" fill="none"/>' +
      '<circle cx="80" cy="100" r="58" fill="#639922" stroke="#27500A" stroke-width="3"/>' +
      '<ellipse cx="80" cy="122" rx="34" ry="26" fill="#C0DD97"/>' +
      '<g class="bdy-arm"><path d="M118 92 C134 78 140 62 142 50" stroke="#3B6D11" stroke-width="14" stroke-linecap="round" fill="none"/><circle cx="143" cy="46" r="11" fill="#97C459" stroke="#27500A" stroke-width="2"/></g>' +
      '<ellipse cx="62" cy="86" rx="11" ry="14" fill="#fff"/><ellipse cx="98" cy="86" rx="11" ry="14" fill="#fff"/>' +
      '<circle cx="64" cy="89" r="6" fill="#173404"/><circle cx="100" cy="89" r="6" fill="#173404"/>' +
      '<circle cx="66" cy="86" r="2" fill="#fff"/><circle cx="102" cy="86" r="2" fill="#fff"/>' +
      '<rect class="bdy-lid" x="50" y="72" width="24" height="28" rx="12" fill="#639922"/><rect class="bdy-lid" x="86" y="72" width="24" height="28" rx="12" fill="#639922"/>' +
      '<circle cx="50" cy="106" r="7" fill="#F0997B" opacity=".75"/><circle cx="110" cy="106" r="7" fill="#F0997B" opacity=".75"/>' +
      '<path d="M68 106 Q80 120 92 106" stroke="#173404" stroke-width="3.5" fill="#D85A30" stroke-linecap="round"/>' +
      '</g></svg>';
  }
  var face = buddy(44, 'hlp-bdy');

  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'hlp-btn'; btn.id = 'hlpBtn';
  btn.innerHTML = '<span class="q" aria-hidden="true">?</span> Need help? Tap here';
  var anchor = document.getElementById('payPill') || document.querySelector('.top');
  if (!anchor) return;
  anchor.parentNode.insertBefore(btn, anchor.nextSibling);

  var box = document.createElement('div');
  box.className = 'hlp'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'How to order');
  box.innerHTML = '<div class="hlp-in"><div class="hlp-row">' + face +
    '<div class="hlp-txt" aria-live="polite"><div class="hlp-t" id="hlpT"></div><div class="hlp-s" id="hlpS"></div></div>' +
    '<button type="button" class="hlp-x" id="hlpX" aria-label="Close help">&times;</button></div>' +
    '<div class="hlp-bar" id="hlpBar" aria-hidden="true"><i id="hlpP"></i></div>' +
    '<div class="hlp-ft"><span class="hlp-dots" id="hlpD"></span><span>' +
    '<button type="button" id="hlpB">Back</button> <button type="button" class="nx" id="hlpN">Next</button></span></div></div>';
  document.body.appendChild(box);

  // v3.1 CC-016: buddy in the bottom-right corner; tapping him opens the help
  var pal = document.createElement('button');
  pal.type = 'button'; pal.className = 'bdy'; pal.id = 'bdyPal'; pal.setAttribute('aria-label', 'Need help? Tap me');
  pal.innerHTML = '<span class="bdy-bub" aria-hidden="true">Hi! Need help?<br>Tap me!</span>' + buddy(78, 'bdy-big');
  document.body.appendChild(pal);
  document.body.classList.add('bdy-room');

  var i = 0, timer = null, lit = null, auto = true, list = STEPS;
  function $(id) { return document.getElementById(id); }
  function unlight() { if (lit) { lit.classList.remove('cpmg-hl'); lit = null; } }
  function target(s) { var el = null; try { el = s.el ? s.el() : null; } catch (e) { el = null; } return el && el.offsetParent !== null ? el : null; }
  function place(el) {
    if (el.closest('.bar')) return;
    requestAnimationFrame(function () {
      var y = el.getBoundingClientRect().top + window.pageYOffset - (box.offsetHeight + box.offsetTop + 16);
      try { window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' }); } catch (e) { window.scrollTo(0, Math.max(0, y)); }
    });
  }
  function show() {
    var s = list[i];
    $('hlpT').textContent = typeof s.t === 'function' ? s.t() : s.t;
    $('hlpS').textContent = typeof s.s === 'function' ? s.s() : s.s;
    $('hlpD').textContent = list.map(function (_, k) { return k === i ? '\u25CF' : '\u25CB'; }).join(' ');
    $('hlpD').setAttribute('aria-label', 'Tip ' + (i + 1) + ' of ' + list.length);
    $('hlpB').style.visibility = i === 0 ? 'hidden' : 'visible';
    $('hlpN').textContent = i === list.length - 1 ? 'Got it' : 'Next';
    unlight();
    var el = target(s);
    if (el) {
      lit = el; el.classList.add('cpmg-hl');
      place(el);
    } else if (i === 0) {
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
    }
    clearTimeout(timer);
    var ms = i === 0 ? FIRST_WAIT : WAIT, going = auto && i < list.length - 1, bar = $('hlpP');
    $('hlpBar').style.visibility = going ? 'visible' : 'hidden';
    bar.style.transition = 'none'; bar.style.width = '0'; void bar.offsetWidth;
    if (going) {
      bar.style.transition = 'width ' + ms + 'ms linear'; bar.style.width = '100%';
      timer = setTimeout(function () { i++; show(); }, ms);
    }
  }
  function open() {
    list = STEPS.filter(function (s) { return !s.opt || target(s); });
    var tb = [].slice.call(document.body.children).filter(function (e) { return /TEST COPY/.test(e.textContent || '') && getComputedStyle(e).position === 'sticky'; })[0];   // TEST COPY only: sit under the orange banner
    box.style.top = tb ? tb.offsetHeight + 'px' : '0';
    i = 0; auto = true; box.hidden = false; pal.hidden = true; show();
  }
  function close() { clearTimeout(timer); unlight(); box.hidden = true; pal.hidden = false; btn.focus(); }
  btn.addEventListener('click', function () { box.hidden ? open() : close(); });
  pal.addEventListener('click', function () { box.hidden ? open() : close(); });
  $('hlpX').addEventListener('click', close);
  $('hlpN').addEventListener('click', function () { auto = false; if (i === list.length - 1) close(); else { i++; show(); } });
  $('hlpB').addEventListener('click', function () { auto = false; if (i > 0) { i--; show(); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !box.hidden) close(); });
})();
