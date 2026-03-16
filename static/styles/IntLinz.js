const cv = document.getElementById("cv");
const cx = cv.getContext("2d");

let lt = "c"; // тип линзы: 'c' — собирающая, 'd' — рассеивающая
let Fv = 15;  // фокусное расстояние (см)
let dv = 25;  // расстояние предмета от линзы (см)
let hv = 10;  // высота предмета (см)
let ry = [1, 1, 1]; // включённые лучи
let dr = false; // перетаскивание активно
let dt = null;  // тип: 'p' — позиция, 'h' — высота
let sc = 1;     // масштаб: px на см

// Цвета
const CO = {
  r1: "#e17055",
  r2: "#00b894",
  r3: "#0984e3",
  ob: "#1b4580",
  iR: "#10b981",
  iV: "#e17055",
  lC: "#1b4580",
  lD: "#e17055",
  ax: "#94a3b8",
  gr: "#e2e8f0",
  bg: "#0a0a0a",
  t2: "#94a3b8",
};

// ══════════════════════ РАЗМЕР ХОЛСТА ══════════════════════
function rsz() {
  const r = cv.getBoundingClientRect();
  const d = devicePixelRatio || 1;
  cv.width  = r.width  * d;
  cv.height = r.height * d;
  cx.setTransform(d, 0, 0, d, 0, 0);
  drw();
}

window.addEventListener("resize", rsz);

function gW() { return cv.width  / (devicePixelRatio || 1); }
function gH() { return cv.height / (devicePixelRatio || 1); }
function gLC() { return { x: gW() * 0.48, y: gH() * 0.5 }; }

// Масштаб: сколько пикселей на 1 см
// Максимальное значение любого параметра = 50 см
// Видимая область слева от линзы ≈ 48% ширины → под предмет
// Видимая область справа от линзы ≈ 52% ширины → под изображение
// Берём так, чтобы 50 см помещалось в 40% ширины с запасом
function calcSc() {
  const w = gW();
  const h = gH();
  // 50 см должно умещаться в ~42% ширины (зона предмета) и в ~44% (зона изображения)
  const scX = (w * 0.40) / 50;
  // Высота 50 см должна умещаться в ~40% высоты холста
  const scY = (h * 0.38) / 50;
  return Math.min(scX, scY);
}

// ══════════════════════ UI ══════════════════════
function upd() {
  Fv = +document.getElementById("sF").value;
  dv = +document.getElementById("sD").value;
  hv = +document.getElementById("sH").value;
  syn();
  drw();
}

function syn() {
  document.getElementById("vF").textContent = Fv + " см";
  document.getElementById("vD").textContent = dv + " см";
  document.getElementById("vH").textContent = hv + " см";
  document.getElementById("sF").value = Fv;
  document.getElementById("sD").value = dv;
  document.getElementById("sH").value = hv;
}

function setLens(t) {
  lt = t;
  drw();
}

function tR(i) {
  ry[i] = document.getElementById("r" + i).checked ? 1 : 0;
  drw();
}

function resetAll() {
  lt = "c";
  Fv = 15;
  dv = 25;
  hv = 10;
  ry = [1, 1, 1];
  if (document.getElementById("lensSelect"))
    document.getElementById("lensSelect").value = "c";
  for (let i = 0; i < 3; i++) {
    const cb = document.getElementById("r" + i);
    if (cb) cb.checked = true;
    ry[i] = 1;
  }
  syn();
  drw();
}

// ══════════════════════ РАСЧЁТ ИЗОБРАЖЕНИЯ ══════════════════════
function cImg() {
  const f  = lt === "c" ? Fv : -Fv;
  const dn = dv - f;
  if (Math.abs(dn) < 0.5) return { di: Infinity, hi: Infinity, re: false };
  const di = (dv * f) / dn;
  const m  = -di / dv;
  return { di, hi: m * hv, re: di > 0, m };
}

// ══════════════════════ ПРИМИТИВЫ ══════════════════════
function dl(x1, y1, x2, y2, c, w, ds) {
  cx.save();
  cx.strokeStyle = c;
  cx.lineWidth   = w || 1.8;
  cx.lineCap     = "round";
  if (ds) cx.setLineDash(ds);
  cx.beginPath();
  cx.moveTo(x1, y1);
  cx.lineTo(x2, y2);
  cx.stroke();
  cx.restore();
}

