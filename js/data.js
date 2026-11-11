// Capa de datos: Firestore en producción, datos locales en modo demo (?demo=1).
import { EVENTO_DEFECTO } from './defaults.js';
import { firebaseConfig, firebaseListo, FIREBASE_SDK, APP_CHECK_SITE_KEY } from './firebase-config.js';

const params = new URLSearchParams(location.search);
export const DEMO_EXPLICITO = params.get('demo') === '1';
/** Demo si se pide con ?demo=1, o si aún no hay firebaseConfig real. */
export const MODO_DEMO = DEMO_EXPLICITO || !firebaseListo();

const CLAVE_DEMO_EVENTO = 'mariangel-demo-evento';
const CLAVE_CACHE_EVENTO = 'mariangel-cache-evento';

const leerJSON = (clave) => {
  try { return JSON.parse(localStorage.getItem(clave) || 'null'); } catch { return null; }
};
const guardarJSON = (clave, valor) => {
  try { localStorage.setItem(clave, JSON.stringify(valor)); } catch { /* cuota o modo privado */ }
};
const mezclar = (d) => ({ ...EVENTO_DEFECTO, ...(d || {}) });

let _fb = null;
/** Carga perezosa del SDK modular de Firebase por CDN. */
export function firebase() {
  if (_fb) return _fb;
  _fb = (async () => {
    const [appMod, fs, au] = await Promise.all([
      import(`${FIREBASE_SDK}/firebase-app.js`),
      import(`${FIREBASE_SDK}/firebase-firestore.js`),
      import(`${FIREBASE_SDK}/firebase-auth.js`),
    ]);
    const app = appMod.initializeApp(firebaseConfig);
    if (APP_CHECK_SITE_KEY) {
      const ac = await import(`${FIREBASE_SDK}/firebase-app-check.js`);
      ac.initializeAppCheck(app, {
        provider: new ac.ReCaptchaV3Provider(APP_CHECK_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      });
    }
    return { app, db: fs.getFirestore(app), auth: au.getAuth(app), fs, au };
  })();
  return _fb;
}

/** Escucha config/evento en vivo. Devuelve función para dejar de escuchar. */
export function escucharEvento(cb) {
  if (MODO_DEMO) {
    cb(mezclar(leerJSON(CLAVE_DEMO_EVENTO)));
    // El panel admin en modo demo escribe en localStorage → se refleja en vivo en otras pestañas.
    const alCambiar = (e) => { if (e.key === CLAVE_DEMO_EVENTO) cb(mezclar(leerJSON(CLAVE_DEMO_EVENTO))); };
    addEventListener('storage', alCambiar);
    return () => removeEventListener('storage', alCambiar);
  }

  // Primero lo último conocido (evita parpadeos), luego Firestore en vivo.
  cb(mezclar(leerJSON(CLAVE_CACHE_EVENTO)));
  let activo = true;
  let cancelar = () => {};
  firebase()
    .then(({ db, fs }) => {
      if (!activo) return;
      cancelar = fs.onSnapshot(
        fs.doc(db, 'config', 'evento'),
        (snap) => {
          const datos = snap.data() || {};
          guardarJSON(CLAVE_CACHE_EVENTO, datos);
          cb(mezclar(datos));
        },
        (err) => console.warn('[evento]', err),
      );
    })
    .catch((err) => console.warn('Firebase no disponible:', err));
  return () => { activo = false; cancelar(); };
}

/** Solo para el panel admin en modo demo. */
export function guardarEventoDemo(datos) {
  guardarJSON(CLAVE_DEMO_EVENTO, datos);
}
