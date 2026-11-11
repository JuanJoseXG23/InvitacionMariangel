import { $, reduceMovimiento } from './util.js?v=20261111182424';
import { encenderVela } from './data.js?v=20261111182424';
import { campanitas } from './audio.js?v=20261111182424';

const MAX_MURO = 120; // velas dibujadas; el resto se resume en "+N"
const q = (k) => $(`[data-vela="${k}"]`);

let seccion, muro, luces;
let miUid = null;
let velasPrevias = new Set();
let primeraCarga = true;
let mensajes = []; // [{texto, autor}]
let visible = false;
let indiceMsj = 0;
let ultimaVelaConNombre = [];

function sprite() {
  document.body.insertAdjacentHTML('afterbegin', `
  <svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <defs>
      <linearGradient id="vp-cera" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E9DCC6"/><stop offset=".5" stop-color="#FFFCF4"/><stop offset="1" stop-color="#DCCDB2"/></linearGradient>
      <linearGradient id="vp-llama" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#F08A3C"/><stop offset=".4" stop-color="#FFC24D"/><stop offset="1" stop-color="#FFF8DE"/></linearGradient>
      <radialGradient id="vp-halo"><stop offset="0" stop-color="#FFD98A" stop-opacity=".75"/><stop offset="1" stop-color="#FFD98A" stop-opacity="0"/></radialGradient>
    </defs>
    <symbol id="velita-cuerpo" viewBox="0 0 24 56"><rect x="6" y="24" width="12" height="30" rx="2" fill="url(#vp-cera)"/><rect x="6" y="40" width="12" height="2.5" fill="#E2C27A" opacity=".8"/><path d="M12 24 V20" stroke="#3A2E24" stroke-width="1.2"/></symbol>
    <symbol id="velita-llama" viewBox="0 0 24 56" overflow="visible"><circle cx="12" cy="14" r="12" fill="url(#vp-halo)"/><path d="M12 5 C16 11 15.5 16 12 20 C8.5 16 8 11 12 5 Z" fill="url(#vp-llama)"/></symbol>
  </svg>`);
}

function crearVelita(v, nueva) {
  const d = document.createElement('span');
  d.className = 'velita' + (nueva ? ' nace' : '') + (v.id === miUid ? ' mia' : '');
  d.style.setProperty('--d', `${(Math.random() * -3).toFixed(2)}s`);
  d.style.setProperty('--t', `${(1.6 + Math.random() * 1.4).toFixed(2)}s`);
  d.style.setProperty('--e', (0.78 + Math.random() * 0.34).toFixed(2));
  d.style.setProperty('--y', `${Math.round(Math.random() * 8)}px`);
  d.innerHTML = '<svg viewBox="0 0 24 56"><use href="#velita-cuerpo"/><use class="llama" href="#velita-llama"/></svg>';
  return d;
}

export function actualizarVelas(lista) {
  const total = lista.length;
  q('total').textContent = String(total);
  q('texto').textContent = total === 1 ? 'vela encendida' : 'velas encendidas';

  const mia = lista.find((v) => v.id === miUid);
  pintarPropia(!!mia);

  // Muro: las más recientes primero.
  const recientes = lista.slice(-MAX_MURO).reverse();
  const nuevas = primeraCarga ? new Set() : new Set(lista.filter((v) => !velasPrevias.has(v.id)).map((v) => v.id));
  const frag = document.createDocumentFragment();
  const existentes = new Map([...muro.children].map((n) => [n.dataset.id, n]));
  for (const v of recientes) {
    let n = existentes.get(v.id);
    if (!n) { n = crearVelita(v, nuevas.has(v.id) && !reduceMovimiento()); n.dataset.id = v.id; }
    n.classList.toggle('mia', v.id === miUid);
    frag.appendChild(n);
  }
  muro.replaceChildren(frag);
  const resto = total - recientes.length;
  q('mas').hidden = resto <= 0;
  q('mas').textContent = `y ${resto} ${resto === 1 ? 'vela más' : 'velas más'} iluminando su camino`;

  for (const v of lista) if (nuevas.has(v.id) && v.nombre && v.id !== miUid) ultimaVelaConNombre.push(`${v.nombre} encendió una vela`);
  velasPrevias = new Set(lista.map((v) => v.id));
  primeraCarga = false;
}

function pintarPropia(encendida) {
  $('.vela-grande').classList.toggle('encendida', encendida);
  q('form').hidden = encendida;
  q('hecha').hidden = !encendida;
  if (encendida) q('hecha').textContent = 'Tu vela ya está encendida. Gracias por tu oración.';
}

/** Mensajes de las confirmaciones: lista ordenada + luces flotantes. */
export function actualizarMensajes(confirmaciones) {
  const conMensaje = confirmaciones.filter((c) => c.mensaje).sort((a, b) => b.creadoEn - a.creadoEn);
  mensajes = conMensaje.map((c) => ({ texto: c.mensaje, autor: String(c.nombre || '').replace(/\s+/g, ' ').trim() }));
  q('nmensajes').textContent = String(mensajes.length);
  const ol = q('lista');
  const frag = document.createDocumentFragment();
  for (const m of mensajes) {
    const li = document.createElement('li');
    const p = document.createElement('p');
    p.textContent = `«${m.texto}»`;
    const s = document.createElement('span');
    s.textContent = `— ${m.autor}`;
    li.append(p, s);
    frag.appendChild(li);
  }
  ol.replaceChildren(frag);
  $('.mensajes').hidden = mensajes.length === 0;
}

function soltarLuz() {
  if (!visible || document.hidden || reduceMovimiento()) return;
  if (luces.childElementCount >= 2) return; // sin saturar
  let texto = ultimaVelaConNombre.shift();
  let autor = '';
  if (!texto) {
    if (!mensajes.length) return;
    const m = mensajes[indiceMsj++ % mensajes.length];
    texto = m.texto.length > 110 ? `${m.texto.slice(0, 107)}…` : m.texto;
    autor = m.autor;
  }
  const el = document.createElement('div');
  el.className = 'luz-mensaje';
  el.style.left = `${8 + Math.random() * 44}%`;
  const p = document.createElement('p');
  p.textContent = texto;
  el.appendChild(p);
  if (autor) { const s = document.createElement('span'); s.textContent = autor; el.appendChild(s); }
  el.addEventListener('animationend', () => el.remove());
  luces.appendChild(el);
}

export function setMiUidVelas(uid) { miUid = uid; }
export function setNombreVela(nombre) {
  const inp = $('#vela-nombre');
  if (nombre && !inp.value) inp.value = nombre.split(' ')[0];
}

export function iniciarVelas() {
  sprite();
  seccion = $('#velas');
  muro = q('muro');
  luces = q('luces');

  q('encender').addEventListener('click', async () => {
    const btn = q('encender');
    btn.disabled = true;
    const nombre = $('#vela-nombre').value.replace(/\s+/g, ' ').trim().slice(0, 60);
    pintarPropia(true);
    campanitas();
    document.dispatchEvent(new CustomEvent('campanas'));
    try {
      await encenderVela(nombre);
    } catch (e) {
      console.error(e);
      pintarPropia(false);
      q('hecha').hidden = false;
      q('hecha').textContent = 'No pudimos encender tu vela. Inténtalo de nuevo.';
    } finally {
      btn.disabled = false;
    }
  });

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.15 }).observe(seccion);
  setInterval(soltarLuz, 5200);
}