function da(x1, y1, x2, y2, c, w) {
  cx.save();
  cx.strokeStyle = c;
  cx.fillStyle   = c;
  cx.lineWidth   = w;
  cx.lineCap     = "round";
  cx.beginPath();
  cx.moveTo(x1, y1);
  cx.lineTo(x2, y2);
  cx.stroke();
  var a = Math.atan2(y2 - y1, x2 - x1), h = 10;
  cx.beginPath();
  cx.moveTo(x2, y2);
  cx.lineTo(x2 - h * Math.cos(a - 0.4), y2 - h * Math.sin(a - 0.4));
  cx.lineTo(x2 - h * Math.cos(a + 0.4), y2 - h * Math.sin(a + 0.4));
  cx.closePath();
  cx.fill();
  cx.restore();
}

function dad(x1, y1, x2, y2, c, w) {
  cx.save();
  cx.strokeStyle = c;
  cx.fillStyle   = c;
  cx.lineWidth   = w;
  cx.setLineDash([6, 4]);
  cx.lineCap     = "round";
  cx.beginPath();
  cx.moveTo(x1, y1);
  cx.lineTo(x2, y2);
  cx.stroke();
  cx.setLineDash([]);
  var a = Math.atan2(y2 - y1, x2 - x1), h = 10;
  cx.beginPath();
  cx.moveTo(x2, y2);
  cx.lineTo(x2 - h * Math.cos(a - 0.4), y2 - h * Math.sin(a - 0.4));
  cx.lineTo(x2 - h * Math.cos(a + 0.4), y2 - h * Math.sin(a + 0.4));
  cx.closePath();
  cx.fill();
  cx.restore();
}

function ext(x1, y1, x2, y2, w) {
  var dx = x2 - x1, dy = y2 - y1;
  if (Math.abs(dx) < 0.001) return { x: x2, y: dy > 0 ? 2000 : -2000 };
  var t = dx > 0 ? (w + 100 - x1) / dx : (-100 - x1) / dx;
  return { x: x1 + dx * t, y: y1 + dy * t };
}

