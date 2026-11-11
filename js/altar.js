import { $, $$, reduceMovimiento } from './util.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, padre) => {
  const n = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (padre) padre.appendChild(n);
  return n;
};

const PLOMO = '#4A3E31';
const R_FOTO = 80;

/* ───────────── Rosetón ───────────── */
function gradRadial(defs, id, stops) {
  const g = el('radialGradient', { id, cx: '.5', cy: '.45', r: '.6' }, defs);
  stops.forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, g));
}

let capaFoto = null;

export function construirRoseton(svg) {
  const defs = el('defs', {}, svg);
  gradRadial(defs, 'v-azul', [[0, '#E4F0FC'], [0.5, '#7CA6D8'], [1, '#2D5A93']]);
  gradRadial(defs, 'v-rosa', [[0, '#FFEAF0'], [0.5, '#E6A0B5'], [1, '#B05A7A']]);
  gradRadial(defs, 'v-oro', [[0, '#FFF7DD'], [0.5, '#EDCB7C'], [1, '#B7883A']]);
  gradRadial(defs, 'v-lila', [[0, '#F2EEFC'], [0.5, '#B9AAE0'], [1, '#7462AE']]);
  gradRadial(defs, 'v-verde', [[0, '#F1F8EC'], [0.5, '#A9C99A'], [1, '#5E8A58']]);
  const piedra = el('linearGradient', { id: 'v-piedra', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el('stop', { offset: 0, 'stop-color': '#FFFBF2' }, piedra);
  el('stop', { offset: 1, 'stop-color': '#D9C6A1' }, piedra);
  const brillo = el('radialGradient', { id: 'v-brillo', cx: '.5', cy: '.5', r: '.5' }, defs);
  el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': '.55' }, brillo);
  el('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': '0' }, brillo);
  const clipV = el('clipPath', { id: 'v-clip' }, defs);
  el('circle', { r: 184 }, clipV);
  const clipF = el('clipPath', { id: 'v-clip-foto' }, defs);
  el('circle', { r: R_FOTO - 2 }, clipF);
  const fondoF = el('radialGradient', { id: 'v-fondo-foto', cx: '.5', cy: '.35', r: '.7' }, defs);
  el('stop', { offset: 0, 'stop-color': '#FFFDF7' }, fondoF);
  el('stop', { offset: 0.7, 'stop-color': '#F7E9DA' }, fondoF);
  el('stop', { offset: 1, 'stop-color': '#EFD6CF' }, fondoF);

  // Marco de piedra
  el('circle', { r: 198, fill: 'url(#v-piedra)' }, svg);
  el('circle', { r: 198, fill: 'none', stroke: '#C9B48C', 'stroke-width': 1.5 }, svg);
  el('circle', { r: 186, fill: '#3C3228' }, svg);

  const vitral = el('g', { 'clip-path': 'url(#v-clip)' }, svg);
  // Fondo de vidrio (entre piezas)
  el('circle', { r: 186, fill: 'url(#v-azul)', opacity: 0.9 }, vitral);

  // Anillo exterior de lóbulos
  const lobulos = el('g', {}, vitral);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    el('circle', {
      class: 'vidrio',
      cx: (Math.cos(a) * 170).toFixed(2), cy: (Math.sin(a) * 170).toFixed(2), r: 13.5,
      fill: i % 2 ? 'url(#v-rosa)' : 'url(#v-oro)', stroke: PLOMO, 'stroke-width': 2.4,
    }, lobulos);
  }
  el('circle', { r: 154, fill: 'none', stroke: PLOMO, 'stroke-width': 3 }, vitral);

  // Pétalos mayores (12) y menores intercalados
  const PETALO = 'M0 -88 C22 -100 34 -126 0 -152 C-34 -126 -22 -100 0 -88 Z';
  const PETALO_INT = 'M0 -98 C10 -106 16 -122 0 -138 C-16 -122 -10 -106 0 -98 Z';
  const colores = ['url(#v-azul)', 'url(#v-rosa)', 'url(#v-azul)', 'url(#v-lila)'];
  const petalos = el('g', {}, vitral);
  for (let i = 0; i < 12; i++) {
    const g = el('g', { transform: `rotate(${i * 30})` }, petalos);
    el('path', { class: 'vidrio', d: PETALO, fill: colores[i % 4], stroke: PLOMO, 'stroke-width': 2.6, 'stroke-linejoin': 'round' }, g);
    el('path', { d: PETALO_INT, fill: i % 2 ? 'url(#v-oro)' : 'url(#v-verde)', stroke: PLOMO, 'stroke-width': 1.6, opacity: 0.95 }, g);
    // Gotas entre pétalos
    const gg = el('g', { transform: 'rotate(15)' }, g);
    el('circle', { class: 'vidrio', cx: 0, cy: -132, r: 9, fill: 'url(#v-oro)', stroke: PLOMO, 'stroke-width': 2 }, gg);
    el('path', { d: 'M0 -100 L6 -116 L0 -120 L-6 -116 Z', fill: 'url(#v-rosa)', stroke: PLOMO, 'stroke-width': 1.4 }, gg);
  }

  // Brillo que gira lento sobre el vidrio
  const giro = el('g', { class: 'brillo-giro' }, vitral);
  el('circle', { r: 200, fill: 'none' }, giro); // caja estable para el giro
  el('ellipse', { cx: -70, cy: -90, rx: 120, ry: 70, fill: 'url(#v-brillo)' }, giro);

  // Anillo dorado alrededor de la foto
  el('circle', { r: R_FOTO + 8, fill: '#3C3228' }, svg);
  el('circle', { r: R_FOTO + 6, fill: 'none', stroke: 'url(#v-oro)', 'stroke-width': 7 }, svg);
  const cuentas = el('g', {}, svg);
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    el('circle', { cx: (Math.cos(a) * (R_FOTO + 6)).toFixed(2), cy: (Math.sin(a) * (R_FOTO + 6)).toFixed(2), r: 1.5, fill: '#FFF4D2' }, cuentas);
  }

  // Centro: foto o silueta
  capaFoto = el('g', {}, svg);
  el('circle', { r: R_FOTO, fill: '#FFF9EE', stroke: '#C9A35C', 'stroke-width': 1 }, svg);
  svg.appendChild(capaFoto); // la foto queda encima del fondo
  mostrarSilueta();
}

