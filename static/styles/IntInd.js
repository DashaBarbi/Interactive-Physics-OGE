const S = {
  nx: -1.0,
  prevNx: -1.0,
  polarity: 1,
  spd: 2,

  running: false,
  autoPhase: 'in',
  pauseTimer: 0,

  isDrag: false,
  dragClientX: 0,
  dragNx: -1.0,

  cur: 0,
  phase: 0,
  lastTs: 0,
};

const cv = document.getElementById('electry-canvas');
const cx = cv.getContext('2d');
let W = 0, H = 0;

function resize() {
  const r   = document.querySelector('.simulation-container').getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  W = r.width;
  H = Math.round(W * 0.44);
  cv.width  = W * dpr;
  cv.height = H * dpr;
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', () => setTimeout(resize, 50));

function G() {
  const sc     = Math.min(1, W / 600);
  const ccx    = W * .50,  ccy = H * .50;
  const nL     = 8, gap = 13 * sc, rx = 10 * sc, ry = H * .30;
  const tw     = (nL - 1) * gap;
  const cl     = ccx - tw / 2,  cr = ccx + tw / 2;
  const mw     = 94 * sc,  mh = 30 * sc;
  const mRange = W * .40;
  const mx     = ccx + S.nx * mRange * .54,  my = ccy;
  const gx     = W * .875,  gy = H * .50;
  const gr     = Math.max(28, Math.min(H * .37, 60 * sc));
  return { sc, ccx, ccy, nL, gap, rx, ry, cl, cr, mw, mh, mRange, mx, my, gx, gy, gr };
}

function phys(dt) {
  const vel  = (S.nx - S.prevNx) / Math.max(dt, .008);
  const raw  = -vel * S.polarity * 0.55;
  S.cur      = Math.max(-1, Math.min(1, S.cur * .80 + raw * .9));
  S.prevNx   = S.nx;
}

const BASE_SPD = 0.55;

function autoStep(dt) {
  if (!S.running) return;
  const spd = S.spd * BASE_SPD * dt;

  if (S.autoPhase === 'in') {
    S.nx += spd;
    if (S.nx >= 0.82) { S.nx = 0.82; S.autoPhase = 'pause_in';  S.pauseTimer = 0.55; }
  } else if (S.autoPhase === 'pause_in') {
    S.pauseTimer -= dt;
    if (S.pauseTimer <= 0) S.autoPhase = 'out';
  } else if (S.autoPhase === 'out') {
    S.nx -= spd;
    if (S.nx <= -1.0) { S.nx = -1.0; S.autoPhase = 'pause_out'; S.pauseTimer = 0.45; }
  } else if (S.autoPhase === 'pause_out') {
    S.pauseTimer -= dt;
    if (S.pauseTimer <= 0) S.autoPhase = 'in';
  }
}

function toggleLaunch() {
  S.running = !S.running;
  const btn  = document.getElementById('launchBtn');
  const hint = document.getElementById('hint');
  if (S.running) {
    S.autoPhase  = 'in';
    S.nx         = -1.0;
    btn.className  = 'btn-start running';
    btn.textContent  = '■ Остановить';
    hint.textContent = 'Магнит движется автоматически — наблюдайте отклонение стрелки';
  } else {
    btn.className  = 'btn-start';
    btn.textContent  = '▶ Запустить';
    hint.textContent = 'Нажмите «Запустить» или перетащите магнит рукой';
  }
}

function flipPole() {
  S.polarity *= -1;
  const btn  = document.getElementById('poleBtn');
  const icon = document.getElementById('poleIcon');
  const txt  = document.getElementById('poleTxt');
  if (S.polarity === 1) {
    btn.className  = 'btn-pole pole-n';
    icon.textContent = 'N';
    txt.textContent  = 'северный';
  } else {
    btn.className  = 'btn-pole pole-s';
    icon.textContent = 'S';
    txt.textContent  = 'южный';
  }
}

function setSpd(v) {
  S.spd = +v;
  document.getElementById('spdVal').textContent = '×' + v;
}

function resetSim() {
  S.running = false;
  S.isDrag  = false;
  S.nx      = -1.0;
  S.prevNx  = -1.0;
  S.polarity = 1;
  S.spd     = 2;
  S.autoPhase  = 'in';
  S.pauseTimer = 0;
  S.cur     = 0;
  S.phase   = 0;

  const launchBtn = document.getElementById('launchBtn');
  launchBtn.className   = 'btn-start';
  launchBtn.textContent = '▶ Запустить';

  const poleBtn = document.getElementById('poleBtn');
  poleBtn.className = 'btn-pole pole-n';
  document.getElementById('poleIcon').textContent = 'N';
  document.getElementById('poleTxt').textContent  = ' — северный';

  const spdSlider = document.getElementById('spdSlider');
  spdSlider.value = 2;
  document.getElementById('spdVal').textContent = '×2';

  updateUI();
}

function ln(x1, y1, x2, y2) {
  cx.beginPath(); cx.moveTo(x1, y1); cx.lineTo(x2, y2); cx.stroke();
}

function rrect(x, y, w, h, r) {
  cx.beginPath();
  cx.moveTo(x + r, y);
  cx.lineTo(x + w - r, y);     cx.arcTo(x + w, y,     x + w, y + r,     r);
  cx.lineTo(x + w, y + h - r); cx.arcTo(x + w, y + h, x + w - r, y + h, r);
  cx.lineTo(x + r, y + h);     cx.arcTo(x, y + h,     x, y + h - r,     r);
  cx.lineTo(x, y + r);         cx.arcTo(x, y,         x + r, y,         r);
  cx.closePath();
}

function drawBg(g) {
  cx.fillStyle = '#030a12';
  cx.fillRect(0, 0, W, H);
  cx.strokeStyle = 'rgba(255,255,255,.022)'; cx.lineWidth = .5;
  for (let x = 0; x < W; x += 44) ln(x, 0, x, H);
  for (let y = 0; y < H; y += 44) ln(0, y, W, y);
  cx.save();
  cx.strokeStyle = 'rgba(100,180,255,.06)'; cx.lineWidth = 1; cx.setLineDash([5, 6]);
  ln(0, g.ccy, W, g.ccy);
  cx.setLineDash([]); cx.restore();
}

function drawFieldLines(g) {
  const af = Math.abs(S.cur);
  if (af < .025) return;
  const { mx, my, mw } = g;
  const hw  = mw / 2;
  const nPx = S.polarity === 1 ? mx + hw : mx - hw;
  const sPx = S.polarity === 1 ? mx - hw : mx + hw;
  cx.save();
  for (let i = 0; i < 9; i++) {
    const t      = i / 8;
    const spread = (t - .5) * H * 1.6;
    const midX   = (nPx + sPx) / 2;
    cx.globalAlpha    = af * (.05 + (1 - Math.abs(t - .5) * 2) * .13);
    cx.strokeStyle    = S.polarity === 1 ? '#e08080' : '#6090e8';
    cx.lineWidth      = 1;
    cx.setLineDash([4, 8]);
    cx.lineDashOffset = -(S.phase * 22 * (S.polarity === 1 ? 1 : -1));
    cx.beginPath();
    cx.moveTo(nPx, my);
    cx.quadraticCurveTo(midX, my + spread, sPx, my);
    cx.stroke();
  }
  cx.setLineDash([]); cx.globalAlpha = 1; cx.restore();
}

function drawCoilBack(g) {
  const { cl, ccy, nL, gap, rx, ry, sc } = g;
  const absC = Math.abs(S.cur);
  cx.save();
  cx.lineWidth = 2.6 * sc; cx.lineCap = 'round'; cx.globalAlpha = .28;
  if (absC > .05) { cx.shadowColor = S.cur > 0 ? '#00e87a' : '#ff4040'; cx.shadowBlur = 5 * absC; }
  cx.strokeStyle = '#c87530';
  for (let i = 0; i < nL; i++) {
    const lx = cl + i * gap;
    cx.beginPath(); cx.ellipse(lx, ccy, rx, ry, 0, Math.PI, 0, false); cx.stroke();
  }
  cx.globalAlpha = .18; cx.shadowBlur = 0;
  for (let i = 0; i < nL - 1; i++) ln(cl + i * gap, ccy - ry, cl + (i + 1) * gap, ccy - ry);
  cx.globalAlpha = 1; cx.shadowBlur = 0; cx.restore();
}

function drawMagnet(g) {
  const { mx, my, mw, mh, sc } = g;
  const hw = mw / 2, hh = mh / 2;
  const nL2 = S.polarity === 1 ? mx      : mx - hw;
  const sL  = S.polarity === 1 ? mx - hw : mx;
  const r   = 3 * sc;

  const sg = cx.createLinearGradient(sL, my - hh, sL, my + hh);
  sg.addColorStop(0, '#5898f0'); sg.addColorStop(1, '#1840a0');
  cx.fillStyle = sg; rrect(sL, my - hh, hw, mh, r); cx.fill();

  const ng = cx.createLinearGradient(nL2, my - hh, nL2, my + hh);
  ng.addColorStop(0, '#f05050'); ng.addColorStop(1, '#901010');
  cx.fillStyle = ng; rrect(nL2, my - hh, hw, mh, r); cx.fill();

  cx.strokeStyle = 'rgba(0,0,0,.5)'; cx.lineWidth = 1;
  ln(mx, my - hh, mx, my + hh);

  if (S.isDrag) {
    cx.save();
    cx.shadowColor = 'rgba(255,200,100,.6)'; cx.shadowBlur = 16;
    cx.strokeStyle = 'rgba(255,200,100,.3)'; cx.lineWidth  = 2;
    rrect(mx - hw - 1, my - hh - 1, mw + 2, mh + 2, r + 1); cx.stroke();
    cx.restore();
  }

  cx.font = `bold ${Math.max(10, 12 * sc)}px Rajdhani,sans-serif`;
  cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = 'rgba(255,255,255,.95)';
  cx.fillText('S', sL  + hw / 2, my);
  cx.fillText('N', nL2 + hw / 2, my);
  cx.strokeStyle = 'rgba(255,255,255,.1)'; cx.lineWidth = 1;
  rrect(mx - hw, my - hh, mw, mh, r); cx.stroke();
}

function drawCoilFront(g) {
  const { cl, cr, ccy, nL, gap, rx, ry, sc } = g;
  const absC = Math.abs(S.cur);
  cx.save();
  cx.lineWidth = 3.0 * sc; cx.lineCap = 'round';
  if (absC > .05) { cx.shadowColor = S.cur > 0 ? '#00e87a' : '#ff4040'; cx.shadowBlur = 14 * absC; }
  cx.strokeStyle = '#d88540';
  for (let i = 0; i < nL; i++) {
    const lx = cl + i * gap;
    cx.beginPath(); cx.ellipse(lx, ccy, rx, ry, 0, 0, Math.PI, false); cx.stroke();
  }
  cx.shadowBlur = 0; cx.lineWidth = 2.8 * sc; cx.strokeStyle = '#c87530';
  for (let i = 0; i < nL - 1; i++) {
    if (absC > .05) { cx.shadowColor = S.cur > 0 ? '#00e87a' : '#ff4040'; cx.shadowBlur = 8 * absC; }
    ln(cl + i * gap, ccy + ry, cl + (i + 1) * gap, ccy + ry);
  }
  cx.shadowBlur = 0;

  if (absC > .18) {
    for (let i = 0; i < 3; i++) {
      let t = ((i / 3) + S.phase * .55 * Math.sign(S.cur)) % 1;
      if (t < 0) t += 1;
      const ax = cl + t * (cr - cl), ay = ccy + ry, d = S.cur > 0 ? 1 : -1;
      cx.save();
      cx.globalAlpha = absC * (.5 + Math.sin(t * Math.PI) * .5);
      cx.fillStyle   = S.cur > 0 ? '#00e87a' : '#ff4040';
      cx.shadowColor = cx.fillStyle; cx.shadowBlur = 6;
      cx.beginPath();
      cx.moveTo(ax + 6*sc*d, ay);
      cx.lineTo(ax - 4*sc*d, ay - 4*sc);
      cx.lineTo(ax - 4*sc*d, ay + 4*sc);
      cx.closePath(); cx.fill(); cx.restore();
    }
  }
  cx.globalAlpha = .5;
  cx.font = `600 ${Math.max(9, 10 * sc + 5)}px Rajdhani,sans-serif`;
  cx.fillStyle = '#c87530'; cx.textAlign = 'center';
  cx.fillText('Катушка', g.ccx, ccy - ry - 10 * sc);
  cx.globalAlpha = 1; cx.restore();
}

function drawWires(g) {
  const { cr, ccy, ry, gx, gy, gr, sc } = g;
  const absC = Math.abs(S.cur);
  const wc = absC > .05
    ? (S.cur > 0 ? `rgba(0,232,122,${.45 + absC * .55})` : `rgba(255,64,64,${.45 + absC * .55})`)
    : 'rgba(60,120,200,.2)';
  cx.save();
  cx.strokeStyle = wc; cx.lineWidth = 1.8 * sc; cx.lineJoin = 'round'; cx.lineCap = 'round';
  if (absC > .05) { cx.shadowColor = S.cur > 0 ? '#00e87a' : '#ff4040'; cx.shadowBlur = 8 * absC; }
  const ga1 = (-90 - 60) * Math.PI / 180;
  const ga2 = (-90 + 60) * Math.PI / 180;
  cx.beginPath(); cx.moveTo(cr, ccy - ry);
  cx.bezierCurveTo(cr + 30*sc, ccy - ry, gx - gr*.9, gy - gr*.9,
                   gx + gr * Math.cos(ga1), gy + gr * Math.sin(ga1));
  cx.stroke();
  cx.beginPath(); cx.moveTo(cr, ccy + ry);
  cx.bezierCurveTo(cr + 30*sc, ccy + ry, gx - gr*.9, gy + gr*.9,
                   gx + gr * Math.cos(ga2), gy + gr * Math.sin(ga2));
  cx.stroke();
  cx.restore();

  if (absC > .12) {
    for (let i = 0; i < 3; i++) {
      let t = ((i / 3) + S.phase * .65 * Math.sign(S.cur)) % 1;
      if (t < 0) t += 1;
      const px = cr + t * (gx - gr - cr);
      const py = ccy - ry + t * (gy - ry * .5 - ccy + ry);
      cx.save();
      cx.globalAlpha = absC * (.5 + Math.sin(t * Math.PI) * .5);
      cx.fillStyle   = S.cur > 0 ? '#00e87a' : '#ff4040';
      cx.shadowColor = cx.fillStyle; cx.shadowBlur = 7;
      cx.beginPath(); cx.arc(px, py, 2.5 * sc, 0, Math.PI * 2); cx.fill(); cx.restore();
    }
  }
}

function drawGalvanometer(g) {
  const { gx, gy, gr, sc } = g;
  const absC = Math.abs(S.cur);
  cx.save();

  const bg = cx.createRadialGradient(gx, gy - gr * .15, gr * .05, gx, gy, gr * 1.05);
  bg.addColorStop(0, '#0c1e30'); bg.addColorStop(1, '#040c18');
  cx.fillStyle = bg;
  cx.beginPath(); cx.arc(gx, gy, gr, 0, Math.PI * 2); cx.fill();
  cx.strokeStyle = '#162540'; cx.lineWidth = 2.5; cx.stroke();

  if (absC > .1) {
    cx.save();
    cx.shadowColor = S.cur > 0 ? '#00e87a' : '#ff4040'; cx.shadowBlur = 20 * absC;
    cx.strokeStyle = S.cur > 0 ? `rgba(0,232,122,${absC * .35})` : `rgba(255,64,64,${absC * .35})`;
    cx.lineWidth = 3; cx.beginPath(); cx.arc(gx, gy, gr, 0, Math.PI * 2); cx.stroke(); cx.restore();
  }

  cx.strokeStyle = '#0c2038'; cx.lineWidth = 4;
  cx.beginPath(); cx.arc(gx, gy, gr * .91, 0, Math.PI * 2); cx.stroke();

  const arcS = (-90 - 68) * Math.PI / 180;
  const arcE = (-90 + 68) * Math.PI / 180;
  cx.strokeStyle = 'rgba(80,140,220,.2)'; cx.lineWidth = 1;
  cx.beginPath(); cx.arc(gx, gy, gr * .8, arcS, arcE); cx.stroke();

  for (let deg = -60; deg <= 60; deg += 10) {
    const rad = (deg - 90) * Math.PI / 180;
    const maj = deg % 30 === 0;
    const r1  = gr * .80, r2 = gr * (maj ? .67 : .73);
    cx.strokeStyle = maj ? 'rgba(160,200,255,.55)' : 'rgba(80,130,200,.28)';
    cx.lineWidth   = maj ? 1.4 : .7;
    cx.beginPath();
    cx.moveTo(gx + r1 * Math.cos(rad), gy + r1 * Math.sin(rad));
    cx.lineTo(gx + r2 * Math.cos(rad), gy + r2 * Math.sin(rad));
    cx.stroke();
    if (maj) {
      const lr = gr * .54;
      cx.font        = `600 ${Math.max(8, 9 * sc + 4)}px Rajdhani,sans-serif`;
      cx.fillStyle   = deg < 0 ? '#e05050' : deg > 0 ? '#00c868' : 'rgba(150,200,255,.65)';
      cx.textAlign   = 'center'; cx.textBaseline = 'middle';
      cx.fillText(deg < 0 ? '–' : deg > 0 ? '+' : '0',
                  gx + lr * Math.cos(rad), gy + lr * Math.sin(rad));
    }
  }

  cx.strokeStyle = 'rgba(100,160,220,.2)'; cx.lineWidth = .8; cx.setLineDash([2, 3]);
  ln(gx, gy - gr * .82, gx, gy - gr * .3);
  cx.setLineDash([]);

  cx.font = `600 ${Math.max(8, 9 * sc + 5)}px Rajdhani,sans-serif`;
  cx.fillStyle = 'rgba(80,140,200,.45)'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.fillText('μА', gx, gy + gr * .28);
  cx.font = `700 ${Math.max(11, 13 * sc + 4)}px Orbitron,monospace`;
  cx.fillStyle = 'rgba(255,170,0,.65)';
  cx.fillText('G', gx, gy + gr * .62);

  const maxA   = 68 * Math.PI / 180;
  const nAngle = -Math.PI / 2 + S.cur * maxA;
  const nLen   = gr * .75;
  const nx2    = gx + nLen * Math.cos(nAngle);
  const ny2    = gy + nLen * Math.sin(nAngle);

  if (absC > .04) { cx.shadowColor = S.cur > 0 ? '#00e87a' : '#ff4040'; cx.shadowBlur = 16 * absC; }
  cx.strokeStyle = absC > .04
    ? (S.cur > 0 ? `rgba(0,232,122,${.65 + absC * .35})` : `rgba(255,64,64,${.65 + absC * .35})`)
    : 'rgba(140,190,235,.75)';
  cx.lineWidth = 2 * sc; cx.lineCap = 'round';
  cx.beginPath(); cx.moveTo(gx, gy); cx.lineTo(nx2, ny2); cx.stroke();
  cx.shadowBlur = 0;

  cx.globalAlpha = .35; cx.lineWidth = 3 * sc; cx.strokeStyle = '#506070';
  cx.beginPath();
  cx.moveTo(gx, gy);
  cx.lineTo(gx - (nx2 - gx) * .18, gy - (ny2 - gy) * .18);
  cx.stroke(); cx.globalAlpha = 1;

  cx.fillStyle = '#b0c8e0'; cx.strokeStyle = '#040c18'; cx.lineWidth = 1;
  cx.beginPath(); cx.arc(gx, gy, 4 * sc, 0, Math.PI * 2); cx.fill(); cx.stroke();

  const tR2 = gr * .87;
  cx.font = `700 ${Math.max(10, 11 * sc + 5)}px Rajdhani,sans-serif`;
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.fillStyle = '#e05050';
  cx.fillText('–', gx + tR2 * Math.cos(arcS + .14), gy + tR2 * Math.sin(arcS + .14));
  cx.fillStyle = '#00c868';
  cx.fillText('+', gx + tR2 * Math.cos(arcE - .14), gy + tR2 * Math.sin(arcE - .14));

  cx.globalAlpha = .4;
  cx.font = `600 ${Math.max(8, 9 * sc + 4)}px Rajdhani,sans-serif`;
  cx.fillStyle = '#7aaccc'; cx.textAlign = 'center';
  cx.fillText('Гальванометр', gx, gy + gr + 13 * sc);
  cx.globalAlpha = 1; cx.restore();
}

function updateUI() {
  document.getElementById('vI').textContent = S.cur.toFixed(3);

  const d    = document.getElementById('vD');
  const absC = Math.abs(S.cur);
  if (absC < .04) {
    d.textContent = '—';
    d.className   = 'result-value';
  } else if (S.cur > 0) {
    d.textContent = '⟶  +';
    d.className   = 'result-value positive';
  } else {
    d.textContent = '⟵  –';
    d.className   = 'result-value negative';
  }
}

function frame(ts) {
  const dt = Math.min((ts - (S.lastTs || ts)) / 1000, .05);
  S.lastTs = ts;
  S.phase += dt;

  if (!S.isDrag) autoStep(dt);
  phys(dt);

  const g = G();
  drawBg(g);
  drawFieldLines(g);
  drawCoilBack(g);
  drawMagnet(g);
  drawCoilFront(g);
  drawWires(g);
  drawGalvanometer(g);
  updateUI();

  requestAnimationFrame(frame);
}

function hitMagnet(mx, my) {
  const g = G();
  return Math.abs(mx - g.mx) < g.mw / 2 + 18 && Math.abs(my - g.my) < g.mh / 2 + 18;
}

function startDrag(cx2, cy2) {
  const r  = cv.getBoundingClientRect();
  const mx = (cx2 - r.left) * (W / r.width);
  const my = (cy2 - r.top)  * (H / r.height);
  if (hitMagnet(mx, my)) {
    S.isDrag  = true;
    S.running = false;
    const btn = document.getElementById('launchBtn');
    btn.className = 'btn-start';
    document.getElementById('launchIcon').textContent = '▶';
    document.getElementById('launchTxt').textContent  = 'Запустить';
    document.getElementById('hint').textContent       = 'Нажмите «Запустить» или перетащите магнит рукой';
    S.dragClientX = cx2;
    S.dragNx      = S.nx;
  }
}

function moveDrag(cx2) {
  if (!S.isDrag) return;
  const g  = G();
  const dx = (cx2 - S.dragClientX) * S.spd;
  S.nx = Math.max(-1, Math.min(.9, S.dragNx + dx / (g.mRange * .54)));
}

cv.addEventListener('mousedown',  e => startDrag(e.clientX, e.clientY));
cv.addEventListener('mousemove',  e => moveDrag(e.clientX));
cv.addEventListener('mouseup',    () => { S.isDrag = false; });
cv.addEventListener('mouseleave', () => { S.isDrag = false; });

cv.addEventListener('touchstart', e => {
  e.preventDefault();
  startDrag(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

cv.addEventListener('touchmove', e => {
  e.preventDefault();
  moveDrag(e.touches[0].clientX);
}, { passive: false });

cv.addEventListener('touchend', () => { S.isDrag = false; });

resize();
requestAnimationFrame(frame);
