import { fechaColombia } from './util.js?v=20261111184712';

const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = (s = '') => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');

/** Genera y descarga un .ics. duracionMin = duración del evento. */
export function descargarICS({ titulo, descripcion, lugar, fecha, hora, duracionMin = 90, archivo = 'evento.ics', url = '' }) {
  const inicio = fechaColombia(fecha, hora);
  const fin = new Date(inicio.getTime() + duracionMin * 60000);
  const uid = `${fmt(inicio)}-${archivo.replace(/\W/g, '')}@primera-comunion-mariangel`;
  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Primera Comunion Mariangel//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(inicio)}`,
    `DTEND:${fmt(fin)}`,
    `SUMMARY:${esc(titulo)}`,
    `DESCRIPTION:${esc(descripcion)}`,
    `LOCATION:${esc(lugar)}`,
    url ? `URL:${url}` : '',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(titulo)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  const blob = new Blob([lineas.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href, download: archivo });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 4000);
}
