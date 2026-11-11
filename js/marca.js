// Marca de inicio: aparece un instante en el centro y vuela a la esquina
// inferior derecha, donde queda como firma pequeña ("By …").
// El contenido (nombre, monograma o logo) está en index.html: .marca y .marca-firma.

const DURACION_VISIBLE = 850; // ms en el centro antes de irse a la esquina

export function iniciarMarca() {
  const splash = document.querySelector('.marca');
  const firma = document.querySelector('.marca-firma');
  if (!firma) return;
  const vista = new URLSearchParams(location.search).get('vista');
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (splash && vista === 'marca') { splash.classList.add('quieta'); return; } // depuración
  if (!splash || reducido || vista === 'firma') {
    splash?.remove();
    firma.classList.add('visible');
    return;
  }

  const centro = splash.querySelector('.marca-centro');
  const restante = Math.max(0, DURACION_VISIBLE - performance.now());
  setTimeout(() => {
    // FLIP: del centro hasta donde está la firma.
    const a = centro.getBoundingClientRect();
    const b = firma.getBoundingClientRect();
    const escala = Math.max(0.1, b.height / a.height);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    centro.style.transform = `translate(${dx}px, ${dy}px) scale(${escala})`;
    centro.style.opacity = '0';
    splash.classList.add('saliendo');
    firma.classList.add('visible');
    setTimeout(() => splash.remove(), 900);
  }, restante);
}
