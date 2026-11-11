import { $, $$, reduceMovimiento } from './util.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, padre) => {
  const n = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (padre) padre.appendChild(n);
  return n;
};

const R_FOTO = 112;

/* ───────────── Marco de la foto: corona de trigo ───────────── */
function grad(defs, tipo, id, stops, attrs = {}) {
  const g = el(tipo, { id, ...attrs }, defs);
  stops.forEach(([o, c, op = 1]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op }, g));
}

let capaFoto = null;

/** Espiga de trigo en coordenadas locales: base en (0,0), crece hacia -y. */
function espiga(padre, largo, color) {
  const g = el('g', {}, padre);
  el('path', { d: `M0 0 Q1 ${-largo * 0.5} 0 ${-largo}`, stroke: color.tallo, 'stroke-width': 1.4, fill: 'none', 'stroke-linecap': 'round' }, g);
  const filas = 5;
  for (let i = 0; i < filas; i++) {
    const y = -largo + 4 + i * 5.2;
    const e = 1 - i * 0.04;
    for (const s of [-1, 1]) {
      el('ellipse', { cx: s * 2.6, cy: y, rx: 2.4 * e, ry: 5 * e, transform: `rotate(${s * 24} ${s * 2.6} ${y})`, fill: i % 2 ? color.grano : color.grano2 }, g);
      el('path', { d: `M${s * 3.6} ${y - 4} l${s * 5} -10`, stroke: color.barba, 'stroke-width': 0.6, fill: 'none' }, g);
    }
  }
  el('ellipse', { cx: 0, cy: -largo - 1, rx: 2, ry: 4.6, fill: color.grano2 }, g);
  return g;
}

