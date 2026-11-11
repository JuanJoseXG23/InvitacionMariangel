import { $, $$, fechaLarga, fechaCorta, horaBonita } from './util.js?v=20261111182028';
import { EVENTO_DEFECTO } from './defaults.js?v=20261111182028';
import {
  MODO_DEMO, escucharSesionAdmin, entrarAdmin, salirAdmin, leerEvento, guardarEvento,
  escucharColeccion, borrarDocumento, quitarMensaje,
} from './data.js?v=20261111182028';
import { construirSprite, svgPersonaje } from './avatares.js?v=20261111182028';

const A = (k) => $(`[data-adm="${k}"]`);

/* ───────── Campos editables de config/evento ───────── */
const GRUPOS = [
  { titulo: 'Textos principales', campos: [
    ['nombre', 'Nombre', 'text', 40],
    ['apellidos', 'Apellidos', 'text', 60],
    ['tituloPortada', 'Título de la portada', 'text', 60],
    ['mensajeInvitacion', 'Mensaje de invitación', 'textarea', 300],
    ['mensajeCierre', 'Mensaje de cierre', 'text', 80],
  ] },
  { titulo: 'Fecha y misa', campos: [
    ['fecha', 'Fecha', 'date'],
    ['misaHora', 'Hora de la misa', 'time'],
    ['misaLugar', 'Lugar', 'text', 100],
    ['misaDireccion', 'Dirección', 'text', 150],
    ['misaMaps', 'Enlace de Google Maps', 'url', 500],
  ] },
  { titulo: 'Después de la misa (fiesta)', campos: [
    ['fiestaMostrar', 'Mostrar la sección de la fiesta', 'switch'],
    ['fiestaTitulo', 'Título', 'text', 80],
    ['fiestaDescripcion', 'Descripción', 'textarea', 300],
    ['fiestaHora', 'Hora (vacía = por definir)', 'time'],
    ['fiestaLugar', 'Lugar (vacío = por definir)', 'text', 100],
    ['fiestaDireccion', 'Dirección', 'text', 150],
    ['fiestaMaps', 'Enlace de Google Maps', 'url', 500],
    ['fiestaPendienteTexto', 'Texto mientras está por definir', 'text', 120],
  ] },
  { titulo: 'Frase', campos: [
    ['fraseTexto', 'Texto', 'textarea', 400],
    ['fraseCita', 'Cita', 'text', 40],
  ] },
  { titulo: 'Confirmaciones y contacto', campos: [
    ['registroAbierto', 'Registro abierto (los invitados pueden confirmar)', 'switch'],
    ['fechaLimite', 'Fecha límite para confirmar', 'date'],
    ['ignorarFechaLimite', 'Reabrir: permitir confirmar aunque ya pasó la fecha límite', 'switch'],
    ['whatsapp', 'WhatsApp de contacto (con indicativo, sin +). Ej: 573001234567', 'tel', 20],
  ] },
];

let evento = { ...EVENTO_DEFECTO };
let fotoNueva = null; // undefined = sin cambios; '' = quitar; data URL = nueva
let confirmaciones = [];
let velas = [];
let escuchando = false;

function construirFormulario() {
  A('grupos').innerHTML = GRUPOS.map((g) => `
    <fieldset class="adm-tarjeta">
      <legend>${g.titulo}</legend>
      ${g.campos.map(([k, etiqueta, tipo, max]) => {
        if (tipo === 'switch') {
          return `<label class="adm-switch"><input type="checkbox" name="${k}"><span class="adm-switch-pista" aria-hidden="true"></span><span>${etiqueta}</span></label>`;
        }
        const id = `f-${k}`;
        const control = tipo === 'textarea'
          ? `<textarea id="${id}" name="${k}" rows="3" maxlength="${max}"></textarea>`
          : `<input id="${id}" name="${k}" type="${tipo}" ${max ? `maxlength="${max}"` : ''} ${tipo === 'tel' ? 'inputmode="numeric"' : ''}>`;
        return `<div class="campo"><label for="${id}">${etiqueta}</label>${control}</div>`;
      }).join('')}
    </fieldset>`).join('');
}

function llenarFormulario(e) {
  const f = A('form-evento');
  for (const g of GRUPOS) for (const [k, , tipo] of g.campos) {
    const inp = f.elements[k];
    if (tipo === 'switch') inp.checked = !!e[k];
    else inp.value = e[k] ?? '';
  }
  mostrarFoto(e.foto);
  A('nombre').textContent = e.nombre;
}

