import { $, $$, fechaColombia, nombrePublico } from './util.js?v=20261111182028';
import { AVATARES, IDS_AVATAR, svgPersonaje } from './avatares.js?v=20261111182028';
import { guardarConfirmacion, borrarConfirmacion } from './data.js?v=20261111182028';
import { campanitas } from './audio.js?v=20261111182028';
import { confeti } from './confeti.js?v=20261111182028';

const LIM = { nombre: 60, mensaje: 280 };
const q = (k) => $(`[data-rsvp="${k}"]`);

let form, evento = null, mia = null, editando = false, enviando = false, recienConfirmado = false;

export function registroAbierto(e) {
  if (!e?.registroAbierto) return false;
  if (e.ignorarFechaLimite) return true;
  const limite = fechaColombia(e.fechaLimite, '23:59');
  return isNaN(limite) || Date.now() <= limite.getTime() + 59999;
}

/* ───────── Construcción ───────── */
function construirAvatares() {
  const cont = q('avatares');
  cont.innerHTML = AVATARES.map((a, i) => `
    <label class="avatar-opcion">
      <input type="radio" name="avatar" value="${a.id}" ${i === 0 ? 'checked' : ''}>
      <span class="avatar-marco">${svgPersonaje(a.id)}</span>
      <span class="avatar-nombre">${a.nombre}</span>
    </label>`).join('');
}

function errorCampo(input, msj) {
  const p = $(`#err-${input.name}`);
  input.setAttribute('aria-invalid', msj ? 'true' : 'false');
  if (p) p.textContent = msj || '';
}

/* ───────── Validación (espejo de firestore.rules) ───────── */
function leerDatos() {
  const nombre = form.nombre.value.replace(/\s+/g, ' ').trim();
  const mensaje = form.mensaje.value.trim().slice(0, LIM.mensaje);
  const avatar = form.avatar.value;
  // Cada registro es de una sola persona.
  return { nombre, acompanantes: [], personas: 1, mensaje, avatar: IDS_AVATAR.includes(avatar) ? avatar : 'nina' };
}

function validar(d) {
  if (d.nombre.length < 2 || !/\p{L}/u.test(d.nombre)) return ['nombre', 'Escribe tu nombre para reservar tu lugar.'];
  if (d.nombre.length > LIM.nombre) return ['nombre', `Máximo ${LIM.nombre} caracteres.`];
  return null;
}

/* ───────── Vistas ───────── */
function mostrar(vista) {
  for (const v of ['cerrado', 'gracias', 'formulario']) q(v).hidden = v !== vista;
}

function rellenar(c) {
  form.nombre.value = c.nombre || '';
  form.mensaje.value = c.mensaje || '';
  q('cuenta').textContent = String(form.mensaje.value.length);
  const r = form.querySelector(`input[name="avatar"][value="${c.avatar}"]`);
  if (r) r.checked = true;
}

function pintar() {
  if (!evento || enviando) return;
  const abierto = registroAbierto(evento);
  const wa = evento.whatsapp ? `https://wa.me/${evento.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, te escribo por la Primera Comunión de ${evento.nombre}.`)}` : '';
  $$('[data-whatsapp]').forEach((a) => { a.href = wa || '#'; a.hidden = !wa; });

  if (mia && !editando) {
    mostrar('gracias');
    $('.rsvp-gracias-avatar').innerHTML = svgPersonaje(mia.avatar);
    const pila = nombrePublico(mia.nombre).split(' ')[0];
    q('gracias-titulo').textContent = recienConfirmado ? `¡Gracias, ${pila}!` : `¡Hola, ${pila}! Ya confirmaste`;
    q('gracias-texto').textContent = 'Te esperamos con mucha alegría. Ya tienes tu lugar en la banca.';
    q('editar').hidden = !abierto;
    return;
  }
  if (!abierto) { mostrar('cerrado'); return; }
  mostrar('formulario');
  q('enviar').textContent = mia ? 'Guardar cambios' : 'Aquí estaré';
  q('volver').hidden = !mia;
}

/* ───────── API ───────── */
export function actualizarRSVP({ evento: e, mia: m }) {
  if (e) evento = e;
  if (m !== undefined) {
    const antes = mia;
    mia = m;
    if (!antes && m && !editando && !form.nombre.value) rellenar(m);
  }
  pintar();
}

export function iniciarRSVP() {
  form = q('formulario');
  construirAvatares();

  form.mensaje.addEventListener('input', () => { q('cuenta').textContent = String(form.mensaje.value.length); });
  form.nombre.addEventListener('input', () => errorCampo(form.nombre, ''));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (enviando) return;
    const estado = q('estado');
    estado.textContent = '';
    const datos = leerDatos();

    // Honeypot: si un bot llenó el campo oculto, fingimos éxito sin guardar.
    if (form.sitio.value) { mostrar('gracias'); return; }

    const err = validar(datos);
    if (err) {
      const input = form[err[0]];
      if (input?.focus) { errorCampo(input, err[1]); input.focus(); }
      else estado.textContent = err[1];
      return;
    }
    if (!registroAbierto(evento)) { pintar(); return; }

    enviando = true;
    const btn = q('enviar');
    btn.disabled = true;
    btn.textContent = 'Guardando…';
    try {
      await guardarConfirmacion(datos, !!mia);
      const r = btn.getBoundingClientRect();
      campanitas();
      document.dispatchEvent(new CustomEvent('campanas'));
      confeti({ x: r.left + r.width / 2, y: r.top });
      recienConfirmado = true;
      editando = false;
      mia = { ...mia, ...datos };
      document.dispatchEvent(new CustomEvent('ir-a-mio'));
      enviando = false;
      pintar();
      q('gracias').focus({ preventScroll: true });
    } catch (error) {
      console.error(error);
      document.dispatchEvent(new CustomEvent('cancelar-ir-a-mio'));
      estado.textContent = 'No pudimos guardar tu confirmación. Revisa tu conexión e inténtalo de nuevo.';
      enviando = false;
    } finally {
      btn.disabled = false;
      if (!enviando) q('enviar').textContent = mia ? 'Guardar cambios' : 'Aquí estaré';
    }
  });

  q('editar').addEventListener('click', () => {
    editando = true;
    if (mia) rellenar(mia);
    pintar();
    form.nombre.focus();
  });
  q('volver').addEventListener('click', () => { editando = false; pintar(); });
  q('ver-lugar').addEventListener('click', (e) => { e.preventDefault(); document.dispatchEvent(new CustomEvent('ir-a-mio')); });
  q('cancelar').addEventListener('click', async () => {
    if (!confirm('¿Seguro que ya no puedes asistir? Tu lugar en la banca quedará libre.')) return;
    try {
      await borrarConfirmacion();
      mia = null; recienConfirmado = false; editando = false;
      form.reset(); q('cuenta').textContent = '0';
      pintar();
    } catch (error) {
      console.error(error);
      alert('No pudimos cancelar en este momento. Inténtalo de nuevo.');
    }
  });
}
