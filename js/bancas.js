import { $, reduceMovimiento } from './util.js?v=20261111182424';
import { svgPersonaje } from './avatares.js?v=20261111182424';

// La nave se ve desde la entrada: el altar al fondo (arriba) y las bancas
// acercándose hacia quien mira (abajo, más grandes). Los primeros en confirmar
// se sientan adelante, cerca del altar.

const FILAS_MIN = 6;
const LOTE = 60;          // personajes creados por cuadro (render en lotes)
const ESCALA_MIN = 0.6;   // tamaño relativo de la fila más lejana
const PASO_ESCALA = 0.06; // cuánto se achica cada fila hacia el altar

let templo, nave, globos, contador, contadorFamilias, ficha;
let porLado = 3;
let filas = []; // [{ el, asientos: [HTMLElement en orden de llenado] }]
const personajes = new Map(); // id -> { el, firma }
let primeraCarga = true;
let miUid = null;
let pendienteIrAMio = false;
let ultimaLista = [];
let trabajo = 0;
let visible = false;

const calcularPorLado = () => (innerWidth >= 1000 ? 6 : innerWidth >= 640 ? 5 : innerWidth >= 480 ? 4 : 3);
export const nombreVisible = (n = '') => String(n).replace(/\s+/g, ' ').trim() || 'Invitado';

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

/** Perspectiva: la última fila (junto a la entrada) mide 1; las de adelante se achican. */
function aplicarPerspectiva() {
  const R = filas.length;
  filas.forEach((f, r) => {
    const s = Math.max(ESCALA_MIN, 1 - (R - 1 - r) * PASO_ESCALA);
    f.el.style.setProperty('--s', s.toFixed(3));
  });
  const smin = Math.max(ESCALA_MIN, 1 - (R - 1) * PASO_ESCALA);
  templo.style.setProperty('--smin', smin.toFixed(3));
}

function asegurarFilas(personas) {
  const porFila = porLado * 2;
  const necesarias = Math.max(FILAS_MIN, Math.ceil(personas / porFila) + 1);
  const antes = filas.length;
  while (filas.length < necesarias) filas.push(crearFila());
  while (filas.length > necesarias) {
    const f = filas[filas.length - 1];
    if (f.asientos.some((a) => a.firstChild)) break;
    f.el.remove();
    filas.pop();
  }
  if (filas.length !== antes) aplicarPerspectiva();
}

const asientoN = (i) => filas[Math.floor(i / (porLado * 2))].asientos[i % (porLado * 2)];

function etiqueta(c) {
  const extra = (c.personas || 1) - 1;
  let t = nombreVisible(c.nombre);
  if (extra > 0) t += ` y ${extra} ${extra === 1 ? 'acompañante' : 'acompañantes'}`;
  return c.mensaje ? `${t}. Toca para leer su mensaje` : t;
}

function crearPersonaje(c) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'personaje';
  b.dataset.id = c.id;
  // Ritmo propio para que cada uno "respire" distinto.
  b.style.setProperty('--r', `${(2.6 + Math.random() * 2.2).toFixed(2)}s`);
  b.style.setProperty('--rd', `${(-Math.random() * 4).toFixed(2)}s`);
  b.style.setProperty('--rot', `${((Math.random() < 0.5 ? -1 : 1) * (0.8 + Math.random() * 1.6)).toFixed(2)}deg`);
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
    ? 'Toca a alguien para ver su mensaje'
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
          if (c.id !== miUid) avisar(`${nombreVisible(c.nombre)} acaba de confirmar`);
        }
      } else if (p.firma !== firma) {
        pintarPersonaje(p.el, c);
        p.firma = firma;
      }
      const asiento = asientoN(i);
      if (p.el.parentNode !== asiento) asiento.appendChild(p.el);
    }
    if (i < lista.length) trabajo = requestAnimationFrame(paso);
    else { trabajo = 0; asegurarFilas(lista.length); if (pendienteIrAMio) irAMio(); }
  };
  paso();
}

export function setMiUid(uid) {
  miUid = uid;
  if (ultimaLista.length) {
    for (const p of personajes.values()) p.firma = '';
    actualizarBancas(ultimaLista);
  }
}

