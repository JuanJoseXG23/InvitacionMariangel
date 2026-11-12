import { $, fechaColombia } from './util.js?v=20261111190218';

let objetivo = null;
let timer = 0;
let diasPrevios = null;

const dos = (n) => String(n).padStart(2, '0');

function pintar() {
  const seccion = $('#cuenta');
  const q = (k) => seccion.querySelector(`[data-cuenta="${k}"]`);
  const ahora = Date.now();
  const diff = objetivo - ahora;

  if (diff <= 0) {
    seccion.classList.add('terminada');
    const finDelDia = objetivo.getTime() + 10 * 3600 * 1000;
    q('dias').textContent = '';
    q('unidad').textContent = ahora < finDelDia ? '¡Hoy es el gran día!' : 'Gracias por acompañarla';
    q('sub').textContent = ahora < finDelDia ? 'Te esperamos con el corazón abierto' : 'Fue un día lleno de luz';
    clearInterval(timer);
    return;
  }
  seccion.classList.remove('terminada');

  const s = Math.floor(diff / 1000);
  const dias = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;

  const num = q('dias');
  const clave = dias > 0 ? dias : -1 - h; // el último día cambia cada hora
  if (clave !== diasPrevios) {
    // El último día, el número grande pasa a contar horas.
    num.textContent = String(dias > 0 ? dias : h);
    q('unidad').textContent = dias > 0 ? (dias === 1 ? 'día' : 'días') : (h === 1 ? 'hora' : 'horas');
    if (diasPrevios !== null) { num.classList.remove('cambia'); void num.offsetWidth; num.classList.add('cambia'); }
    diasPrevios = clave;
  }
  q('h').textContent = dos(h);
  q('m').textContent = dos(m);
  q('s').textContent = dos(seg);
}

/** (Re)inicia la cuenta hacia la fecha + hora de la misa (hora de Colombia). */
export function iniciarCuenta(fecha, hora) {
  const nuevo = fechaColombia(fecha, hora);
  if (isNaN(nuevo)) return;
  if (objetivo && objetivo.getTime() === nuevo.getTime()) return;
  objetivo = nuevo;
  diasPrevios = null;
  clearInterval(timer);
  pintar();
  timer = setInterval(pintar, 1000);
}
