// Marca de inicio JJG Systems: JJG en cascada + SYSTEMS tipo máquina de escribir
// (la animación de entrada es CSS puro). Dura un instante y luego vuela a la
// esquina inferior derecha, donde queda la firma "By JJG Systems".
// Se salta con un toque, Enter, Espacio o Esc. Se muestra una vez por sesión.

const MOMENTO_SALIDA = 1300; // ms desde que abre la página
const CLAVE = 'jjgIntroVisto';

export function iniciarMarca() {
  const splash = document.querySelector('.marca');
  const firma = document.querySelector('.marca-firma');
  if (!firma) return;
  const vista = new URLSearchParams(location.search).get('vista');
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const yaVista = document.documentElement.classList.contains('sin-intro');

  if (splash && vista === 'marca') { splash.classList.add('quieta'); return; } // depuración
  if (!splash || reducido || yaVista || vista === 'firma') {
    splash?.remove();
    firma.classList.add('visible');
    return;
  }
  try { sessionStorage.setItem(CLAVE, '1'); } catch { /* modo privado */ }

  const centro = splash.querySelector('.marca-centro');
  let hecho = false;
  const salir = () => {
    if (hecho) return;
    hecho = true;
    document.removeEventListener('keydown', alTeclear, true);
    // FLIP: del centro hasta donde está la firma.
    const a = centro.getBoundingClientRect();
    const b = firma.getBoundingClientRect();
    const escala = Math.max(0.08, b.height / a.height);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    centro.style.transform = `translate(${dx}px, ${dy}px) scale(${escala})`;
    centro.style.opacity = '0';
    splash.classList.add('saliendo');
    firma.classList.add('visible');
    setTimeout(() => splash.remove(), 900);
  };
  const alTeclear = (e) => {
    if (['Enter', ' ', 'Escape'].includes(e.key)) { e.preventDefault(); salir(); }
  };
  splash.addEventListener('click', salir);
  document.addEventListener('keydown', alTeclear, true);
  setTimeout(salir, Math.max(0, MOMENTO_SALIDA - performance.now()));
}