// ══════════════════════ ОТРИСОВКА ══════════════════════
function drw() {
  var w = gW(), h = gH(), lc = gLC();

  // Пересчитываем масштаб под текущий размер холста
  sc = calcSc();

  cx.clearRect(0, 0, w, h);
  cx.fillStyle = CO.bg;
  cx.fillRect(0, 0, w, h);

  // Сетка
  cx.strokeStyle = "rgba(255,255,255,0.06)";
  cx.lineWidth   = 0.5;
  for (var x = lc.x % 50; x < w; x += 50) {
    cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x, h); cx.stroke();
  }
  for (var y = lc.y % 50; y < h; y += 50) {
    cx.beginPath(); cx.moveTo(0, y); cx.lineTo(w, y); cx.stroke();
  }

  // Главная оптическая ось
  cx.save();
  cx.strokeStyle = "rgba(255,255,255,0.2)";
  cx.lineWidth   = 1;
  cx.setLineDash([8, 4]);
  cx.beginPath();
  cx.moveTo(0, lc.y);
  cx.lineTo(w, lc.y);
  cx.stroke();
  cx.setLineDash([]);
  cx.fillStyle = "rgba(255,255,255,0.2)";
  cx.beginPath();
  cx.moveTo(w - 5, lc.y - 4);
  cx.lineTo(w,     lc.y);
  cx.lineTo(w - 5, lc.y + 4);
  cx.fill();
  cx.font      = "500 11px Segoe UI, sans-serif";
  cx.fillStyle = "rgba(255,255,255,0.35)";
  cx.textAlign = "right";
  cx.fillText("Главная оптическая ось", w - 10, lc.y - 10);
  cx.restore();

  // Линза
  var lH   = Math.min(h * 0.65, 280);
  var lCol = lt === "c" ? "#6995f5" : "#e17055";
  cx.save();

  if (lt === "c") {
    cx.strokeStyle = lCol;
    cx.fillStyle   = "rgba(105,149,245,0.08)";
    cx.lineWidth   = 2.5;
    cx.beginPath();
    cx.moveTo(lc.x, lc.y - lH / 2);
    cx.quadraticCurveTo(lc.x + 14, lc.y, lc.x, lc.y + lH / 2);
    cx.quadraticCurveTo(lc.x - 14, lc.y, lc.x, lc.y - lH / 2);
    cx.closePath();
    cx.fill();
    cx.stroke();
    cx.fillStyle = lCol;
    var s = 7;
    cx.beginPath();
    cx.moveTo(lc.x - s, lc.y - lH / 2 + s);
    cx.lineTo(lc.x,     lc.y - lH / 2 - 2);
    cx.lineTo(lc.x + s, lc.y - lH / 2 + s);
    cx.fill();
    cx.beginPath();
    cx.moveTo(lc.x - s, lc.y + lH / 2 - s);
    cx.lineTo(lc.x,     lc.y + lH / 2 + 2);
    cx.lineTo(lc.x + s, lc.y + lH / 2 - s);
    cx.fill();
  } else {
    cx.strokeStyle = lCol;
    cx.lineWidth   = 2.5;
    var cc = 12, tp = lc.y - lH / 2, bt = lc.y + lH / 2;
    cx.beginPath();
    cx.moveTo(lc.x - 5, tp);
    cx.quadraticCurveTo(lc.x + cc, lc.y, lc.x - 5, bt);
    cx.stroke();
    cx.beginPath();
    cx.moveTo(lc.x + 5, tp);
    cx.quadraticCurveTo(lc.x - cc, lc.y, lc.x + 5, bt);
    cx.stroke();
    cx.beginPath();
    cx.moveTo(lc.x - 5, tp); cx.lineTo(lc.x + 5, tp);
    cx.moveTo(lc.x - 5, bt); cx.lineTo(lc.x + 5, bt);
    cx.stroke();
    cx.fillStyle = lCol;
    var s2 = 6;
    [[-1, tp], [1, bt]].forEach(function (pair) {
      var d2 = pair[0], ty = pair[1];
      cx.beginPath();
      cx.moveTo(lc.x - 8, ty + d2 * 2);
      cx.lineTo(lc.x - 8, ty - d2 * s2);
      cx.lineTo(lc.x - 4, ty);
      cx.fill();
      cx.beginPath();
      cx.moveTo(lc.x + 8, ty + d2 * 2);
      cx.lineTo(lc.x + 8, ty - d2 * s2);
      cx.lineTo(lc.x + 4, ty);
      cx.fill();
    });
  }

  cx.font      = "600 11px Segoe UI, sans-serif";
  cx.fillStyle = lCol;
  cx.textAlign = "center";
  cx.fillText("Линза", lc.x, lc.y - lH / 2 - 12);
  cx.restore();

  // Фокусные точки
  cx.save();
  var fc = lCol;
  [[-Fv * sc, "F"], [Fv * sc, "F'"]].forEach(function (pair) {
    var dx = pair[0], lb = pair[1], px = lc.x + dx;
    cx.fillStyle = fc;
    cx.beginPath(); cx.arc(px, lc.y, 5, 0, Math.PI * 2); cx.fill();
    cx.fillStyle = CO.bg;
    cx.beginPath(); cx.arc(px, lc.y, 2, 0, Math.PI * 2); cx.fill();
    cx.font      = "700 12px Segoe UI, sans-serif";
    cx.fillStyle = fc;
    cx.textAlign = "center";
    cx.fillText(lb, px, lc.y + 22);
  });
  [[-2 * Fv * sc, "2F"], [2 * Fv * sc, "2F'"]].forEach(function (pair) {
    var dx = pair[0], lb = pair[1], px = lc.x + dx;
    cx.globalAlpha = 0.5;
    cx.fillStyle   = fc;
    cx.beginPath(); cx.arc(px, lc.y, 3.5, 0, Math.PI * 2); cx.fill();
    cx.globalAlpha = 1;
    cx.font        = "600 10px Segoe UI, sans-serif";
    cx.textAlign   = "center";
    cx.fillText(lb, px, lc.y + 18);
  });
  cx.restore();

  // Предмет
  var ox = lc.x - dv * sc, oy = lc.y - hv * sc;
  da(ox, lc.y, ox, oy, "#6995f5", 3);
  cx.save();
  cx.font      = "600 12px Segoe UI, sans-serif";
  cx.fillStyle = "#6995f5";
  cx.textAlign = "center";
  cx.fillText("Предмет", ox, lc.y + 20);
  cx.restore();

  var im = cImg();

  if (isFinite(im.di)) {
    var ix = lc.x + im.di * sc, iy = lc.y - im.hi * sc;
    drawRays(lc, ox, oy, w, sc);
    var ic = im.re ? "#10b981" : "#e17055";
    if (im.re) da(ix, lc.y, ix, iy, ic, 3);
    else       dad(ix, lc.y, ix, iy, ic, 3);
    cx.save();
    cx.font      = "600 12px Segoe UI, sans-serif";
    cx.fillStyle = ic;
    cx.textAlign = "center";
    cx.fillText(im.re ? "Изображение" : "Мнимое изобр.", ix, lc.y + 20);
    cx.restore();
    updR(im);
  } else {
    drawRaysInf(lc, ox, oy, w, sc);
    updRI();
  }
}

