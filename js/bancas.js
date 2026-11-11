import { $, nombrePublico, reduceMovimiento } from './util.js';
import { svgPersonaje, AVATARES } from './avatares.js';

const FILAS_MIN = 6;
const LOTE = 60; // personajes creados por cuadro (render en lotes)

let nave, contador, contadorFamilias, ficha;
let porLado = 4;
let filas = []; // [{ el, asientos: [HTMLElement en orden de llenado] }]
const personajes = new Map(); // id -> { el, firma }
let primeraCarga = true;
let miUid = null;
let pendienteIrAMio = false;
let ultimaLista = [];
let trabajo = 0;

const calcularPorLado = () => (innerWidth >= 1000 ? 6 : innerWidth >= 640 ? 5 : innerWidth >= 480 ? 4 : 3);

/** Orden de llenado de una fila: desde el pasillo hacia afuera, alternando lados. */
function ordenFila(n) {
  const orden = [];
  for (let k = 0; k < n; k++) { orden.push(['izq', n - 1 - k]); orden.push(['der', k]); }
  return orden;
}

function crearFila() {
  const el = document.createElement('div');
  el.className = 'fila';
  const izq = document.createElement('div');
  const der = document.createElement('div');
  izq.className = 'banca banca-izq';
  der.className = 'banca banca-der';
  const pasillo = document.createElement('div');
  pasillo.className = 'pasillo';
  el.append(izq, pasillo, der);
  const lados = { izq: [], der: [] };
  for (const [lado, cont] of [['izq', izq], ['der', der]]) {
    for (let i = 0; i < porLado; i++) {
      const a = document.createElement('div');
      a.className = 'asiento';
      cont.appendChild(a);
      lados[lado].push(a);
    }
  }
  const asientos = ordenFila(porLado).map(([lado, i]) => lados[lado][i]);
  nave.appendChild(el);
  return { el, asientos };
}

function asegurarFilas(personas) {
  const porFila = porLado * 2;
  const necesarias = Math.max(FILAS_MIN, Math.ceil(personas / porFila) + 1);
  while (filas.length < necesarias) filas.push(crearFila());
  while (filas.length > necesarias) {
    const f = filas[filas.length - 1];
    if (f.asientos.some((a) => a.firstChild)) break;
    f.el.remove();
    filas.pop();
  }
}

const asientoN = (i) => filas[Math.floor(i / (porLado * 2))].asientos[i % (porLado * 2)];

function etiqueta(c) {
  const extra = (c.personas || 1) - 1;
  let t = nombrePublico(c.nombre);
  if (extra > 0) t += ` y ${extra} ${extra === 1 ? 'acompañante' : 'acompañantes'}`;
  return c.mensaje ? `${t}. Toca para leer su mensaje` : t;
}

function crearPersonaje(c) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'personaje';
  b.dataset.id = c.id;
  pintarPersonaje(b, c);
  return b;
}

function pintarPersonaje(b, c) {
  b.innerHTML = svgPersonaje(c.avatar);
  const extra = (c.personas || 1) - 1;
  if (extra > 0) {
    const s = document.createElement('span');
    s.className = 'personaje-mas';
    s.textContent = `+${extra}`;
    b.appendChild(s);
  }
  if (c.mensaje) {
    const m = document.createElement('span');
    m.className = 'personaje-nota';
    m.setAttribute('aria-hidden', 'true');
    b.appendChild(m);
  }
  if (c.id === miUid) {
    const t = document.createElement('span');
    t.className = 'personaje-tu';
    t.textContent = 'Tú';
    b.appendChild(t);
  }
  b.classList.toggle('mio', c.id === miUid);
  b.setAttribute('aria-label', etiqueta(c));
}

/** Recibe la lista completa (ordenada por creadoEn) y sincroniza la nave. */
export function actualizarBancas(lista) {
  ultimaLista = lista;
  const total = lista.reduce((s, c) => s + (Number(c.personas) || 1), 0);
  contador.textContent = String(total);
  $('[data-bancas="texto"]').textContent = total === 1 ? 'persona ya confirmó' : 'personas ya confirmaron';
  contadorFamilias.textContent = lista.length
    ? `${lista.length} ${lista.length === 1 ? 'familia' : 'familias'} · toca a alguien para ver su mensaje`
    : 'Sé el primero en ocupar una banca';

  asegurarFilas(lista.length);
  const vigentes = new Set(lista.map((c) => c.id));
  for (const [id, p] of personajes) if (!vigentes.has(id)) { p.el.remove(); personajes.delete(id); }

  const esInicial = primeraCarga;
  primeraCarga = false;
  cancelAnimationFrame(trabajo);
  let i = 0;
  const paso = () => {
    let creados = 0;
    for (; i < lista.length && creados < LOTE; i++) {
      const c = lista[i];
      const firma = `${c.nombre}|${c.avatar}|${c.personas}|${c.mensaje ? 1 : 0}|${c.id === miUid}`;
      let p = personajes.get(c.id);
      if (!p) {
        p = { el: crearPersonaje(c), firma };
        personajes.set(c.id, p);
        creados++;
        if (!esInicial && !reduceMovimiento()) {
          p.el.classList.add('llega');
          if (c.id !== miUid) avisar(`${nombrePublico(c.nombre)} acaba de confirmar`);
        }
      } else if (p.firma !== firma) {
        pintarPersonaje(p.el, c);
        p.firma = firma;
      }
      const asiento = asientoN(i);
      if (p.el.parentNode !== asiento) asiento.appendChild(p.el);
    }
    if (i < lista.length) trabajo = requestAnimationFrame(paso);
    else { trabajo = 0; if (pendienteIrAMio) irAMio(); }
  };
  paso();
  asegurarFilas(lista.length);
}

