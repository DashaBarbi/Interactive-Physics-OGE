const S = {
  els: [],
  wires: [],
  nid: 1,
  tool: "wire",
  placing: null,
  wstart: null,
  sel: null,
  results: {},
  drag: null,
};

const SVG = document.getElementById("csvg");
const WL = document.getElementById("wires-layer");
const EL = document.getElementById("els-layer");
const WP = document.getElementById("wire-prev");
const SBAR = document.getElementById("sbar");

const NAMES = {
  battery: "Батарея",
  resistor: "Резистор",
  lamp: "Лампа",
  switch: "Ключ",
  ammeter: "Амперметр",
  voltmeter: "Вольтметр",
};

const COLORS = {
  battery: "#4fc3f7",
  resistor: "#81c784",
  lamp: "#ffb74d",
  switch: "#f48fb1",
  ammeter: "#ce93d8",
  voltmeter: "#80cbc4",
};

function getElementScale() {
  var width = SVG.clientWidth || 800;
  if (width <= 400) return 0.5;
  if (width <= 600) return 0.65;
  if (width <= 768) return 0.75;
  return 1.0;
}

function uid(p = "e") {
  return p + S.nid++;
}

function defParams(t) {
  return (
    {
      battery: { V: 9 },
      resistor: { R: 100 },
      lamp: { R: 60 },
      switch: { closed: true },
      ammeter: { R: 0.01 },
      voltmeter: { R: 1e6 },
    }[t] || {}
  );
}

function terms(el) {
  return [
    { x: el.x - 52, y: el.y },
    { x: el.x + 52, y: el.y },
  ];
}

function setS(msg) {
  if (SBAR) SBAR.textContent = msg;
}