// ══════════════════════ ЛУЧИ ══════════════════════
function drawRays(lc, ox, oy, w, s) {
  if (ry[0]) {
    dl(ox, oy, lc.x, oy, CO.r1, 1.8);
    if (lt === "c") {
      var e = ext(lc.x, oy, lc.x + Fv * s, lc.y, w);
      dl(lc.x, oy, e.x, e.y, CO.r1, 1.8);
    } else {
      var fsx = lc.x - Fv * s, e2 = ext(fsx, lc.y, lc.x, oy, w);
      dl(lc.x, oy, e2.x, e2.y, CO.r1, 1.8);
      dl(lc.x, oy, fsx, lc.y, CO.r1, 1.8, [8, 6]);
    }
  }
  if (ry[1]) {
    if (lt === "c") {
      var flx = lc.x - Fv * s, sl = (lc.y - oy) / (flx - ox),
          yl  = oy + sl * (lc.x - ox);
      dl(ox, oy, lc.x, yl, CO.r2, 1.8);
      dl(lc.x, yl, w + 50, yl, CO.r2, 1.8);
    } else {
      var frx = lc.x + Fv * s, sl2 = (lc.y - oy) / (frx - ox),
          yl2 = oy + sl2 * (lc.x - ox);
      dl(ox, oy, lc.x, yl2, CO.r2, 1.8);
      dl(lc.x, yl2, w + 50, yl2, CO.r2, 1.8);
      dl(lc.x, yl2, frx, lc.y, CO.r2, 1.8, [8, 6]);
    }
  }
  if (ry[2]) {
    var e3 = ext(ox, oy, lc.x, lc.y, w);
    dl(ox, oy, e3.x, e3.y, CO.r3, 1.8);
  }
}

function drawRaysInf(lc, ox, oy, w, s) {
  if (ry[0]) {
    dl(ox, oy, lc.x, oy, CO.r1, 1.8);
    dl(lc.x, oy, w + 50, oy, CO.r1, 1.8);
  }
  if (ry[1]) {
    var flx = lc.x - Fv * s, sl = (lc.y - oy) / (flx - ox),
        yl  = oy + sl * (lc.x - ox);
    dl(ox, oy, lc.x, yl, CO.r2, 1.8);
    dl(lc.x, yl, w + 50, yl, CO.r2, 1.8);
  }
  if (ry[2]) {
    var e = ext(ox, oy, lc.x, lc.y, w);
    dl(ox, oy, e.x, e.y, CO.r3, 1.8);
  }
}

