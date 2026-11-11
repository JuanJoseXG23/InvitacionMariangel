import { reduceMovimiento } from './util.js?v=20261111182424';

const COLORES = ['#E8CD8E', '#D9B26F', '#F4D3DD', '#D88AA1', '#AFC8E6', '#7CA6D8', '#FFFFFF', '#C29A4E'];

/** Confeti suave en canvas (≈2,8 s). origen: {x,y} en px de la ventana. */
export function confeti({ x = innerWidth / 2, y = innerHeight * 0.35, cantidad = 110 } = {}) {
  if (reduceMovimiento()) return;
  const c = document.createElement('canvas');
  c.className = 'confeti';
  c.setAttribute('aria-hidden', 'true');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = innerWidth * dpr;
  c.height = innerHeight * dpr;
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);

  const ps = Array.from({ length: cantidad }, () => {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
    const v = 260 + Math.random() * 420;
    return {
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      w: 5 + Math.random() * 6, h: 3 + Math.random() * 5,
      giro: Math.random() * 6, vgiro: (Math.random() - 0.5) * 12,
      color: COLORES[(Math.random() * COLORES.length) | 0],
      redondo: Math.random() < 0.3,
    };
  });

  const t0 = performance.now();
  let previo = t0;
  const cuadro = (t) => {
    const dt = Math.min((t - previo) / 1000, 0.04);
    previo = t;
    const vida = (t - t0) / 2800;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, vida - 0.6) / 0.4);
    for (const p of ps) {
      p.vy += 520 * dt;
      p.vx *= 0.985; p.vy *= 0.985;
      p.x += p.vx * dt + Math.sin(t / 300 + p.giro) * 0.6;
      p.y += p.vy * dt;
      p.giro += p.vgiro * dt;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.giro);
      ctx.fillStyle = p.color;
      if (p.redondo) { ctx.beginPath(); ctx.arc(0, 0, p.h / 1.4, 0, 6.283); ctx.fill(); }
      else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.giro)) + 1);
      ctx.restore();
    }
    if (vida < 1) requestAnimationFrame(cuadro); else c.remove();
  };
  requestAnimationFrame(cuadro);
}