function leerFormulario() {
  const f = A('form-evento');
  const datos = {};
  for (const g of GRUPOS) for (const [k, , tipo] of g.campos) {
    const inp = f.elements[k];
    datos[k] = tipo === 'switch' ? inp.checked : inp.value.trim();
  }
  datos.whatsapp = datos.whatsapp.replace(/\D/g, '');
  if (fotoNueva !== null) datos.foto = fotoNueva;
  return datos;
}

/* ───────── Foto: redimensionar en el cliente → data URL ───────── */
function cargarImagen(file) {
  return new Promise((ok, mal) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); ok(img); };
    img.onerror = () => { URL.revokeObjectURL(url); mal(new Error('No se pudo leer la imagen')); };
    img.src = url;
  });
}

async function procesarFoto(file) {
  const img = await cargarImagen(file);
  let max = 900;
  let calidad = 0.82;
  const c = document.createElement('canvas');
  for (let intento = 0; intento < 6; intento++) {
    const esc = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    c.width = Math.round(img.naturalWidth * esc);
    c.height = Math.round(img.naturalHeight * esc);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    let url = c.toDataURL('image/webp', calidad);
    if (!url.startsWith('data:image/webp')) url = c.toDataURL('image/jpeg', calidad);
    if (url.length < 700000) return { url, ancho: c.width, alto: c.height };
    max = Math.round(max * 0.85);
    calidad -= 0.08;
  }
  throw new Error('La foto quedó demasiado pesada. Prueba con otra.');
}

function mostrarFoto(url) {
  const vista = A('foto-vista');
  vista.replaceChildren();
  if (url) {
    const img = new Image();
    img.src = url;
    img.alt = 'Vista previa de la foto';
    vista.appendChild(img);
  } else {
    const s = document.createElement('span');
    s.textContent = 'Sin foto: se muestra la silueta';
    vista.appendChild(s);
  }
}

/* ───────── Invitados ───────── */
const fechaHora = (ms) => new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' }).format(new Date(ms));

function pintarInvitados() {
  const personas = confirmaciones.reduce((s, c) => s + (Number(c.personas) || 1), 0);
  A('tot-personas').textContent = personas;
  A('tot-familias').textContent = confirmaciones.length;
  A('tot-mensajes').textContent = confirmaciones.filter((c) => c.mensaje).length;
  A('tot-velas').textContent = velas.length;
  A('badge-inv').textContent = personas;

  const termino = A('buscar').value.trim().toLowerCase();
  const lista = [...confirmaciones].reverse().filter((c) => !termino
    || `${c.nombre} ${c.mensaje} ${(c.acompanantes || []).join(' ')}`.toLowerCase().includes(termino));

  const cont = A('lista-inv');
  if (!lista.length) {
    cont.innerHTML = `<p class="adm-vacio">${termino ? 'Nadie coincide con la búsqueda.' : 'Aún no hay confirmaciones.'}</p>`;
  } else {
    const frag = document.createDocumentFragment();
    for (const c of lista) {
      const art = document.createElement('article');
      art.className = 'adm-inv';
      art.innerHTML = `<div class="adm-inv-av" aria-hidden="true">${svgPersonaje(c.avatar)}</div>
        <div class="adm-inv-info"><h3></h3><p class="adm-meta"></p><p class="adm-acomp"></p><blockquote></blockquote></div>
        <div class="adm-inv-acc"></div>`;
      $('h3', art).textContent = c.nombre;
      $('.adm-meta', art).textContent = `${c.personas || 1} ${c.personas > 1 ? 'personas' : 'persona'} · ${fechaHora(c.creadoEn)}`;
      const nombres = (c.acompanantes || []).filter(Boolean);
      $('.adm-acomp', art).textContent = nombres.length ? `Con: ${nombres.join(', ')}` : '';
      $('blockquote', art).textContent = c.mensaje ? `«${c.mensaje}»` : '';
      const acc = $('.adm-inv-acc', art);
      if (c.mensaje) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'btn btn-linea'; b.textContent = 'Quitar mensaje';
        b.addEventListener('click', () => accion(() => quitarMensaje(c.id), `¿Quitar el mensaje de ${c.nombre}? Su confirmación se mantiene.`));
        acc.appendChild(b);
      }
      const d = document.createElement('button');
      d.type = 'button'; d.className = 'btn adm-peligro'; d.textContent = 'Eliminar';
      d.addEventListener('click', () => accion(() => borrarDocumento('confirmaciones', c.id), `¿Eliminar la confirmación de ${c.nombre}? Desaparecerá de las bancas.`));
      acc.appendChild(d);
      frag.appendChild(art);
    }
    cont.replaceChildren(frag);
  }

  const cv = A('lista-velas');
  if (!velas.length) { cv.innerHTML = '<p class="adm-vacio">Aún no hay velas.</p>'; return; }
  const fv = document.createDocumentFragment();
  for (const v of [...velas].reverse()) {
    const fila = document.createElement('div');
    fila.className = 'adm-vela';
    const t = document.createElement('span');
    t.textContent = `🕯️ ${v.nombre || 'Sin nombre'} · ${fechaHora(v.creadoEn)}`;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn btn-texto'; b.textContent = 'Eliminar';
    b.addEventListener('click', () => accion(() => borrarDocumento('velas', v.id), `¿Eliminar la vela de ${v.nombre || 'esta persona'}?`));
    fila.append(t, b);
    fv.appendChild(fila);
  }
  cv.replaceChildren(fv);
}

