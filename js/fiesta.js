import { $, reduceMovimiento } from './util.js?v=20261111184712';

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs, padre) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  padre?.appendChild(n);
  return n;
};

const COLORES_LUZ = ['#FFD98A', '#F6B3C6', '#A9C8F0', '#FFE9B8'];
const COLORES_BANDERIN = ['#E8CD8E', '#F4D3DD', '#AFC8E6', '#FFFFFF', '#D88AA1'];

/** Punto sobre una curva cuadrática. */
const q = (p0, p1, p2, t) => (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;

function construirGuirnalda(svg) {
  const defs = el('defs', {}, svg);
  COLORES_LUZ.forEach((c, i) => {
    const g = el('radialGradient', { id: `bombillo-${i}` }, defs);
    el('stop', { offset: 0, 'stop-color': '#FFFFFF' }, g);
    el('stop', { offset: 0.35, 'stop-color': c }, g);
    el('stop', { offset: 1, 'stop-color': c, 'stop-opacity': 0 }, g);
  });

  // Banderines (atrás)
  const b = { x0: -10, y0: 8, cx: 200, cy: 70, x1: 410, y1: 8 };
  el('path', { d: `M${b.x0} ${b.y0} Q${b.cx} ${b.cy} ${b.x1} ${b.y1}`, fill: 'none', stroke: '#C9A35C', 'stroke-width': 1.2 }, svg);
  const n = 15;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const x = q(b.x0, b.cx, b.x1, t), y = q(b.y0, b.cy, b.y1, t);
    el('path', {
      class: 'banderin', d: `M${(x - 10).toFixed(1)} ${y.toFixed(1)} L${(x + 10).toFixed(1)} ${y.toFixed(1)} L${x.toFixed(1)} ${(y + 22).toFixed(1)} Z`,
      fill: COLORES_BANDERIN[i % COLORES_BANDERIN.length], stroke: 'rgba(160,120,55,.35)', 'stroke-width': 0.6,
      style: `--i:${i}`,
    }, svg);
  }

  // Cuerda de bombillos (adelante)
  const c = { x0: -10, y0: 30, cx: 200, cy: 118, x1: 410, y1: 30 };
  el('path', { d: `M${c.x0} ${c.y0} Q${c.cx} ${c.cy} ${c.x1} ${c.y1}`, fill: 'none', stroke: '#6B5640', 'stroke-width': 1.1 }, svg);
  const m = 17;
  for (let i = 1; i < m; i++) {
    const t = i / m;
    const x = q(c.x0, c.cx, c.x1, t), y = q(c.y0, c.cy, c.y1, t);
    const g = el('g', { class: 'bombillo', style: `--i:${i};--d:${(Math.random() * -3).toFixed(2)}s` }, svg);
    el('circle', { class: 'bombillo-halo', cx: x.toFixed(1), cy: (y + 8).toFixed(1), r: 15, fill: `url(#bombillo-${i % COLORES_LUZ.length})` }, g);
    el('rect', { x: (x - 1.6).toFixed(1), y: y.toFixed(1), width: 3.2, height: 3, rx: 0.6, fill: '#7A6448' }, g);
    el('ellipse', { class: 'bombillo-vidrio', cx: x.toFixed(1), cy: (y + 8).toFixed(1), rx: 3.4, ry: 4.6, fill: COLORES_LUZ[i % COLORES_LUZ.length] }, g);
  }
}

function construirConfeti(cont) {
  const frag = document.createDocumentFragment();
  const colores = ['#E8CD8E', '#F4D3DD', '#AFC8E6', '#D88AA1', '#FFFFFF'];
  for (let i = 0; i < 22; i++) {
    const s = document.createElement('span');
    s.style.left = `${Math.random() * 100}%`;
    s.style.setProperty('--dur', `${(7 + Math.random() * 7).toFixed(1)}s`);
    s.style.setProperty('--del', `${(-Math.random() * 14).toFixed(1)}s`);
    s.style.setProperty('--x', `${((Math.random() - 0.5) * 80).toFixed(0)}px`);
    s.style.setProperty('--g', `${(Math.random() * 720 - 360).toFixed(0)}deg`);
    s.style.background = colores[i % colores.length];
    if (i % 3 === 0) s.classList.add('redondo');
    frag.appendChild(s);
  }
  cont.appendChild(frag);
}

export function iniciarFiesta() {
  const seccion = $('[data-seccion-fiesta]');
  if (!seccion) return;
  construirGuirnalda($('[data-guirnalda]', seccion));
  if (!reduceMovimiento()) construirConfeti($('[data-confeti-suave]', seccion));

  // Al entrar en la sección se encienden las luces una a una; el confeti solo corre si se ve.
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) seccion.classList.add('encendida');
    seccion.classList.toggle('activa', e.isIntersecting);
  }, { threshold: 0.2 }).observe(seccion);
}