function svgEl(tag, attrs) {
  const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

function svgTxt(txt, attrs) {
  const e = svgEl("text", attrs);
  e.textContent = txt;
  return e;
}

function renderEl(el) {
  var scale = getElementScale();
  var g = svgEl("g", {
    id: "el-" + el.id,
    "data-id": el.id,
    transform: `translate(${el.x},${el.y}) scale(${scale})`,
    class: "el-group",
  });

  var c = COLORS[el.type] || "#aaa";
  var res = S.results[el.id];
  var isSelected = S.sel === el.id;

  if (isSelected) {
    g.appendChild(
      svgEl("rect", {
        x: -56,
        y: -22,
        width: 112,
        height: 44,
        rx: 10,
        fill: "none",
        stroke: "#ff6b35",
        "stroke-width": 2,
        "stroke-dasharray": "4 2",
      }),
    );
  }

  g.appendChild(
    svgEl("line", {
      x1: -52,
      y1: 0,
      x2: -30,
      y2: 0,
      stroke: c,
      "stroke-width": 2.5,
    }),
  );
  g.appendChild(
    svgEl("line", {
      x1: 30,
      y1: 0,
      x2: 52,
      y2: 0,
      stroke: c,
      "stroke-width": 2.5,
    }),
  );

  switch (el.type) {
    case "battery":
      drawBat(g, el, c);
      break;
    case "resistor":
      drawRes(g, el, c);
      break;
    case "lamp":
      drawLamp(g, el, c, res);
      break;
    case "switch":
      drawSw(g, el, c);
      break;
    case "ammeter":
      drawMeter(g, el, c, "A");
      break;
    case "voltmeter":
      drawMeter(g, el, c, "V");
      break;
  }

  var lbl =
    el.type === "battery"
      ? `ЭДС ${el.params.V}В`
      : el.type === "resistor" || el.type === "lamp"
        ? `R=${el.params.R}Ом`
        : el.type === "switch"
          ? el.params.closed
            ? "Замкнут"
            : "Разомкнут"
          : NAMES[el.type];
  g.appendChild(
    svgTxt(lbl, {
      x: 0,
      y: -24,
      "text-anchor": "middle",
      "font-size": 11,
      fill: "rgba(200,220,255,.75)",
      "font-family": "Exo 2,sans-serif",
    }),
  );

  if (res) {
    var rstr = `U=${res.V.toFixed(2)}В  I=${res.I.toFixed(3)}А`;
    g.appendChild(
      svgTxt(rstr, {
        x: 0,
        y: 28,
        "text-anchor": "middle",
        "font-size": 10,
        fill: "#4fc3f7",
        "font-family": "Roboto Mono,monospace",
      }),
    );
  }

  terms(el).forEach((t, i) => {
    var dot = svgEl("circle", {
      cx: t.x - el.x,
      cy: 0,
      r: 5.5,
      fill: i === 0 ? "#ef5350" : "#66bb6a",
      stroke: "#111",
      "stroke-width": 1.5,
      class: "term",
      "data-el": el.id,
      "data-ti": i,
    });
    dot.addEventListener("mousedown", onTermClick);
    g.appendChild(dot);
  });

  g.addEventListener("mousedown", onElMouseDown);
  return g;
}

function drawBat(g, el, c) {
  g.appendChild(
    svgEl("line", {
      x1: -30,
      y1: 0,
      x2: -16,
      y2: 0,
      stroke: c,
      "stroke-width": 2,
    }),
  );
  g.appendChild(
    svgEl("line", {
      x1: 16,
      y1: 0,
      x2: 30,
      y2: 0,
      stroke: c,
      "stroke-width": 2,
    }),
  );
  [-14, 2].forEach((ox) => {
    g.appendChild(
      svgEl("line", {
        x1: ox,
        y1: -13,
        x2: ox,
        y2: 13,
        stroke: c,
        "stroke-width": 4,
      }),
    );
    g.appendChild(
      svgEl("line", {
        x1: ox + 7,
        y1: -7,
        x2: ox + 7,
        y2: 7,
        stroke: c,
        "stroke-width": 2,
      }),
    );
  });
  g.appendChild(
    svgTxt("+", {
      x: -24,
      y: -15,
      "font-size": 10,
      fill: c,
      "text-anchor": "middle",
    }),
  );
}

function drawRes(g, el, c) {
  g.appendChild(
    svgEl("rect", {
      x: -28,
      y: -10,
      width: 56,
      height: 20,
      rx: 3,
      fill: "rgba(129,199,132,.1)",
      stroke: c,
      "stroke-width": 2,
    }),
  );
  g.appendChild(
    svgEl("polyline", {
      points: "-28,0 -20,-7 -11,7 -3,-7 5,7 13,-7 22,7 28,0",
      fill: "none",
      stroke: c,
      "stroke-width": 1.5,
      opacity: 0.8,
    }),
  );
}

function drawLamp(g, el, c, res) {
  const on = res && Math.abs(res.I) > 0.001;
  const fc = on ? "#ffcc00" : c;
  const fill = on ? "rgba(255,220,0,.15)" : "rgba(255,183,77,.06)";
  const circ = svgEl("circle", {
    cx: 0,
    cy: 0,
    r: 18,
    fill,
    stroke: fc,
    "stroke-width": 2,
  });
  if (on) circ.classList.add("lamp-lit");
  g.appendChild(circ);
  g.appendChild(
    svgEl("line", {
      x1: -11,
      y1: -11,
      x2: 11,
      y2: 11,
      stroke: fc,
      "stroke-width": 2,
    }),
  );
  g.appendChild(
    svgEl("line", {
      x1: 11,
      y1: -11,
      x2: -11,
      y2: 11,
      stroke: fc,
      "stroke-width": 2,
    }),
  );
  g.appendChild(
    svgEl("line", {
      x1: -30,
      y1: 0,
      x2: -18,
      y2: 0,
      stroke: fc,
      "stroke-width": 2,
    }),
  );
  g.appendChild(
    svgEl("line", {
      x1: 18,
      y1: 0,
      x2: 30,
      y2: 0,
      stroke: fc,
      "stroke-width": 2,
    }),
  );
}

function drawSw(g, el, c) {
  g.appendChild(svgEl("circle", { cx: -20, cy: 0, r: 4, fill: c }));
  g.appendChild(svgEl("circle", { cx: 20, cy: 0, r: 4, fill: c }));
  if (el.params.closed) {
    g.appendChild(
      svgEl("line", {
        x1: -20,
        y1: 0,
        x2: 20,
        y2: 0,
        stroke: c,
        "stroke-width": 2.5,
      }),
    );
  } else {
    g.appendChild(
      svgEl("line", {
        x1: -20,
        y1: 0,
        x2: 12,
        y2: -18,
        stroke: c,
        "stroke-width": 2.5,
      }),
    );
  }
}

function drawMeter(g, el, c, letter) {
  g.appendChild(
    svgEl("circle", {
      cx: 0,
      cy: 0,
      r: 18,
      fill: "rgba(0,0,0,.3)",
      stroke: c,
      "stroke-width": 2,
    }),
  );
  g.appendChild(
    svgTxt(letter, {
      x: 0,
      y: 5,
      "text-anchor": "middle",
      "font-size": 14,
      "font-weight": "bold",
      fill: c,
      "font-family": "Exo 2,sans-serif",
    }),
  );
  g.appendChild(
    svgEl("line", {
      x1: -30,
      y1: 0,
      x2: -18,
      y2: 0,
      stroke: c,
      "stroke-width": 2,
    }),
  );
  g.appendChild(
    svgEl("line", {
      x1: 18,
      y1: 0,
      x2: 30,
      y2: 0,
      stroke: c,
      "stroke-width": 2,
    }),
  );
}

function wirePath(a, b) {
  if (Math.abs(a.y - b.y) < 3) return `M${a.x},${a.y}L${b.x},${b.y}`;
  const mx = (a.x + b.x) / 2;
  return `M${a.x},${a.y}L${mx},${a.y}L${mx},${b.y}L${b.x},${b.y}`;
}

function renderWire(w) {
  const fe = S.els.find((e) => e.id === w.from.eid);
  const te = S.els.find((e) => e.id === w.to.eid);
  if (!fe || !te) return null;

  const ft = terms(fe)[w.from.ti];
  const tt = terms(te)[w.to.ti];
  const d = wirePath(ft, tt);
  const res = S.results["w" + w.id];
  const hasFlow = res && Math.abs(res.I) > 0.001;

  const g = svgEl("g", {
    id: "wire-" + w.id,
    "data-wid": w.id,
    class: "wire-g",
  });
  const hit = svgEl("path", {
    d,
    stroke: "transparent",
    "stroke-width": 12,
    fill: "none",
  });
  const base = svgEl("path", {
    d,
    stroke: hasFlow ? "#69f0ae" : "#37474f",
    "stroke-width": hasFlow ? 2.5 : 2,
    fill: "none",
  });

  g.appendChild(hit);
  g.appendChild(base);

  if (hasFlow) {
    const flow = svgEl("path", {
      d,
      stroke: "#b9f6ca",
      "stroke-width": 2,
      fill: "none",
      class: "flowing",
    });
    flow.style.animationDirection = (res.I || 0) >= 0 ? "normal" : "reverse";
    g.appendChild(flow);
  }

  g.addEventListener("click", (e) => {
    if (S.tool === "delete") {
      deleteWire(w.id);
      e.stopPropagation();
    }
  });
  g.addEventListener("mouseover", () =>
    base.setAttribute("stroke", hasFlow ? "#a5d6a7" : "#607d8b"),
  );
  g.addEventListener("mouseout", () =>
    base.setAttribute("stroke", hasFlow ? "#69f0ae" : "#37474f"),
  );

  return g;
}

function render() {
  WL.innerHTML = "";
  EL.innerHTML = "";
  S.wires.forEach((w) => {
    const g = renderWire(w);
    if (g) WL.appendChild(g);
  });
  S.els.forEach((el) => EL.appendChild(renderEl(el)));
}

function onTermClick(e) {
  e.stopPropagation();
  if (S.tool !== "wire") return;

  const eid = e.currentTarget.getAttribute("data-el");
  const ti = parseInt(e.currentTarget.getAttribute("data-ti"));
  const el = S.els.find((x) => x.id === eid);
  const t = terms(el)[ti];

  if (S.wstart) {
    if (eid === S.wstart.eid && ti === S.wstart.ti) {
      S.wstart = null;
      WP.innerHTML = "";
      return;
    }
    const dup = S.wires.find(
      (w) =>
        (w.from.eid === S.wstart.eid &&
          w.from.ti === S.wstart.ti &&
          w.to.eid === eid &&
          w.to.ti === ti) ||
        (w.from.eid === eid &&
          w.from.ti === ti &&
          w.to.eid === S.wstart.eid &&
          w.to.ti === S.wstart.ti),
    );
    if (!dup) {
      S.wires.push({
        id: uid("w"),
        from: { eid: S.wstart.eid, ti: S.wstart.ti },
        to: { eid, ti },
      });
      S.results = {};
    }
    S.wstart = null;
    WP.innerHTML = "";
    render();
  } else {
    S.wstart = { eid, ti, x: t.x, y: t.y };
  }
}

let drag = null;

function onElMouseDown(e) {
  if (e.target.classList.contains("term")) return;
  e.stopPropagation();

  const id = e.currentTarget.getAttribute("data-id");
  if (S.tool === "delete") {
    deleteEl(id);
    return;
  }
  if (S.tool === "wire") {
    selEl(id);
    return;
  }

  selEl(id);
  const el = S.els.find((x) => x.id === id);
  drag = { id, ox: el.x, oy: el.y, mx: e.clientX, my: e.clientY };
}

function onMouseMove(e) {
  if (drag) {
    const el = S.els.find((x) => x.id === drag.id);
    if (el) {
      const nx = drag.ox + (e.clientX - drag.mx);
      const ny = drag.oy + (e.clientY - drag.my);
      el.x = Math.max(
        60,
        Math.min(SVG.clientWidth - 60, Math.round(nx / 40) * 40),
      );
      el.y = Math.max(
        28,
        Math.min(SVG.clientHeight - 28, Math.round(ny / 40) * 40),
      );
      render();
    }
  }

  if (S.wstart) {
    const r = SVG.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    WP.innerHTML = "";
    const pv = svgEl("path", {
      d: wirePath(S.wstart, { x: mx, y: my }),
      stroke: "#ff6b35",
      "stroke-width": 2,
      "stroke-dasharray": "7 3",
      fill: "none",
    });
    WP.appendChild(pv);
  }
}

function onMouseUp() {
  drag = null;
}

SVG.addEventListener("mousemove", onMouseMove);
document.addEventListener("mousemove", onMouseMove);
document.addEventListener("mouseup", onMouseUp);

SVG.addEventListener("click", (e) => {
  const onCanvas =
    e.target === SVG ||
    e.target.tagName === "rect" ||
    e.target.tagName === "pattern";
  if (S.placing && onCanvas) {
    const r = SVG.getBoundingClientRect();
    const x = Math.max(
      60,
      Math.min(
        SVG.clientWidth - 60,
        Math.round((e.clientX - r.left) / 40) * 40,
      ),
    );
    const y = Math.max(
      28,
      Math.min(
        SVG.clientHeight - 28,
        Math.round((e.clientY - r.top) / 40) * 40,
      ),
    );
    const el = {
      id: uid("e"),
      type: S.placing,
      x,
      y,
      params: defParams(S.placing),
    };
    S.els.push(el);
    S.results = {};
    selEl(el.id);
    render();
  }
  if (!S.placing && onCanvas && S.wstart) {
    S.wstart = null;
    WP.innerHTML = "";
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    S.placing = null;
    S.wstart = null;
    WP.innerHTML = "";
    document
      .querySelectorAll(".elib-btn")
      .forEach((b) => b.classList.remove("active"));
  }
  if (e.key === "Delete" && S.sel) deleteEl(S.sel);
});

document.querySelectorAll(".elib-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const t = btn.getAttribute("data-type");
    document
      .querySelectorAll(".elib-btn")
      .forEach((b) => b.classList.remove("active"));
    if (S.placing === t) {
      S.placing = null;
    } else {
      S.placing = t;
      btn.classList.add("active");
      S.wstart = null;
      WP.innerHTML = "";
    }
  });
});

