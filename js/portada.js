import { $, reduceMovimiento } from './util.js?v=20261111190218';
import { desbloquearAudio, repique } from './audio.js?v=20261111190218';

const SVG_NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}) => {
  const n = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
};

/** Pseudoaleatorio determinista para que el trigal siempre se vea igual. */
function rng(semilla) {
  let s = semilla >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** Una espiga de trigo en coordenadas locales (base en 0,0, crece hacia -y). */
function espiga(alto, rand, tono) {
  const g = el('g');
  const curva = (rand() - 0.5) * 16;
  g.appendChild(el('path', {
    d: `M0 0 Q${curva * 0.4} ${-alto * 0.5} ${curva} ${-alto}`,
    fill: 'none', stroke: tono.tallo, 'stroke-width': 1.6, 'stroke-linecap': 'round',
  }));
  // Hoja
  const lado = rand() > 0.5 ? 1 : -1;
  g.appendChild(el('path', {
    d: `M0 ${-alto * 0.28} q${lado * 16} ${-alto * 0.1} ${lado * 26} ${-alto * 0.3}`,
    fill: 'none', stroke: tono.tallo, 'stroke-width': 1.3, 'stroke-linecap': 'round', opacity: 0.8,
  }));
  // Granos y barbas a lo largo del tercio superior
  const espigaG = el('g', { transform: `translate(${curva} ${-alto})` });
  const filas = 7;
  for (let i = 0; i < filas; i++) {
    const y = i * 7.2;
    const esc = 1 - i * 0.03;
    for (const s of [-1, 1]) {
      espigaG.appendChild(el('ellipse', {
        cx: s * 3.3, cy: y, rx: 3.1 * esc, ry: 6.6 * esc,
        transform: `rotate(${s * 24} ${s * 3.3} ${y})`, fill: i % 2 ? tono.grano : tono.grano2,
      }));
      espigaG.appendChild(el('path', {
        d: `M${s * 4.6} ${y - 5} l${s * 7} -14`, stroke: tono.barba, 'stroke-width': 0.7, fill: 'none', opacity: 0.85,
      }));
    }
  }
  espigaG.appendChild(el('ellipse', { cx: 0, cy: -6, rx: 2.6, ry: 6, fill: tono.grano2 }));
  espigaG.appendChild(el('path', { d: 'M0 -11 l0 -16', stroke: tono.barba, 'stroke-width': 0.7 }));
  g.appendChild(espigaG);
  return g;
}

function construirTrigal(svg) {
  const W = 430, H = 260;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const rand = rng(1912);
  const tonos = [
    { tallo: '#B9935A', grano: '#D9B46E', grano2: '#C99E55', barba: '#C9A869' },
    { tallo: '#C7A46A', grano: '#E6C584', grano2: '#D5AE66', barba: '#D6B87A' },
    { tallo: '#A98550', grano: '#CDA35F', grano2: '#BD924E', barba: '#BE9C60' },
  ];
  const frag = document.createDocumentFragment();
  // Dos macizos: izquierda y derecha, dejando libre el centro (puerta y botón).
  const grupos = [
    { x0: -10, x1: 120, n: 11 },
    { x0: 310, x1: 440, n: 11 },
  ];
  for (const { x0, x1, n } of grupos) {
    for (let i = 0; i < n; i++) {
      const x = x0 + ((x1 - x0) * (i + rand() * 0.6)) / n;
      const alto = 120 + rand() * 110;
      const inclinacion = (x < W / 2 ? 1 : -1) * (2 + rand() * 9);
      const tono = tonos[Math.floor(rand() * tonos.length)];
      const base = el('g', { transform: `translate(${x.toFixed(1)} ${H + 6}) rotate(${inclinacion.toFixed(1)})` });
      const mece = espiga(alto, rand, tono);
      mece.setAttribute('class', 'espiga-mece');
      mece.style.setProperty('--dur', `${(3.8 + rand() * 2.6).toFixed(2)}s`);
      mece.style.setProperty('--del', `${(-rand() * 4).toFixed(2)}s`);
      mece.style.setProperty('--amp', `${(1.8 + rand() * 2.4).toFixed(1)}deg`);
      base.appendChild(mece);
      frag.appendChild(base);
    }
  }
  svg.appendChild(frag);
}

/**
 * Campanas: vaivén con <animateTransform> (SMIL) y pivote explícito.
 * Safari/iOS calcula mal el punto de giro de las transformaciones CSS en SVG
 * (con <use> y transform-box), y las campanas "salían volando".
 */
function prepararCampanas(svg) {
  const NS = 'http://www.w3.org/2000/svg';
  return [...svg.querySelectorAll('.campana')].map((g, i) => {
    const u = g.querySelector('use');
    const cx = +u.getAttribute('x') + +u.getAttribute('width') / 2;
    const cy = +u.getAttribute('y');
    const a = document.createElementNS(NS, 'animateTransform');
    a.setAttribute('attributeName', 'transform');
    a.setAttribute('type', 'rotate');
    a.setAttribute('values', `0 ${cx} ${cy}; 8 ${cx} ${cy}; 0 ${cx} ${cy}; -8 ${cx} ${cy}; 0 ${cx} ${cy}`);
    a.setAttribute('dur', '1.1s');
    a.setAttribute('repeatCount', '4');
    a.setAttribute('begin', 'indefinite');
    a.setAttribute('fill', 'remove');
    g.appendChild(a);
    return { a, retraso: (i % 2) * 280 };
  });
}

export function iniciarPortada({ alEntrar }) {
  const portada = $('#portada');
  const main = $('#contenido');
  construirTrigal($('.trigal', portada));
  const campanas = prepararCampanas($('.fachada-svg', portada));

  const saltar = new URLSearchParams(location.search).get('saltar') === '1';
  const terminar = () => {
    portada.remove();
    document.body.classList.remove('portada-activa');
    main.inert = false;
    main.removeAttribute('inert');
    alEntrar?.();
  };

  if (saltar) { terminar(); return; }
  // Vista de depuración: ?vista=puertas deja las puertas abiertas y quietas.
  if (new URLSearchParams(location.search).get('vista') === 'puertas') {
    document.head.insertAdjacentHTML('beforeend', '<style>.portada.abierta .puerta-izq{transform:rotateY(78deg)!important}.portada.abierta .puerta-der{transform:rotateY(-78deg)!important}</style>');
    portada.classList.add('abierta');
    return;
  }

  const btn = $('.btn-entrar', portada);
  btn.addEventListener('click', () => {
    btn.disabled = true;
    desbloquearAudio();
    repique();
    document.dispatchEvent(new CustomEvent('campanas'));

    if (reduceMovimiento()) {
      portada.classList.add('abierta', 'saliendo');
      setTimeout(terminar, 450);
      return;
    }

    portada.classList.add('tanendo');
    campanas.forEach(({ a, retraso }) => setTimeout(() => { try { a.beginElement(); } catch { /* sin SMIL */ } }, retraso));
    requestAnimationFrame(() => {
      portada.classList.add('abierta');
      setTimeout(() => portada.classList.add('entrando'), 250);
      setTimeout(() => {
        // El contenido ya se ve debajo mientras la portada se desvanece.
        document.body.classList.remove('portada-activa');
        main.inert = false;
        main.removeAttribute('inert');
        portada.classList.add('saliendo');
      }, 2600);
      setTimeout(terminar, 3700);
    });
  }, { once: true });
}