function florecita(padre, x, y, r = 3.2) {
  const g = el('g', { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` }, padre);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    el('circle', { cx: (Math.cos(a) * r * 0.62).toFixed(2), cy: (Math.sin(a) * r * 0.62).toFixed(2), r: r * 0.5, fill: '#FFFFFF', stroke: '#E8DCC6', 'stroke-width': 0.4 }, g);
  }
  el('circle', { r: r * 0.32, fill: '#F2D28A' }, g);
}

export function construirRoseton(svg) {
  const defs = el('defs', {}, svg);
  grad(defs, 'linearGradient', 'm-oro', [[0, '#F6E2A6'], [0.5, '#D9B062'], [1, '#A97B35']], { x1: 0, y1: 0, x2: 1, y2: 1 });
  grad(defs, 'radialGradient', 'm-halo', [[0, '#FFFBEF', 1], [0.55, '#FFF3D6', 0.85], [1, '#FFF3D6', 0]]);
  grad(defs, 'radialGradient', 'v-fondo-foto', [[0, '#FFFDF7'], [0.7, '#F7E9DA'], [1, '#EFD6CF']], { cx: '.5', cy: '.35', r: '.7' });
  const clipF = el('clipPath', { id: 'v-clip-foto' }, defs);
  el('circle', { r: R_FOTO - 1 }, clipF);

  // Halo de luz suave
  el('circle', { r: 198, fill: 'url(#m-halo)' }, svg);

  // Corona: dos ramas de trigo que suben desde el lazo hasta la hostia
  const corona = el('g', { class: 'corona' }, svg);
  const tonos = [
    { tallo: '#B8914F', grano: '#E2BE72', grano2: '#CFA457', barba: '#C9A869' },
    { tallo: '#A9864A', grano: '#D7B066', grano2: '#C2984E', barba: '#BE9C60' },
  ];
  const RW = R_FOTO + 30;
  for (const s of [1, -1]) {
    // Tallo de la rama
    const pts = [];
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const th = ((180 + s * t * 150) * Math.PI) / 180;
      pts.push(`${(RW * Math.sin(th)).toFixed(1)} ${(-RW * Math.cos(th)).toFixed(1)}`);
    }
    el('path', { d: `M${pts.join(' L')}`, fill: 'none', stroke: '#B8914F', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, corona);

    const n = 11;
    for (let k = 0; k < n; k++) {
      const t = 0.06 + (k / (n - 1)) * 0.9;
      const thg = 180 + s * t * 150;
      const th = (thg * Math.PI) / 180;
      const fuera = k % 2 ? 9 : -6;
      const r = RW + fuera;
      const x = r * Math.sin(th), y = -r * Math.cos(th);
      // Dirección de avance de la rama → rotación de la espiga
      const dx = s * Math.cos(th), dy = s * Math.sin(th);
      const phi = (Math.atan2(dx, -dy) * 180) / Math.PI + (k % 2 ? 22 : -14) * s;
      const largo = 26 + (k % 3) * 4 - t * 6;
      const g = el('g', { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${phi.toFixed(1)})` }, corona);
      espiga(g, largo, tonos[k % 2]);
      // Hojitas y florecitas entre las espigas
      if (k % 2 === 0) {
        const xl = (RW - 2) * Math.sin(th + s * 0.09), yl = -(RW - 2) * Math.cos(th + s * 0.09);
        el('ellipse', { cx: xl.toFixed(1), cy: yl.toFixed(1), rx: 3, ry: 8, fill: '#B9C7A2', transform: `rotate(${(phi + 40 * s).toFixed(1)} ${xl.toFixed(1)} ${yl.toFixed(1)})` }, corona);
      } else {
        florecita(corona, (RW + 1) * Math.sin(th - s * 0.07), -(RW + 1) * Math.cos(th - s * 0.07), 3.4);
      }
    }
  }

  // Racimo de uvas pequeño y lazo blanco abajo
  const abajo = el('g', { transform: `translate(0 ${RW + 4})` }, svg);
  const uvas = el('g', { fill: '#B5A2D6', stroke: '#8E78B8', 'stroke-width': 0.5 }, abajo);
  [[-14, 6], [-8, 6], [-11, 11], [14, 6], [8, 6], [11, 11]].forEach(([x, y]) => el('circle', { cx: x, cy: y, r: 3.2 }, uvas));
  el('path', { d: 'M0 0 C-10 -12 -30 -8 -26 2 C-22 10 -8 6 0 0 Z', fill: '#FFFFFF', stroke: '#E2D5BE', 'stroke-width': 1 }, abajo);
  el('path', { d: 'M0 0 C10 -12 30 -8 26 2 C22 10 8 6 0 0 Z', fill: '#FFFFFF', stroke: '#E2D5BE', 'stroke-width': 1 }, abajo);
  el('path', { d: 'M-2 2 L-12 26 L-6 23 L-3 28 Z M2 2 L12 26 L6 23 L3 28 Z', fill: '#FFFFFF', stroke: '#E2D5BE', 'stroke-width': 1 }, abajo);
  el('circle', { r: 4.2, fill: '#FFFDF7', stroke: '#D9C6A1', 'stroke-width': 1 }, abajo);

  // Hostia dorada con rayos arriba
  const arriba = el('g', { transform: `translate(0 ${-(RW + 14)})` }, svg);
  const rayos = el('g', { stroke: '#E2C27A', 'stroke-width': 1.2, 'stroke-linecap': 'round', class: 'hostia-rayos' }, arriba);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    el('path', { d: `M${(Math.cos(a) * 16).toFixed(1)} ${(Math.sin(a) * 16).toFixed(1)} L${(Math.cos(a) * (i % 2 ? 22 : 26)).toFixed(1)} ${(Math.sin(a) * (i % 2 ? 22 : 26)).toFixed(1)}` }, rayos);
  }
  el('circle', { r: 13, fill: '#FFFDF6', stroke: 'url(#m-oro)', 'stroke-width': 2 }, arriba);
  el('path', { d: 'M0 -7 V7 M-6 -1 H6', stroke: '#B88A3A', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, arriba);

  // Aro dorado con perlas alrededor de la foto
  el('circle', { r: R_FOTO + 9, fill: 'none', stroke: 'url(#m-oro)', 'stroke-width': 7 }, svg);
  el('circle', { r: R_FOTO + 14, fill: 'none', stroke: '#E8CD8E', 'stroke-width': 1 }, svg);
  const perlas = el('g', { fill: '#FFFDF6', stroke: '#E2D3B4', 'stroke-width': 0.5 }, svg);
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    el('circle', { cx: (Math.cos(a) * (R_FOTO + 9)).toFixed(2), cy: (Math.sin(a) * (R_FOTO + 9)).toFixed(2), r: 1.7 }, perlas);
  }

  // Centro: foto o silueta
  el('circle', { r: R_FOTO, fill: '#FFF9EE' }, svg);
  capaFoto = el('g', {}, svg);
  mostrarSilueta();
}

function mostrarSilueta() {
  if (!capaFoto) return;
  capaFoto.replaceChildren();
  const g = el('g', { 'clip-path': 'url(#v-clip-foto)', class: 'foto-aparece' }, capaFoto);
  el('circle', { r: R_FOTO, fill: 'url(#v-fondo-foto)' }, g);
  const s = el('g', { transform: `scale(${(R_FOTO / 80).toFixed(3)})` }, g);
  el('circle', { cx: 0, cy: -16, r: 44, fill: '#FFF3D0', opacity: 0.7 }, s);
  const tono = '#D9BFA0';
  el('path', { d: 'M-62 90 C-58 46 -34 30 0 28 C34 30 58 46 62 90 Z', fill: tono }, s);
  el('path', { d: 'M-34 44 C-40 6 -30 -42 0 -44 C30 -42 40 6 34 44 C22 34 -22 34 -34 44 Z', fill: '#E9D7BD' }, s);
  el('circle', { cx: 0, cy: -10, r: 21, fill: tono }, s);
  el('rect', { x: -7, y: 8, width: 14, height: 18, rx: 6, fill: tono }, s);
  const corona = el('g', { fill: '#F6D9E0', stroke: '#E2B3C1', 'stroke-width': 0.8 }, s);
  for (let i = -3; i <= 3; i++) {
    const a = (i / 3) * 1.05;
    el('circle', { cx: (Math.sin(a) * 22).toFixed(1), cy: (-14 - Math.cos(a) * 18).toFixed(1), r: 3.6 }, corona);
  }
}

