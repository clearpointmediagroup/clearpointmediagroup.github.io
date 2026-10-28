/*
 * CPMG order forms: "How to order" help bubble — cpmg-order-helper.js
 * v1.1 (Oct 28, 2026)
 * A green "How to order" button near the top of an order form. Tapping it opens a small
 * green helper (a smiling cartoon that waves) at the top of the screen. It walks through
 * the form one short tip at a time, scrolls to each part, and lights it up with a green ring.
 * Silent (no sound). Moves on by itself every few seconds; Back, Next and Close buttons too.
 * Respects "reduce motion" phone settings (no waving or pulsing).
 * HOW A PAGE USES IT
 *   Before loading this file, the page sets window.CPMG_HELP = [ { t:'Big line', s:'Small line',
 *   el: function(){ return element or null } }, ... ]. Then: <script src="../assets/cpmg-order-helper.js?v=1.0"></script>
 * REVISION LOG
 *   v1.1 (Oct 28, 2026) Bigger, easier-to-see button: full-width orange box right under the top line,
 *                       "Need help? Tap here", with a gentle glow 3 times so it catches the eye.
 *   v1.0 (Oct 28, 2026) First version, for the Detail Order form (approved preview in chat).
 */
(function () {
  var STEPS = window.CPMG_HELP || [];
  if (!STEPS.length) return;
  var WAIT = 6000;

  var css = '' +
    '.hlp-btn{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;font:800 21px var(--display);background:var(--amber);color:var(--amberbg);border:0;border-radius:14px;padding:14px 16px;cursor:pointer;min-height:60px}' +
    '.hlp-btn .q{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:var(--amberbg);color:var(--amber);font:800 22px var(--display);flex:none}' +
    '.hlp{position:fixed;left:0;right:0;top:0;z-index:50;padding:10px 12px;padding-top:calc(10px + env(safe-area-inset-top,0px))}' +
    '.hlp-in{max-width:520px;margin:0 auto;background:var(--deep);border:2px solid var(--green);border-radius:16px;padding:12px 14px;display:flex;flex-direction:column;gap:8px}' +
    '.hlp-row{display:flex;gap:12px;align-items:center}' +
    '.hlp-txt{flex:1;min-width:0}' +
    '.hlp-t{font:800 19px var(--display);color:var(--fg);line-height:1.25}' +
    '.hlp-s{font-size:16px;color:var(--muted);line-height:1.4;margin-top:2px}' +
    '.hlp-ft{display:flex;align-items:center;justify-content:space-between;gap:8px}' +
    '.hlp-dots{font-size:14px;color:var(--green);letter-spacing:3px}' +
    '.hlp-ft button{font:700 16px var(--body);background:transparent;color:var(--green);border:2px solid var(--green);border-radius:10px;padding:6px 14px;min-height:40px;cursor:pointer}' +
    '.hlp-ft .nx{background:var(--green);color:var(--ink)}' +
    '.hlp-x{background:transparent;border:0;color:var(--muted);font-size:26px;line-height:1;padding:0 4px;cursor:pointer;align-self:flex-start}' +
    '.cpmg-hl{outline:3px solid var(--green)!important;outline-offset:4px;border-radius:12px}' +
    '@media (prefers-reduced-motion:no-preference){' +
    '.hlp-bob{animation:hlpBob 2s ease-in-out infinite}' +
    '.hlp-arm{transform-origin:58px 50px;animation:hlpWave 1s ease-in-out infinite}' +
    '.cpmg-hl{animation:hlpPulse 1.2s ease-in-out infinite}' +
    '.hlp-btn{animation:hlpGlow 1.6s ease-in-out 3}' +
    '.hlp-in{animation:hlpIn .25s ease-out}}' +
    '@keyframes hlpGlow{0%,100%{box-shadow:0 0 0 0 rgba(250,199,117,0)}50%{box-shadow:0 0 0 8px rgba(250,199,117,.35)}}' +
    '@keyframes hlpBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}' +
    '@keyframes hlpWave{0%,100%{transform:rotate(0)}50%{transform:rotate(-25deg)}}' +
    '@keyframes hlpPulse{0%,100%{outline-offset:4px}50%{outline-offset:9px}}' +
    '@keyframes hlpIn{from{transform:translateY(-12px);opacity:0}to{transform:none;opacity:1}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var face = '<svg class="hlp-bob" width="68" height="72" viewBox="0 0 76 80" aria-hidden="true">' +
    '<circle cx="34" cy="40" r="26" fill="#5fc48c"/>' +
    '<circle cx="25" cy="35" r="5" fill="#fff"/><circle cx="43" cy="35" r="5" fill="#fff"/>' +
    '<circle cx="26" cy="36" r="2.5" fill="#0c130f"/><circle cx="44" cy="36" r="2.5" fill="#0c130f"/>' +
    '<path d="M23 48 Q34 57 45 48" stroke="#0c130f" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
    '<g class="hlp-arm"><line x1="58" y1="50" x2="70" y2="28" stroke="#5fc48c" stroke-width="6" stroke-linecap="round"/></g></svg>';

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
    '<div class="hlp-ft"><span class="hlp-dots" id="hlpD"></span><span>' +
    '<button type="button" id="hlpB">Back</button> <button type="button" class="nx" id="hlpN">Next</button></span></div></div>';
  document.body.appendChild(box);

  var i = 0, timer = null, lit = null;
  function $(id) { return document.getElementById(id); }
  function unlight() { if (lit) { lit.classList.remove('cpmg-hl'); lit = null; } }
  function show() {
    var s = STEPS[i];
    $('hlpT').textContent = typeof s.t === 'function' ? s.t() : s.t;
    $('hlpS').textContent = typeof s.s === 'function' ? s.s() : s.s;
    $('hlpD').textContent = STEPS.map(function (_, k) { return k === i ? '●' : '○'; }).join(' ');
    $('hlpB').style.visibility = i === 0 ? 'hidden' : 'visible';
    $('hlpN').textContent = i === STEPS.length - 1 ? 'Got it' : 'Next';
    unlight();
    var el = null;
    try { el = s.el ? s.el() : null; } catch (e) { el = null; }
    if (el && el.offsetParent !== null) {
      lit = el; el.classList.add('cpmg-hl');
      try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { el.scrollIntoView(); }
    } else if (i === 0) {
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
    }
    clearTimeout(timer);
    if (i < STEPS.length - 1) timer = setTimeout(function () { i++; show(); }, WAIT);
  }
  function open() { i = 0; box.hidden = false; show(); }
  function close() { clearTimeout(timer); unlight(); box.hidden = true; btn.focus(); }
  btn.addEventListener('click', function () { box.hidden ? open() : close(); });
  $('hlpX').addEventListener('click', close);
  $('hlpN').addEventListener('click', function () { if (i === STEPS.length - 1) close(); else { i++; show(); } });
  $('hlpB').addEventListener('click', function () { if (i > 0) { i--; show(); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !box.hidden) close(); });
})();
