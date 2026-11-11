import { $, $$, fechaLarga, fechaCorta, horaBonita, enlaceMaps, capitalizar } from './util.js';
import { escucharEvento, escucharColeccion, obtenerUid, DEMO_EXPLICITO, reiniciarDemo } from './data.js';
import { construirSprite } from './avatares.js';
import { iniciarBancas, actualizarBancas, setMiUid } from './bancas.js';
import { iniciarRSVP, actualizarRSVP } from './rsvp.js';
import { iniciarVelas, actualizarVelas, actualizarMensajes, setMiUidVelas, setNombreVela } from './velas.js';
import { alCambiarSonido, setSilenciado, estaSilenciado } from './audio.js';
import { iniciarPortada } from './portada.js';
import { iniciarAltar, ponerFoto } from './altar.js';
import { iniciarCuenta } from './cuenta.js';
import { descargarICS } from './ics.js';
import { iniciarFiesta } from './fiesta.js';

let evento = null;

/* ───────────── Render de datos editables ───────────── */
function calculados(e) {
  const fl = fechaLarga(e.fecha);
  const [a, mes, d] = (e.fecha || '').split('-');
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return {
    ...e,
    fechaLarga: capitalizar(fl),
    fechaCorta: fechaCorta(e.fecha),
    fechaPuntos: d ? `${+d} · ${meses[+mes - 1]} · ${a}` : '',
    misaHoraBonita: horaBonita(e.misaHora),
    fechaLimiteBonita: fechaCorta(e.fechaLimite),
    fiestaHoraBonita: horaBonita(e.fiestaHora) || 'Hora por confirmar',
    misaMaps: enlaceMaps(e.misaMaps, e.misaLugar, e.misaDireccion),
    fiestaMaps: enlaceMaps(e.fiestaMaps, e.fiestaLugar, e.fiestaDireccion),
  };
}

function render(e) {
  evento = e;
  const v = calculados(e);

  $$('[data-t]').forEach((n) => {
    const val = v[n.dataset.t];
    if (typeof val === 'string' && n.textContent !== val) n.textContent = val;
    n.hidden = typeof val === 'string' && !val && !n.matches('.tarjeta-titulo');
  });
  $$('[data-enlace]').forEach((a) => {
    const url = v[a.dataset.enlace];
    a.href = url || '#';
    a.hidden = !url;
  });

  // Fiesta: oculta, por definir, o definida
  $$('[data-fiesta]').forEach((fiesta) => {
    fiesta.hidden = !e.fiestaMostrar;
    fiesta.dataset.estado = e.fiestaLugar || e.fiestaHora ? 'definida' : 'pendiente';
  });

  document.title = `Primera Comunión de ${e.nombre}`;
  $('.roseton')?.setAttribute('aria-label', `Foto de ${e.nombre} con una corona de trigo`);
  ponerFoto(e.foto);
  iniciarCuenta(e.fecha, e.misaHora);
  actualizarRSVP({ evento: e });
}

/* ───────────── Confirmaciones y velas en vivo ───────────── */
let uid = null;
let confirmaciones = [];
let velas = [];

function alCambiarConfirmaciones(lista) {
  confirmaciones = lista;
  actualizarBancas(lista);
  actualizarMensajes(lista);
  const mia = uid ? lista.find((c) => c.id === uid) || null : undefined;
  actualizarRSVP({ mia });
  if (mia) setNombreVela(mia.nombre);
}

function iniciarEnVivo() {
  construirSprite();
  iniciarBancas();
  iniciarRSVP();
  iniciarVelas();
  escucharColeccion('confirmaciones', alCambiarConfirmaciones);
  escucharColeccion('velas', (lista) => { velas = lista; actualizarVelas(lista); });
  obtenerUid()
    .then((id) => {
      uid = id;
      setMiUid(id);
      setMiUidVelas(id);
      alCambiarConfirmaciones(confirmaciones);
      actualizarVelas(velas);
    })
    .catch((err) => console.warn('No se pudo iniciar sesión anónima:', err));
}

/* ───────────── Calendario ───────────── */
function alAgregarCalendario(tipo) {
  const e = evento;
  if (!e) return;
  const url = location.href.split('#')[0];
  if (tipo === 'misa') {
    descargarICS({
      titulo: `Primera Comunión de ${e.nombre}`,
      descripcion: `Santa Misa de Primera Comunión de ${e.nombre} ${e.apellidos}.\n«${e.fraseTexto}» (${e.fraseCita})`,
      lugar: [e.misaLugar, e.misaDireccion].filter(Boolean).join(', '),
      fecha: e.fecha, hora: e.misaHora, duracionMin: 90,
      archivo: 'primera-comunion-misa.ics', url,
    });
  } else {
    descargarICS({
      titulo: `${e.fiestaTitulo} · ${e.nombre}`,
      descripcion: e.fiestaDescripcion || '',
      lugar: [e.fiestaLugar, e.fiestaDireccion].filter(Boolean).join(', '),
      fecha: e.fecha, hora: e.fiestaHora || '12:30', duracionMin: 240,
      archivo: 'primera-comunion-celebracion.ics', url,
    });
  }
}

/* ───────────── Sonido ───────────── */
function iniciarBotonSonido() {
  const btn = $('.btn-sonido');
  const uso = $('use', btn);
  alCambiarSonido((off) => {
    btn.setAttribute('aria-pressed', String(off));
    btn.setAttribute('aria-label', off ? 'Activar campanas' : 'Silenciar campanas');
    uso.setAttribute('href', off ? '#i-silencio' : '#i-sonido');
  });
  btn.addEventListener('click', () => setSilenciado(!estaSilenciado()));
  document.addEventListener('campanas', () => {
    if (estaSilenciado()) return;
    btn.classList.remove('sonando'); void btn.offsetWidth; btn.classList.add('sonando');
  });
}

/* ───────────── Aparición al hacer scroll ───────────── */
function iniciarRevelado() {
  const io = new IntersectionObserver((entradas) => {
    entradas.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  $$('.revelar').forEach((n) => io.observe(n));
}

/* ───────────── Arranque ───────────── */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

if (DEMO_EXPLICITO) {
  const insignia = $('.insignia-demo');
  insignia.hidden = false;
  if (new URLSearchParams(location.search).get('reiniciar') === '1') reiniciarDemo();
}
iniciarBotonSonido();
iniciarAltar();
iniciarEnVivo();
iniciarFiesta();
escucharEvento(render);

$$('[data-ics]').forEach((b) => b.addEventListener('click', () => alAgregarCalendario(b.dataset.ics)));

iniciarPortada({
  alEntrar: () => {
    window.scrollTo(0, 0);
    iniciarRevelado();
  },
});
