(function () {
  var canvas = document.getElementById('grid-bg');
  var ctx = canvas.getContext('2d');
  var CELL = 44;            // grid square size in px
  var RADIUS = 3;           // how many cells around the pointer react
  var DECAY = 0.9;          // trail fade speed (higher = longer trail)
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var w = 0, h = 0, dpr = 1, cols = 0, rows = 0, heat = null;
  var mx = -9999, my = -9999, running = false;
  var line = [211, 214, 206], accent = [30, 111, 92];

  function hexToRgb(hex) {
    hex = (hex || '').trim().replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(hex, 16);
    return isNaN(n) ? null : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    line = hexToRgb(cs.getPropertyValue('--line')) || line;
    accent = hexToRgb(cs.getPropertyValue('--accent')) || accent;
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / CELL) + 1; rows = Math.ceil(h / CELL) + 1;
    heat = new Float32Array(cols * rows);
    readColors();
    start();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // base grid lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = rgba(line, 0.55);
    ctx.beginPath();
    for (var x = 0; x <= cols; x++) { ctx.moveTo(x * CELL + 0.5, 0); ctx.lineTo(x * CELL + 0.5, h); }
    for (var y = 0; y <= rows; y++) { ctx.moveTo(0, y * CELL + 0.5); ctx.lineTo(w, y * CELL + 0.5); }
    ctx.stroke();

    // soft spotlight that follows the pointer
    if (mx > -999) {
      var g = ctx.createRadialGradient(mx, my, 0, mx, my, CELL * RADIUS * 1.4);
      g.addColorStop(0, rgba(accent, 0.035));
      g.addColorStop(1, rgba(accent, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    // glowing cells + intersection markers with a fading trail
    var alive = false;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var i = r * cols + c, v = heat[i];
        if (v < 0.015) { heat[i] = 0; continue; }
        alive = true;
        var px = c * CELL, py = r * CELL;
        ctx.fillStyle = rgba(accent, v * 0.04);
        ctx.fillRect(px + 1, py + 1, CELL - 1, CELL - 1);
        ctx.strokeStyle = rgba(accent, v * 0.22);
        ctx.strokeRect(px + 0.5, py + 0.5, CELL, CELL);
        // little "+" at the cell corner
        var s = 3;
        ctx.beginPath();
        ctx.moveTo(px - s, py + 0.5); ctx.lineTo(px + s + 1, py + 0.5);
        ctx.moveTo(px + 0.5, py - s); ctx.lineTo(px + 0.5, py + s + 1);
        ctx.strokeStyle = rgba(accent, v * 0.45);
        ctx.stroke();
        heat[i] = v * DECAY;
      }
    }
    return alive;
  }

  function loop() {
    var alive = draw();
    if (alive || pointerDown) { requestAnimationFrame(loop); }
    else { running = false; }
  }
  var pointerDown = false;
  function start() { if (!running) { running = true; requestAnimationFrame(loop); } }

  function heatAt(x, y) {
    var cc = Math.floor(x / CELL), cr = Math.floor(y / CELL);
    for (var r = cr - RADIUS; r <= cr + RADIUS; r++) {
      for (var c = cc - RADIUS; c <= cc + RADIUS; c++) {
        if (r < 0 || c < 0 || r >= rows || c >= cols) continue;
        var dx = (c + 0.5) * CELL - x, dy = (r + 0.5) * CELL - y;
        var d = Math.sqrt(dx * dx + dy * dy) / (CELL * RADIUS);
        if (d >= 1) continue;
        var v = 1 - d;
        var i = r * cols + c;
        if (v > heat[i]) heat[i] = v;
      }
    }
  }

  window.addEventListener('pointermove', function (e) {
    mx = e.clientX; my = e.clientY;
    if (!reduceMotion) { heatAt(mx, my); start(); }
  }, { passive: true });
  window.addEventListener('pointerdown', function (e) { pointerDown = true; mx = e.clientX; my = e.clientY; if (!reduceMotion) { heatAt(mx, my); start(); } }, { passive: true });
  window.addEventListener('pointerup', function () { pointerDown = false; }, { passive: true });
  document.addEventListener('pointerleave', function () { mx = my = -9999; start(); });
  window.addEventListener('resize', resize);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { readColors(); start(); });

  resize();
})();