export function setMiUid(uid) {
  miUid = uid;
  if (ultimaLista.length) {
    for (const p of personajes.values()) p.firma = '';
    actualizarBancas(ultimaLista);
  }
}

/** Tras confirmar: lleva la vista al personaje propio y lo hace saludar. */
export function marcarIrAMio() { pendienteIrAMio = true; }
function irAMio() {
  const p = personajes.get(miUid);
  if (!p || trabajo) { pendienteIrAMio = true; return; }
  pendienteIrAMio = false;
  setTimeout(() => {
    p.el.scrollIntoView({ behavior: reduceMovimiento() ? 'auto' : 'smooth', block: 'center' });
    setTimeout(() => {
      p.el.classList.remove('llega');
      void p.el.offsetWidth;
      p.el.classList.add('llega', 'destacado');
      setTimeout(() => p.el.classList.remove('destacado'), 4200);
    }, 700);
  }, 900);
}

/* ───────── Avisos en vivo ───────── */
let colaAvisos = [];
let mostrandoAviso = false;
function avisar(texto) {
  if (colaAvisos.length > 2) return; // sin saturar
  colaAvisos.push(texto);
  if (!mostrandoAviso) siguienteAviso();
}
function siguienteAviso() {
  const el = $('.aviso');
  const t = colaAvisos.shift();
  if (!t) { mostrandoAviso = false; return; }
  mostrandoAviso = true;
  el.textContent = t;
  el.classList.add('visible');
  setTimeout(() => { el.classList.remove('visible'); setTimeout(siguienteAviso, 500); }, 3200);
}

/* ───────── Ficha del invitado ───────── */
let ultimoFoco = null;
function abrirFicha(id) {
  const c = ultimaLista.find((x) => x.id === id);
  if (!c) return;
  ultimoFoco = document.activeElement;
  $('.ficha-avatar', ficha).innerHTML = svgPersonaje(c.avatar);
  $('#ficha-nombre', ficha).textContent = nombrePublico(c.nombre);
  const extra = (c.personas || 1) - 1;
  const acomp = $('.ficha-acomp', ficha);
  acomp.textContent = extra > 0 ? `Viene con ${extra} ${extra === 1 ? 'acompañante' : 'acompañantes'}` : 'Viene a acompañar a Mariangel';
  const msj = $('.ficha-mensaje', ficha);
  msj.textContent = c.mensaje ? `«${c.mensaje}»` : '';
  msj.hidden = !c.mensaje;
  ficha.hidden = false;
  requestAnimationFrame(() => ficha.classList.add('abierta'));
  $('.ficha-cerrar', ficha).focus();
}
function cerrarFicha() {
  ficha.classList.remove('abierta');
  setTimeout(() => { ficha.hidden = true; }, 250);
  ultimoFoco?.focus?.();
}

export function iniciarBancas() {
  nave = $('.nave');
  contador = $('[data-bancas="total"]');
  contadorFamilias = $('[data-bancas="familias"]');
  ficha = $('.ficha');
  porLado = calcularPorLado();

  nave.addEventListener('click', (e) => {
    const b = e.target.closest('.personaje');
    if (b) abrirFicha(b.dataset.id);
  });
  ficha.addEventListener('click', (e) => { if (e.target === ficha || e.target.closest('.ficha-cerrar')) cerrarFicha(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !ficha.hidden) cerrarFicha(); });

  // Si cambia el ancho (rotar el celular), se rehacen las filas.
  let t = 0;
  addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const n = calcularPorLado();
      if (n === porLado) return;
      porLado = n;
      filas.forEach((f) => f.el.remove());
      filas = [];
      actualizarBancas(ultimaLista);
    }, 200);
  });
  document.addEventListener('ir-a-mio', irAMio);
  document.addEventListener('cancelar-ir-a-mio', () => { pendienteIrAMio = false; });
  asegurarFilas(0);
}

export { AVATARES };