async function accion(fn, pregunta) {
  if (!confirm(pregunta)) return;
  try { await fn(); } catch (e) { console.error(e); alert(mensajeError(e)); }
}

function exportarCSV() {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const filas = [['Nombre', 'Personas', 'Acompañantes', 'Mensaje', 'Personaje', 'Confirmó', 'Actualizó']];
  for (const c of confirmaciones) {
    filas.push([c.nombre, c.personas, (c.acompanantes || []).filter(Boolean).join(', '), c.mensaje, c.avatar,
      new Date(c.creadoEn).toLocaleString('es-CO'), new Date(c.actualizadoEn).toLocaleString('es-CO')]);
  }
  const csv = '﻿' + filas.map((f) => f.map(esc).join(';')).join('\r\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })),
    download: `confirmaciones-${new Date().toISOString().slice(0, 10)}.csv`,
  });
  document.body.appendChild(a); a.click(); a.remove();
}

/* ───────── Compartir ───────── */
const urlInvitacion = () => new URL('./', location.href).href;
function textoWhatsApp(e) {
  const fiesta = e.fiestaMostrar && (e.fiestaLugar || e.fiestaHora)
    ? `\n🎉 Después: ${[horaBonita(e.fiestaHora), e.fiestaLugar].filter(Boolean).join(' · ')}` : '';
  return `🕊️ ¡Estás invitado! 🕊️

Con muchísima alegría te invitamos a la Primera Comunión de ${e.nombre} ${e.apellidos}.

📅 ${fechaLarga(e.fecha).replace(/^./, (l) => l.toUpperCase())}
⛪ ${horaBonita(e.misaHora)} · ${e.misaLugar}${fiesta}

Abre la invitación, toca para entrar a la iglesia y confirma tu asistencia antes del ${fechaCorta(e.fechaLimite)}:
👉 ${urlInvitacion()}

¡Te esperamos! 💛`;
}
let textoEditado = false;
function pintarCompartir() {
  A('enlace').value = urlInvitacion();
  A('ver').href = MODO_DEMO ? 'index.html?demo=1' : urlInvitacion();
  if (!textoEditado) A('texto-wa').value = textoWhatsApp(evento);
  A('abrir-wa').href = `https://wa.me/?text=${encodeURIComponent(A('texto-wa').value)}`;
}
async function copiar(texto) {
  try { await navigator.clipboard.writeText(texto); return true; } catch { return false; }
}

/* ───────── Errores ───────── */
function mensajeError(e) {
  const c = e?.code || '';
  if (c.includes('permission-denied')) return 'Sin permiso: este usuario no es el administrador configurado en las reglas de Firestore.';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return 'Correo o contraseña incorrectos.';
  if (c.includes('too-many-requests')) return 'Demasiados intentos. Espera unos minutos.';
  if (c.includes('network')) return 'Sin conexión. Revisa tu internet.';
  return e?.message || 'Ocurrió un error inesperado.';
}

/* ───────── Pestañas ───────── */
function iniciarPestanas() {
  const tabs = $$('[role="tab"]');
  const activar = (t) => {
    tabs.forEach((x) => {
      const sel = x === t;
      x.setAttribute('aria-selected', String(sel));
      x.tabIndex = sel ? 0 : -1;
      $(`#${x.getAttribute('aria-controls')}`).hidden = !sel;
    });
    t.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => activar(t));
    t.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') activar(tabs[(i + 1) % tabs.length]);
      if (e.key === 'ArrowLeft') activar(tabs[(i - 1 + tabs.length) % tabs.length]);
    });
  });
}