// ══════════════════════ РЕЗУЛЬТАТЫ ══════════════════════
function updR(im) {
  var te = document.getElementById("rT"),
      se = document.getElementById("rS"),
      oe = document.getElementById("rO"),
      de = document.getElementById("rDi");

  te.textContent = im.re ? "Действительное" : "Мнимое";
  te.className   = "result-value " + (im.re ? "real" : "virtual");

  var am = Math.abs(im.m);
  if (Math.abs(am - 1) < 0.05) {
    se.textContent = "Равное";   se.className = "result-value equal";
  } else if (am > 1) {
    se.textContent = "Увеличенное"; se.className = "result-value enlarged";
  } else {
    se.textContent = "Уменьшенное"; se.className = "result-value reduced";
  }

  oe.textContent = im.hi > 0 ? "Прямое" : "Перевёрнутое";
  oe.className   = "result-value " + (im.hi > 0 ? "upright" : "inverted");

  de.textContent = Math.abs(im.di).toFixed(1) + " см";
  de.className   = "result-value";

  var fs = lt === "c" ? Fv : -Fv;
  document.getElementById("fT").textContent =
    "1/" + fs + " = 1/" + dv + " + 1/f → f ≈ " + im.di.toFixed(1);
}

function updRI() {
  var te = document.getElementById("rT");
  te.textContent = "∞ (в фокусе)";
  te.className   = "result-value";
  document.getElementById("rS").textContent  = "—";
  document.getElementById("rS").className    = "result-value";
  document.getElementById("rO").textContent  = "—";
  document.getElementById("rO").className    = "result-value";
  document.getElementById("rDi").textContent = "∞";
  document.getElementById("rDi").className   = "result-value";
  document.getElementById("fT").textContent  = "d = F → изображение на бесконечности";
}

// ══════════════════════ ПЕРЕТАСКИВАНИЕ ══════════════════════
cv.addEventListener("mousedown", function (e) {
  var r  = cv.getBoundingClientRect(),
      mx = e.clientX - r.left,
      my = e.clientY - r.top;
  var lc = gLC(), ox = lc.x - dv * sc, oy = lc.y - hv * sc;
  if (Math.abs(mx - ox) < 20 && my > oy - 15 && my < lc.y + 10) {
    dr = true;
    dt = Math.abs(my - oy) < 20 ? "h" : "p";
  }
});

cv.addEventListener("mousemove", function (e) {
  if (!dr) return;
  var r  = cv.getBoundingClientRect(),
      mx = e.clientX - r.left,
      my = e.clientY - r.top,
      lc = gLC();
  if (dt === "p") {
    dv = Math.round(Math.max(1, Math.min(50, (lc.x - mx) / sc)));
    document.getElementById("sD").value       = dv;
    document.getElementById("vD").textContent = dv + " см";
  } else {
    hv = Math.round(Math.max(1, Math.min(50, (lc.y - my) / sc)));
    document.getElementById("sH").value       = hv;
    document.getElementById("vH").textContent = hv + " см";
  }
  drw();
});

cv.addEventListener("mouseup",    function () { dr = false; });
cv.addEventListener("mouseleave", function () { dr = false; });

cv.addEventListener("touchstart", function (e) {
  e.preventDefault();
  var t  = e.touches[0],
      r  = cv.getBoundingClientRect(),
      mx = t.clientX - r.left,
      my = t.clientY - r.top;
  var lc = gLC(), ox = lc.x - dv * sc, oy = lc.y - hv * sc;
  if (Math.abs(mx - ox) < 30 && my > oy - 20 && my < lc.y + 15) {
    dr = true;
    dt = Math.abs(my - oy) < 25 ? "h" : "p";
  }
}, { passive: false });

cv.addEventListener("touchmove", function (e) {
  if (!dr) return;
  e.preventDefault();
  var t  = e.touches[0],
      r  = cv.getBoundingClientRect(),
      mx = t.clientX - r.left,
      my = t.clientY - r.top,
      lc = gLC();
  if (dt === "p") {
    dv = Math.round(Math.max(1, Math.min(50, (lc.x - mx) / sc)));
    document.getElementById("sD").value       = dv;
    document.getElementById("vD").textContent = dv + " см";
  } else {
    hv = Math.round(Math.max(1, Math.min(50, (lc.y - my) / sc)));
    document.getElementById("sH").value       = hv;
    document.getElementById("vH").textContent = hv + " см";
  }
  drw();
}, { passive: false });

cv.addEventListener("touchend", function () { dr = false; });

// ══════════════════════ ИНИЦИАЛИЗАЦИЯ ══════════════════════
syn();
setTimeout(rsz, 50);