/** Lleva la vista al personaje propio y lo hace saludar. */
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

/* ───────── Vida: saludos al azar y globitos con mensajes ───────── */
function enPantalla(el) {
  const r = el.getBoundingClientRect();
  return r.bottom > 40 && r.top < innerHeight - 40 && r.width > 0;
}
function alAzar(filtro) {
  const candidatos = [];
  for (const c of ultimaLista) {
    const p = personajes.get(c.id);
    if (p && (!filtro || filtro(c)) && enPantalla(p.el)) candidatos.push([c, p.el]);
  }
  return candidatos[(Math.random() * candidatos.length) | 0];
}

function saludoAlAzar() {
  if (!visible || document.hidden) return;
  const elegido = alAzar();
  if (!elegido) return;
  const el = elegido[1];
  if (el.classList.contains('llega')) return;
  el.classList.add('saluda');
  setTimeout(() => el.classList.remove('saluda'), 1700);
}

function globoAlAzar() {
  if (!visible || document.hidden || globos.childElementCount >= 2) return;
  const elegido = alAzar((c) => c.mensaje && !globos.querySelector(`[data-id="${CSS.escape(c.id)}"]`));
  if (!elegido) return;
  const [c, el] = elegido;
  const rt = templo.getBoundingClientRect();
  const rp = el.getBoundingClientRect();
  const g = document.createElement('div');
  g.className = 'globo';
  g.dataset.id = c.id;
  const p = document.createElement('p');
  p.textContent = c.mensaje.length > 90 ? `${c.mensaje.slice(0, 87)}…` : c.mensaje;
  const s = document.createElement('span');
  s.textContent = nombreVisible(c.nombre).split(' ').slice(0, 2).join(' ');
  g.append(p, s);
  globos.appendChild(g);
  // Posición: sobre la cabeza, sin salirse de la iglesia.
  const ancho = g.offsetWidth;
  const centro = rp.left + rp.width / 2 - rt.left;
  const izq = Math.max(6, Math.min(rt.width - ancho - 6, centro - ancho / 2));
  g.style.left = `${izq}px`;
  g.style.top = `${rp.top - rt.top - g.offsetHeight - 6}px`;
  g.style.setProperty('--cola', `${Math.max(14, Math.min(ancho - 14, centro - izq))}px`);
  if (reduceMovimiento()) { setTimeout(() => g.remove(), 6000); return; }
  el.classList.add('saluda');
  setTimeout(() => el.classList.remove('saluda'), 1700);
  g.addEventListener('animationend', () => g.remove());
}

/* ───────── Avisos en vivo ───────── */
let colaAvisos = [];
let mostrandoAviso = false;
function avisar(texto) {
  // Nunca sobre la portada; y sin saturar.
  if (document.body.classList.contains('portada-activa') || document.getElementById('portada')) return;
  if (colaAvisos.length > 2) return;
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
  $('#ficha-nombre', ficha).textContent = nombreVisible(c.nombre);
  const extra = (c.personas || 1) - 1;
  const nombres = (c.acompanantes || []).map((n) => String(n).trim()).filter(Boolean);
  let texto = 'Viene a acompañar a Mariangel';
  if (extra > 0) {
    const sinNombre = extra - nombres.length;
    const partes = [...nombres];
    if (sinNombre > 0) partes.push(`${sinNombre} ${sinNombre === 1 ? 'persona más' : 'personas más'}`);
    texto = `Viene con ${partes.length > 1 ? `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}` : partes[0]}`;
  }
  $('.ficha-acomp', ficha).textContent = texto;
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
  templo = $('.templo');
  nave = $('.nave');
  globos = $('.globos');
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
  document.addEventListener('ir-a-mio', irAMio);
  document.addEventListener('cancelar-ir-a-mio', () => { pendienteIrAMio = false; });

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

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.1 }).observe(templo);
  if (!reduceMovimiento()) setInterval(saludoAlAzar, 1400);
  setInterval(globoAlAzar, 4200); // los mensajes también se muestran con movimiento reducido (sin animación)
  asegurarFilas(0);
}