let fotoActual = null;
/** Muestra la foto (data URL de Firestore) o el respaldo assets/mariangel.webp, o la silueta. */
export function ponerFoto(dataUrl) {
  const candidata = dataUrl || 'assets/mariangel.webp';
  if (candidata === fotoActual) return;
  fotoActual = candidata;
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    if (fotoActual !== candidata || !capaFoto) return;
    capaFoto.replaceChildren();
    const g = el('g', { 'clip-path': 'url(#v-clip-foto)', class: 'foto-aparece' }, capaFoto);
    el('image', {
      href: candidata, x: -R_FOTO, y: -R_FOTO, width: R_FOTO * 2, height: R_FOTO * 2,
      preserveAspectRatio: 'xMidYMid slice',
    }, g);
    el('circle', { r: R_FOTO, fill: 'none', stroke: 'rgba(255,255,255,.55)', 'stroke-width': 2 }, capaFoto);
  };
  img.onerror = () => { if (fotoActual === candidata) mostrarSilueta(); };
  img.src = candidata;
}

/* ───────────── Partículas de polvo dorado ───────────── */
export function iniciarParticulas(canvas, seccion) {
  if (reduceMovimiento()) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0, visible = false, raf = 0;

  // Sprite de luz pre-renderizado (mucho más barato que gradientes por frame)
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 32;
  const sc = sprite.getContext('2d');
  const rg = sc.createRadialGradient(16, 16, 0, 16, 16, 16);
  rg.addColorStop(0, 'rgba(255,248,220,1)');
  rg.addColorStop(0.25, 'rgba(255,222,150,.75)');
  rg.addColorStop(1, 'rgba(255,214,140,0)');
  sc.fillStyle = rg;
  sc.fillRect(0, 0, 32, 32);

  const N = window.innerWidth < 600 ? 38 : 64;
  const ps = [];
  const nueva = (inicio) => ({
    x: Math.random() * W, y: inicio ? Math.random() * H : H + 10,
    r: 2 + Math.random() * 5.5, v: 6 + Math.random() * 16, fase: Math.random() * 6.28,
    amp: 6 + Math.random() * 14, a: 0.25 + Math.random() * 0.6,
  });

  const medir = () => {
    W = seccion.clientWidth; H = seccion.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  medir();
  for (let i = 0; i < N; i++) ps.push(nueva(true));

  let previo = performance.now();
  const cuadro = (t) => {
    const dt = Math.min((t - previo) / 1000, 0.05);
    previo = t;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (const p of ps) {
      p.y -= p.v * dt;
      p.fase += dt * 0.8;
      if (p.y < -12) Object.assign(p, nueva(false));
      const x = p.x + Math.sin(p.fase) * p.amp;
      ctx.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(p.fase * 1.7));
      ctx.drawImage(sprite, x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    raf = visible ? requestAnimationFrame(cuadro) : 0;
  };

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) { previo = performance.now(); raf = requestAnimationFrame(cuadro); }
  }).observe(seccion);
  new ResizeObserver(medir).observe(seccion);
}

/* ───────────── Parallax: giroscopio con respaldo táctil/ratón ───────────── */
export function iniciarParallax(seccion) {
  if (reduceMovimiento()) return;
  const capas = $$('[data-parallax]', seccion).map((n) => ({ n, k: parseFloat(n.dataset.parallax) || 0 }));
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0, visible = true, usandoGiro = false;
  const clamp = (v) => Math.max(-1, Math.min(1, v));

  const animar = () => {
    x += (tx - x) * 0.08;
    y += (ty - y) * 0.08;
    for (const { n, k } of capas) n.style.transform = `translate3d(${(x * k * 18).toFixed(2)}px, ${(y * k * 14).toFixed(2)}px, 0)`;
    raf = visible && (Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001) ? requestAnimationFrame(animar) : 0;
  };
  const pedir = () => { if (!raf && visible) raf = requestAnimationFrame(animar); };

  let base = null;
  window.addEventListener('deviceorientation', (e) => {
    if (e.gamma == null) return;
    usandoGiro = true;
    if (base == null) base = e.beta;
    tx = clamp(e.gamma / 22);
    ty = clamp((e.beta - base) / 22);
    pedir();
  }, { passive: true });

  // Respaldo: dedo o ratón sobre la sección
  seccion.addEventListener('pointermove', (e) => {
    if (usandoGiro) return;
    const r = seccion.getBoundingClientRect();
    tx = clamp(((e.clientX - r.left) / r.width - 0.5) * 2);
    ty = clamp(((e.clientY - r.top) / r.height - 0.3) * 2);
    pedir();
  }, { passive: true });
  seccion.addEventListener('pointerleave', () => { if (!usandoGiro) { tx = 0; ty = 0; pedir(); } });

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) pedir(); }).observe(seccion);
}

export function iniciarAltar() {
  const seccion = $('#altar');
  construirRoseton($('.roseton', seccion));
  iniciarParticulas($('.particulas', seccion), seccion);
  iniciarParallax(seccion);
}