/* ───────── Sesión ───────── */
function mostrarVista(v) {
  $('[data-vista="login"]').hidden = v !== 'login';
  $('[data-vista="panel"]').hidden = v !== 'panel';
  A('salir').hidden = v !== 'panel' || MODO_DEMO;
}

async function alEntrar(usuario) {
  mostrarVista('panel');
  A('email').textContent = usuario.email || '';
  A('uid').textContent = usuario.uid;
  const estado = A('estado-evento');
  try {
    const { existe, datos } = await leerEvento();
    evento = datos;
    llenarFormulario(evento);
    if (!existe) {
      // Primera vez: crear config/evento con los valores por defecto (las reglas lo necesitan).
      await guardarEvento({ ...EVENTO_DEFECTO });
      estado.textContent = 'Se creó la configuración inicial del evento.';
    }
  } catch (e) {
    console.error(e);
    estado.textContent = mensajeError(e);
  }
  pintarCompartir();
  if (!escuchando) {
    escuchando = true;
    escucharColeccion('confirmaciones', (l) => { confirmaciones = l; pintarInvitados(); });
    escucharColeccion('velas', (l) => { velas = l; pintarInvitados(); });
  }
}

/* ───────── Arranque ───────── */
construirSprite();
construirFormulario();
iniciarPestanas();
if (MODO_DEMO) A('demo').hidden = false;

escucharSesionAdmin((u) => { if (u) alEntrar(u); else mostrarVista('login'); });

A('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  const err = A('error-login');
  err.textContent = '';
  const btn = $('button[type="submit"]', f);
  btn.disabled = true;
  try { await entrarAdmin(f.email.value.trim(), f.clave.value); }
  catch (x) { err.textContent = mensajeError(x); }
  finally { btn.disabled = false; }
});
A('salir').addEventListener('click', () => salirAdmin());

A('form-evento').addEventListener('submit', async (e) => {
  e.preventDefault();
  const estado = A('estado-evento');
  const btn = A('guardar');
  const datos = leerFormulario();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha) || !/^\d{2}:\d{2}$/.test(datos.misaHora)) {
    estado.textContent = 'Revisa la fecha y la hora de la misa.';
    return;
  }
  if (!datos.nombre) { estado.textContent = 'El nombre no puede quedar vacío.'; return; }
  btn.disabled = true;
  estado.textContent = 'Guardando…';
  try {
    await guardarEvento(datos);
    evento = { ...evento, ...datos };
    fotoNueva = null;
    A('nombre').textContent = evento.nombre;
    pintarCompartir();
    estado.textContent = '✓ Guardado. La invitación ya muestra los cambios.';
  } catch (x) {
    console.error(x);
    estado.textContent = mensajeError(x);
  } finally {
    btn.disabled = false;
  }
});

A('foto-input').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  const info = A('foto-info');
  info.textContent = 'Procesando foto…';
  try {
    const { url, ancho, alto } = await procesarFoto(file);
    fotoNueva = url;
    mostrarFoto(url);
    info.textContent = `Lista (${ancho}×${alto}, ${Math.round(url.length / 1024)} KB). Pulsa «Guardar cambios» para publicarla.`;
  } catch (x) {
    info.textContent = x.message;
  }
});
A('foto-quitar').addEventListener('click', () => {
  fotoNueva = '';
  mostrarFoto('');
  A('foto-info').textContent = 'La foto se quitará al guardar.';
});

A('buscar').addEventListener('input', pintarInvitados);
A('csv').addEventListener('click', exportarCSV);

A('texto-wa').addEventListener('input', () => { textoEditado = true; pintarCompartir(); });
A('regenerar-wa').addEventListener('click', () => { textoEditado = false; pintarCompartir(); });
const avisarCompartir = (t) => { A('estado-compartir').textContent = t; };
A('copiar-enlace').addEventListener('click', async () => avisarCompartir(await copiar(urlInvitacion()) ? 'Enlace copiado.' : 'No se pudo copiar.'));
A('copiar-wa').addEventListener('click', async () => avisarCompartir(await copiar(A('texto-wa').value) ? 'Mensaje copiado. Pégalo en WhatsApp.' : 'No se pudo copiar.'));
