import { $ } from './util.js';

/** URL limpia de la invitación (sin ?demo, ?saltar, etc.). */
export const urlInvitacion = () => `${location.origin}${location.pathname.replace(/index\.html$/, '')}`;

let evento = null;
const textoCompartir = () => {
  const e = evento || { nombre: 'Mariangel' };
  return `Te invitamos a la Primera Comunión de ${e.nombre} 🕊️ Abre la invitación, entra a la iglesia y confirma tu asistencia:`;
};

async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    const t = Object.assign(document.createElement('textarea'), { value: texto });
    t.setAttribute('readonly', '');
    t.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(t);
    t.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* */ }
    t.remove();
    return ok;
  }
}

export function actualizarCompartir(e) {
  evento = e;
  const wa = $('[data-compartir="whatsapp"]');
  if (wa) wa.href = `https://wa.me/?text=${encodeURIComponent(`${textoCompartir()} ${urlInvitacion()}`)}`;
}

export function iniciarCompartir() {
  const estado = $('.compartir-estado');
  const avisar = (t) => { estado.textContent = t; setTimeout(() => { if (estado.textContent === t) estado.textContent = ''; }, 3500); };
  const nativo = $('[data-compartir="nativo"]');

  nativo.addEventListener('click', async () => {
    const datos = { title: `Primera Comunión de ${evento?.nombre || 'Mariangel'}`, text: textoCompartir(), url: urlInvitacion() };
    if (navigator.share) {
      try { await navigator.share(datos); return; } catch (err) { if (err?.name === 'AbortError') return; }
    }
    const ok = await copiar(`${datos.text} ${datos.url}`);
    avisar(ok ? 'Enlace copiado. ¡Pégalo donde quieras!' : 'No pudimos copiar; usa el botón de WhatsApp.');
  });

  $('[data-compartir="copiar"]').addEventListener('click', async () => {
    const ok = await copiar(urlInvitacion());
    avisar(ok ? 'Enlace copiado' : 'No pudimos copiar el enlace');
  });
  actualizarCompartir(evento);
}