function mostrarSilueta() {
  if (!capaFoto) return;
  capaFoto.replaceChildren();
  const g = el('g', { 'clip-path': 'url(#v-clip-foto)', class: 'foto-aparece' }, capaFoto);
  el('circle', { r: R_FOTO, fill: 'url(#v-fondo-foto)' }, g);
  // Halo
  el('circle', { cx: 0, cy: -16, r: 44, fill: '#FFF3D0', opacity: 0.7 }, g);
  // Silueta de niña con velo y corona de flores
  const tono = '#D9BFA0';
  el('path', { d: 'M-62 90 C-58 46 -34 30 0 28 C34 30 58 46 62 90 Z', fill: tono }, g);
  el('path', { d: 'M-34 44 C-40 6 -30 -42 0 -44 C30 -42 40 6 34 44 C22 34 -22 34 -34 44 Z', fill: '#E9D7BD' }, g);
  el('circle', { cx: 0, cy: -10, r: 21, fill: tono }, g);
  el('rect', { x: -7, y: 8, width: 14, height: 18, rx: 6, fill: tono }, g);
  const corona = el('g', { fill: '#F6D9E0', stroke: '#E2B3C1', 'stroke-width': 0.8 }, g);
  for (let i = -3; i <= 3; i++) {
    const a = (i / 3) * 1.05;
    el('circle', { cx: (Math.sin(a) * 22).toFixed(1), cy: (-14 - Math.cos(a) * 18).toFixed(1), r: 3.6 }, corona);
  }
  // Espigas a los lados
  for (const s of [-1, 1]) {
    const e = el('g', { transform: `translate(${s * 46} 74) rotate(${s * 18})`, fill: '#D9B46E' }, g);
    el('path', { d: 'M0 0 V-34', stroke: '#C6A05F', 'stroke-width': 1.2 }, e);
    for (let k = 0; k < 4; k++) {
      el('ellipse', { cx: -2.4, cy: -22 - k * 5, rx: 1.8, ry: 4, transform: `rotate(-24 -2.4 ${-22 - k * 5})` }, e);
      el('ellipse', { cx: 2.4, cy: -22 - k * 5, rx: 1.8, ry: 4, transform: `rotate(24 2.4 ${-22 - k * 5})` }, e);
    }
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
    el('circle', { r: R_FOTO, fill: 'none', stroke: 'rgba(255,255,255,.5)', 'stroke-width': 2 }, capaFoto);
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
