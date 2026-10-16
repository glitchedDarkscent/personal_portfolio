/* Intro animation: "Portfolio" decodes in -> morphs into "Harshil Dalal" -> flies into the header logo. */
(function () {
  var root = document.documentElement;
  var overlay = document.getElementById('intro');
  if (!overlay) return;
  if (!root.classList.contains('intro-active')) { overlay.remove(); return; }

  /* ---- settings you can change ---- */
  var SHOW_ONCE_PER_SESSION = false;   // true = only play the first time per browser tab
  var FIRST = 'Portfolio';
  var SECOND = 'Harshil Dalal';
  var GLYPHS = '01{}[]<>/\\=+*#$%&;:_-';

  var finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    root.classList.remove('intro-active');   // shows the real logo + starts the hero animation
    overlay.remove();
    try { sessionStorage.setItem('introSeen', '1'); } catch (e) {}
  }

  try { if (SHOW_ONCE_PER_SESSION && sessionStorage.getItem('introSeen')) { finish(); return; } } catch (e) {}

  var textEl = document.getElementById('intro-text');
  var caret = overlay.querySelector('.intro-caret');
  var bar = overlay.querySelector('.intro-bar i');
  var pct = overlay.querySelector('.intro-pct');
  var mark = document.querySelector('header.top .mark');
  if (!textEl || !mark) { finish(); return; }

  window.scrollTo(0, 0);
  overlay.addEventListener('click', finish);               // click or key = skip
  window.addEventListener('keydown', finish, { once: true });
  setTimeout(finish, 12000);                                // safety net

  // Same number of character slots for both words, so the morph is smooth
  var N = Math.max(FIRST.length, SECOND.length);
  function pad(str) {
    var total = N - str.length, left = Math.floor(total / 2);
    return new Array(left + 1).join(' ') + str + new Array(total - left + 1).join(' ');
  }
  var slots = [];
  for (var i = 0; i < N; i++) {
    var sp = document.createElement('span');
    sp.className = 'ch'; sp.textContent = ' ';
    textEl.appendChild(sp); slots.push(sp);
  }
  function setCh(i, ch, scrambling) { slots[i].textContent = ch; slots[i].classList.toggle('scr', scrambling); }

  // Characters flicker through code-like symbols, then lock onto the target letter (left to right)
  function scrambleTo(target, delay, dur) {
    return new Promise(function (resolve) {
      var t0 = performance.now(), last = [];
      function tick(now) {
        if (finished) return resolve();
        var t = now - t0, done = true;
        for (var i = 0; i < N; i++) {
          var start = i * delay, end = start + dur, tc = target.charAt(i), cur = slots[i].textContent;
          if (t >= end) {
            if (cur !== tc || slots[i].classList.contains('scr')) setCh(i, tc, false);
          } else if (!(cur === ' ' && tc === ' ')) {
            done = false;
            if (t >= start && now - (last[i] || 0) > 45) {
              last[i] = now;
              setCh(i, GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length)), true);
            }
          }
        }
        if (done) resolve(); else requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // Progress bar + percentage
  var TOTAL = 3300, p0;
  function progress(now) {
    if (finished) return;
    p0 = p0 || now;
    var p = Math.min(1, (now - p0) / TOTAL), e = 1 - Math.pow(1 - p, 2);
    bar.style.transform = 'scaleX(' + e + ')';
    pct.textContent = Math.round(e * 100) + '%';
    if (p < 1) requestAnimationFrame(progress);
  }

  // Fly the big text into the real header logo position, while the grid fades in behind it
  function fly() {
    if (finished) return;
    caret.style.opacity = 0;
    var a = textEl.getBoundingClientRect();
    var b = mark.getBoundingClientRect();
    var scale = b.width / a.width;
    textEl.style.transformOrigin = '0 0';
    textEl.style.transition = 'transform 1s cubic-bezier(0.77, 0, 0.18, 1)';
    overlay.classList.add('is-leaving');
    requestAnimationFrame(function () {
      textEl.style.transform = 'translate(' + (b.left - a.left) + 'px,' + (b.top - a.top) + 'px) scale(' + scale + ')';
    });
    setTimeout(finish, 1050);
  }

  var fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), wait(1500)]);
  fontsReady.then(function () {
    if (finished) return;
    requestAnimationFrame(progress);
    return scrambleTo(pad(FIRST), 70, 450)
      .then(function () { return wait(450); })
      .then(function () { return scrambleTo(pad(SECOND), 55, 450); })
      .then(function () { return wait(450); })
      .then(fly);
  });
})();
