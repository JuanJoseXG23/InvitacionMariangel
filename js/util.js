import { ZONA_HORARIA, OFFSET_COLOMBIA } from './defaults.js?v=20261111182028';

export const $ = (sel, raiz = document) => raiz.querySelector(sel);
export const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

export const reduceMovimiento = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Date absoluto a partir de 'AAAA-MM-DD' y 'HH:MM' en hora de Colombia. */
export function fechaColombia(fechaISO, hora = '00:00') {
  const h = /^\d{1,2}:\d{2}$/.test(hora || '') ? hora.padStart(5, '0') : '00:00';
  return new Date(`${fechaISO}T${h}:00${OFFSET_COLOMBIA}`);
}

/** "sábado, 19 de diciembre de 2026" */
export function fechaLarga(fechaISO) {
  const d = fechaColombia(fechaISO, '12:00');
  if (isNaN(d)) return '';
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: ZONA_HORARIA,
  }).format(d);
}

/** "19 de diciembre" */
export function fechaCorta(fechaISO) {
  const d = fechaColombia(fechaISO, '12:00');
  if (isNaN(d)) return '';
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', timeZone: ZONA_HORARIA }).format(d);
}

/** '10:00' → '10:00 a. m.' */
export function horaBonita(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '');
  if (!m) return '';
  let h = +m[1];
  const sufijo = h < 12 ? 'a. m.' : 'p. m.';
  h = h % 12 || 12;
  return `${h}:${m[2]} ${sufijo}`;
}

/** "María José Pérez" → "María P." (privacidad en la vista pública) */
export function nombrePublico(nombre = '') {
  const partes = String(nombre).trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return 'Invitado';
  if (partes.length === 1) return partes[0];
  return `${partes[0]} ${partes[partes.length - 1][0].toUpperCase()}.`;
}

export function enlaceMaps(url, lugar, direccion) {
  if (url) return url;
  const q = [lugar, direccion].filter(Boolean).join(', ');
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : '';
}

export function capitalizar(s = '') {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