document.querySelectorAll("[data-tool]").forEach((btn) => {
  btn.addEventListener("click", () => {
    S.tool = btn.getAttribute("data-tool");
    S.placing = null;
    S.wstart = null;
    WP.innerHTML = "";
    document
      .querySelectorAll("[data-tool]")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".elib-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

function selEl(id) {
  S.sel = id;
  const el = S.els.find((e) => e.id === id);
  const pr = document.getElementById("params-row");
  if (!el) {
    pr.style.display = "none";
    return;
  }

  pr.style.display = "flex";
  document.getElementById("pg-R").style.display =
    el.type === "resistor" || el.type === "lamp" ? "flex" : "none";
  document.getElementById("pg-V").style.display =
    el.type === "battery" ? "flex" : "none";
  document.getElementById("pg-sw").style.display =
    el.type === "switch" ? "flex" : "none";
  document.getElementById("pg-name").style.display = "flex";
  document.getElementById("pv-name").textContent = NAMES[el.type];

  if (el.type === "resistor" || el.type === "lamp") {
    document.getElementById("sl-R").value = el.params.R;
    document.getElementById("pv-R").textContent = el.params.R + " Ом";
  }
  if (el.type === "battery") {
    document.getElementById("sl-V").value = el.params.V;
    document.getElementById("pv-V").textContent = el.params.V + " В";
  }
  if (el.type === "switch") {
    const b = document.getElementById("sw-toggle");
    b.textContent = el.params.closed ? " Замкнут" : " Разомкнут";
    b.className = "sw-btn" + (el.params.closed ? "" : " open");
  }
  render();
}

document.getElementById("sl-R").addEventListener("input", (e) => {
  const el = S.els.find((x) => x.id === S.sel);
  if (el) {
    el.params.R = +e.target.value;
    document.getElementById("pv-R").textContent = el.params.R + " Ом";
    S.results = {};
    render();
  }
});

document.getElementById("sl-V").addEventListener("input", (e) => {
  const el = S.els.find((x) => x.id === S.sel);
  if (el) {
    el.params.V = +e.target.value;
    document.getElementById("pv-V").textContent = el.params.V + " В";
    S.results = {};
    render();
  }
});

document.getElementById("sw-toggle").addEventListener("click", () => {
  const el = S.els.find((x) => x.id === S.sel);
  if (el && el.type === "switch") {
    el.params.closed = !el.params.closed;
    S.results = {};
    selEl(el.id);
    render();
  }
});

function deleteEl(id) {
  S.els = S.els.filter((e) => e.id !== id);
  S.wires = S.wires.filter((w) => w.from.eid !== id && w.to.eid !== id);
  if (S.sel === id) {
    S.sel = null;
    document.getElementById("params-row").style.display = "none";
  }
  S.results = {};
  render();
  updateTable();
}

function deleteWire(id) {
  S.wires = S.wires.filter((w) => w.id !== id);
  S.results = {};
  render();
  updateTable();
}

function gauss(A, b) {
  const n = A.length;
  const M = A.map((r, i) => [...r, b[i]]);

  for (let c = 0; c < n; c++) {
    let mx = c;
    for (let r = c + 1; r < n; r++)
      if (Math.abs(M[r][c]) > Math.abs(M[mx][c])) mx = r;
    [M[c], M[mx]] = [M[mx], M[c]];
    if (Math.abs(M[c][c]) < 1e-14) return null;

    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }

  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = M[i][n];
    for (let j = i + 1; j < n; j++) x[i] -= M[i][j] * x[j];
    x[i] /= M[i][i];
  }
  return x;
}

function simulate() {
  S.results = {};

  if (!S.els.length) {
    updateTable();
    return;
  }

  const uf = {};
  S.els.forEach((el) =>
    [0, 1].forEach((ti) => (uf[`${el.id}_${ti}`] = `${el.id}_${ti}`)),
  );
  function find(k) {
    return uf[k] === k ? k : (uf[k] = find(uf[k]));
  }
  function union(a, b) {
    uf[find(a)] = find(b);
  }
  S.wires.forEach((w) =>
    union(`${w.from.eid}_${w.from.ti}`, `${w.to.eid}_${w.to.ti}`),
  );

  const nset = new Set(
    S.els.flatMap((el) => [0, 1].map((ti) => find(`${el.id}_${ti}`))),
  );
  if (nset.size < 2) {
    updateTable();
    return;
  }

  const bat = S.els.find((e) => e.type === "battery");
  if (!bat) {
    updateTable();
    return;
  }

  const gnd = find(`${bat.id}_1`);
  const nm = {};
  let nc = 0;
  nset.forEach((n) => {
    nm[n] = n === gnd ? 0 : ++nc;
  });

  const bats = S.els.filter((e) => e.type === "battery");
  const sz = nc + bats.length;
  if (sz === 0) {
    updateTable();
    return;
  }

  const G = Array.from({ length: sz }, () => new Array(sz).fill(0));
  const rhs = new Array(sz).fill(0);

  function nodeOf(eid, ti) {
    return nm[find(`${eid}_${ti}`)] ?? 0;
  }

  function stamp(n1, n2, g) {
    if (n1 > 0) G[n1 - 1][n1 - 1] += g;
    if (n2 > 0) G[n2 - 1][n2 - 1] += g;
    if (n1 > 0 && n2 > 0) {
      G[n1 - 1][n2 - 1] -= g;
      G[n2 - 1][n1 - 1] -= g;
    }
  }

  let vi = 0;
  S.els.forEach((el) => {
    const n1 = nodeOf(el.id, 0);
    const n2 = nodeOf(el.id, 1);
    if (n1 === n2) return;

    switch (el.type) {
      case "battery": {
        const r = nc + vi;
        if (n1 > 0) {
          G[r][n1 - 1] += 1;
          G[n1 - 1][r] += 1;
        }
        if (n2 > 0) {
          G[r][n2 - 1] -= 1;
          G[n2 - 1][r] -= 1;
        }
        rhs[r] = el.params.V;
        vi++;
        break;
      }
      case "resistor":
      case "lamp":
        stamp(n1, n2, 1 / el.params.R);
        break;
      case "switch":
        if (el.params.closed) stamp(n1, n2, 1 / 0.01);
        break;
      case "ammeter":
        stamp(n1, n2, 1 / 0.01);
        break;
      case "voltmeter":
        stamp(n1, n2, 1 / 1e6);
        break;
    }
  });

  const sol = gauss(G, rhs);
  if (!sol) {
    updateTable();
    return;
  }

  const nv = new Array(nc + 1).fill(0);
  for (let i = 0; i < nc; i++) nv[i + 1] = sol[i];

  vi = 0;
  S.els.forEach((el) => {
    const n1 = nodeOf(el.id, 0);
    const n2 = nodeOf(el.id, 1);
    const Vel = (nv[n1] || 0) - (nv[n2] || 0);
    let I = 0;

    switch (el.type) {
      case "battery":
        I = sol[nc + vi];
        vi++;
        break;
      case "resistor":
      case "lamp":
        I = Vel / el.params.R;
        break;
      case "switch":
        I = el.params.closed ? Vel / 0.01 : 0;
        break;
      case "ammeter":
        I = Vel / 0.01;
        break;
      case "voltmeter":
        I = Vel / 1e6;
        break;
    }

    S.results[el.id] = { V: Math.abs(Vel), I: Math.abs(I), Vraw: Vel, Iraw: I };
  });

  render();
  updateTable();
}

function updateTable() {
  const tb = document.getElementById("rtbody");
  if (!tb) return;

  const keys = Object.keys(S.results).filter((k) => !k.startsWith("w"));

  if (!keys.length) {
    tb.innerHTML =
      '<tr><td colspan="7" class="nodata">Запустите симуляцию для отображения результатов</td></tr>';
    return;
  }

  let html = "";
  S.els.forEach((el, i) => {
    const r = S.results[el.id];
    if (!r) return;

    const V = r.V.toFixed(3);
    const I = r.I.toFixed(4);
    const P = (r.V * r.I).toFixed(3);

    const param =
      el.type === "battery"
        ? `ЭДС=${el.params.V}В`
        : el.type === "resistor" || el.type === "lamp"
          ? `R=${el.params.R}Ом`
          : "—";

    let state = "—";
    if (el.type === "lamp") state = r.I > 0.05 ? " Горит" : " Не горит";
    else if (el.type === "switch")
      state = el.params.closed ? " Замкнут" : " Разомкнут";
    else if (el.type === "ammeter") state = `${r.I.toFixed(3)} А`;
    else if (el.type === "voltmeter") state = `${r.V.toFixed(3)} В`;
    else if (el.type === "battery") state = `I = ${r.I.toFixed(3)} А`;

    html += `<tr>
      <td style="font-weight:700;color:#000000">${i + 1}</td>
      <td style="font-weight:700;color:#000000">${NAMES[el.type]}</td>
      <td style="font-size:.78rem;color:#000000">${param}</td>
      <td style="font-family:'Roboto Mono',monospace;color:#000000;font-weight:700">${V}</td>
      <td style="font-family:'Roboto Mono',monospace;color:#000000;font-weight:700">${I}</td>
      <td style="font-family:'Roboto Mono',monospace;color:#000000;font-weight:700">${P}</td>
      <td style="color:#000000">${state}</td>
    </tr>`;
  });

  tb.innerHTML =
    html || '<tr><td colspan="7" class="nodata">Нет данных</td></tr>';
}

document.getElementById("btn-sim").addEventListener("click", simulate);

document.getElementById("btn-reset").addEventListener("click", () => {
  S.els = [];
  S.wires = [];
  S.results = {};
  S.sel = null;
  S.wstart = null;
  S.placing = null;
  S.drag = null;
  WP.innerHTML = "";
  document
    .querySelectorAll(".elib-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById("params-row").style.display = "none";
  render();
  updateTable();
});

document.getElementById("btn-demo").addEventListener("click", () => {
  S.els = [];
  S.wires = [];
  S.results = {};
  S.sel = null;
  S.wstart = null;
  S.placing = null;
  document.getElementById("params-row").style.display = "none";

  const W = SVG.clientWidth || 800;
  const H = SVG.clientHeight || 370;
  const cx = Math.round(W / 2 / 40) * 40;
  const cy = Math.round(H / 2 / 40) * 40;

  S.els.push(
    {
      id: "e1",
      type: "battery",
      x: Math.round((W * 0.15) / 40) * 40,
      y: cy,
      params: { V: 9 },
    },
    {
      id: "e2",
      type: "resistor",
      x: cx,
      y: Math.round((H * 0.28) / 40) * 40,
      params: { R: 100 },
    },
    {
      id: "e3",
      type: "lamp",
      x: Math.round((W * 0.82) / 40) * 40,
      y: cy,
      params: { R: 60 },
    },
    {
      id: "e4",
      type: "switch",
      x: cx,
      y: Math.round((H * 0.72) / 40) * 40,
      params: { closed: true },
    },
    {
      id: "e5",
      type: "ammeter",
      x: Math.round((W * 0.82) / 40) * 40,
      y: Math.round((H * 0.28) / 40) * 40,
      params: { R: 0.01 },
    },
  );

  S.wires = [
    { id: "w1", from: { eid: "e1", ti: 1 }, to: { eid: "e2", ti: 0 } },
    { id: "w2", from: { eid: "e2", ti: 1 }, to: { eid: "e5", ti: 0 } },
    { id: "w3", from: { eid: "e5", ti: 1 }, to: { eid: "e3", ti: 0 } },
    { id: "w4", from: { eid: "e3", ti: 1 }, to: { eid: "e4", ti: 1 } },
    { id: "w5", from: { eid: "e4", ti: 0 }, to: { eid: "e1", ti: 0 } },
  ];
  S.nid = 20;

  render();
  updateTable();
});

setS("Выберите элемент из библиотеки и кликните на холст для размещения");
