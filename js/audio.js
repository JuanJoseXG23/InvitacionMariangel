// Campanas sintetizadas con Web Audio API (sin archivos).
// El contexto de audio solo se crea tras un toque del usuario.

const CLAVE = 'mariangel-sonido';
let ctx = null;
let salida = null; // ganancia maestra
let envioReverb = null;
let silenciado = (() => { try { return localStorage.getItem(CLAVE) === 'off'; } catch { return false; } })();
const oyentes = new Set();

export const estaSilenciado = () => silenciado;
export const alCambiarSonido = (fn) => { oyentes.add(fn); fn(silenciado); };

export function setSilenciado(valor) {
  silenciado = !!valor;
  try { localStorage.setItem(CLAVE, silenciado ? 'off' : 'on'); } catch { /* */ }
  if (salida) salida.gain.setTargetAtTime(silenciado ? 0 : 1, ctx.currentTime, 0.08);
  oyentes.forEach((fn) => fn(silenciado));
}

/** Llamar dentro de un gesto del usuario (click/touch). */
export function desbloquearAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 3;
    salida = ctx.createGain();
    salida.gain.value = silenciado ? 0 : 1;
    salida.connect(comp).connect(ctx.destination);

    // Reverb de iglesia: respuesta al impulso de ruido con caída exponencial.
    const seg = 3.2;
    const largo = Math.floor(ctx.sampleRate * seg);
    const ir = ctx.createBuffer(2, largo, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < largo; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / largo, 3);
    }
    const conv = ctx.createConvolver();
    conv.buffer = ir;
    envioReverb = ctx.createGain();
    envioReverb.gain.value = 0.38;
    envioReverb.connect(conv).connect(salida);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Parciales típicos de campana de iglesia: [proporción, amplitud, caída (s)]
const PARCIALES = [
  [0.5, 0.42, 4.2],  // hum
  [1.0, 0.7, 3.0],   // prime
  [1.183, 0.38, 2.2], // tercera menor (tierce)
  [1.506, 0.24, 1.8], // quinta
  [2.0, 0.36, 1.5],  // nominal
  [2.514, 0.16, 1.0],
  [2.662, 0.12, 0.9],
  [3.011, 0.12, 0.7],
  [4.166, 0.07, 0.45],
];

function golpe(frecuencia, t, volumen = 1, brillo = 1) {
  const bus = ctx.createGain();
  bus.gain.value = 0.11 * volumen;
  bus.connect(salida);
  bus.connect(envioReverb);

  for (const [r, amp, caida] of PARCIALES) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frecuencia * r * (1 + (Math.random() - 0.5) * 0.002);
    const a = amp * (r > 2 ? brillo : 1);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(a, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + caida);
    osc.connect(g).connect(bus);
    osc.start(t);
    osc.stop(t + caida + 0.05);
  }

  // Golpe del badajo: ráfaga corta de ruido filtrado.
  const n = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.04), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  n.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = Math.min(frecuencia * 3, 8000);
  bp.Q.value = 2;
  const gn = ctx.createGain();
  gn.gain.value = 0.35;
  n.connect(bp).connect(gn).connect(bus);
  n.start(t);
}

function listo() {
  if (silenciado) return false;
  desbloquearAudio();
  return !!ctx;
}

/** Repique de bienvenida (al abrir las puertas). */
export function repique() {
  if (!listo()) return;
  const t0 = ctx.currentTime + 0.05;
  // Do mayor descendente, como un pequeño carillón.
  const notas = [659.25, 587.33, 523.25, 392.0, 659.25, 523.25, 587.33, 392.0];
  notas.forEach((f, i) => golpe(f, t0 + i * 0.46, 0.9, 0.9));
  golpe(261.63, t0 + notas.length * 0.46 + 0.2, 1.25, 0.7); // campana grave final
}

/** Campanitas alegres (al confirmar, al encender una vela). */
export function campanitas() {
  if (!listo()) return;
  const t0 = ctx.currentTime + 0.03;
  [1046.5, 1318.5, 1568.0, 2093.0].forEach((f, i) => golpe(f, t0 + i * 0.13, 0.55, 0.6));
}
