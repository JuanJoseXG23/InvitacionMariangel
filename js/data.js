// Capa de datos: Firestore en producción, datos locales en modo demo (?demo=1).
import { EVENTO_DEFECTO } from './defaults.js?v=20261111185342';
import { firebaseConfig, firebaseListo, FIREBASE_SDK, APP_CHECK_SITE_KEY } from './firebase-config.js?v=20261111185342';

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

/* ═════════════ Confirmaciones y velas ═════════════ */

const aMs = (v) => (typeof v === 'number' ? v : v?.toMillis ? v.toMillis() : Date.now());
const normalizar = (id, d) => ({ id, ...d, creadoEn: aMs(d.creadoEn), actualizadoEn: aMs(d.actualizadoEn ?? d.creadoEn) });
const ordenar = (arr) => arr.sort((a, b) => a.creadoEn - b.creadoEn || (a.id < b.id ? -1 : 1));

// ── Almacén local para el modo demo (persistido en localStorage, sincronizado entre pestañas) ──
const claveDemo = (col) => `mariangel-demo-${col}`;
const oyentesDemo = { confirmaciones: new Set(), velas: new Set() };
const leerDemo = (col) => leerJSON(claveDemo(col)) || {};
const emitirDemo = (col) => {
  const arr = ordenar(Object.entries(leerDemo(col)).map(([id, d]) => normalizar(id, d)));
  oyentesDemo[col].forEach((cb) => cb(arr));
};
const escribirDemo = (col, id, datos) => {
  const todo = leerDemo(col);
  if (datos === null) delete todo[id]; else todo[id] = datos;
  guardarJSON(claveDemo(col), todo);
  emitirDemo(col);
};

let demoListo = null;
function prepararDemo() {
  if (demoListo) return demoListo;
  demoListo = (async () => {
    addEventListener('storage', (e) => {
      for (const col of Object.keys(oyentesDemo)) if (e.key === claveDemo(col)) emitirDemo(col);
    });
    if (!DEMO_EXPLICITO || /admin.html$/.test(location.pathname)) return;
    const demo = await import('./demo.js?v=20261111185342');
    if (localStorage.getItem(claveDemo('confirmaciones')) === null) {
      const { confirmaciones, velas } = demo.sembrar();
      guardarJSON(claveDemo('confirmaciones'), confirmaciones);
      guardarJSON(claveDemo('velas'), velas);
    }
    demo.simularLlegadas({
      agregarConfirmacion: (id, d) => escribirDemo('confirmaciones', id, d),
      agregarVela: (id, d) => escribirDemo('velas', id, d),
    });
  })();
  return demoListo;
}

/** Reinicia los datos del demo (útil para volver a ver las bancas vacías/llenas). */
export function reiniciarDemo() {
  localStorage.removeItem(claveDemo('confirmaciones'));
  localStorage.removeItem(claveDemo('velas'));
  localStorage.removeItem('mariangel-demo-uid');
}

/** UID anónimo de este dispositivo (Firebase Anonymous Auth o id local en demo). */
let _uid = null;
export function obtenerUid() {
  if (_uid) return _uid;
  _uid = (async () => {
    if (MODO_DEMO) {
      let id = localStorage.getItem('mariangel-demo-uid');
      if (!id) { id = `yo-${Math.random().toString(36).slice(2, 10)}`; localStorage.setItem('mariangel-demo-uid', id); }
      return id;
    }
    const { auth, au } = await firebase();
    if (auth.currentUser) return auth.currentUser.uid;
    await au.setPersistence(auth, au.browserLocalPersistence).catch(() => {});
    const yaHay = await new Promise((res) => {
      const parar = au.onAuthStateChanged(auth, (u) => { parar(); res(u); });
    });
    if (yaHay) return yaHay.uid;
    const cred = await au.signInAnonymously(auth);
    return cred.user.uid;
  })();
  _uid.catch(() => { _uid = null; });
  return _uid;
}

/** Escucha una colección ('confirmaciones' | 'velas') en vivo, ordenada por creadoEn. */
export function escucharColeccion(col, cb) {
  if (MODO_DEMO) {
    oyentesDemo[col].add(cb);
    prepararDemo().then(() => emitirDemo(col));
    return () => oyentesDemo[col].delete(cb);
  }
  let cancelar = () => {};
  let activo = true;
  firebase().then(({ db, fs }) => {
    if (!activo) return;
    const q = fs.query(fs.collection(db, col), fs.orderBy('creadoEn', 'asc'));
    cancelar = fs.onSnapshot(q, (snap) => {
      cb(ordenar(snap.docs.map((d) => normalizar(d.id, d.data({ serverTimestamps: 'estimate' })))));
    }, (err) => console.warn(`[${col}]`, err));
  }).catch((err) => console.warn('Firebase no disponible:', err));
  return () => { activo = false; cancelar(); };
}

/** Crea o actualiza la confirmación del dispositivo (id del documento = uid anónimo). */
export async function guardarConfirmacion(datos, existe) {
  const uid = await obtenerUid();
  if (MODO_DEMO) {
    await new Promise((r) => setTimeout(r, 450));
    const previo = leerDemo('confirmaciones')[uid];
    const t = Date.now();
    escribirDemo('confirmaciones', uid, { ...datos, creadoEn: previo?.creadoEn ?? t, actualizadoEn: t });
    return uid;
  }
  const { db, fs } = await firebase();
  const ref = fs.doc(db, 'confirmaciones', uid);
  if (existe) await fs.updateDoc(ref, { ...datos, actualizadoEn: fs.serverTimestamp() });
  else await fs.setDoc(ref, { ...datos, creadoEn: fs.serverTimestamp(), actualizadoEn: fs.serverTimestamp() });
  return uid;
}

export async function borrarConfirmacion() {
  const uid = await obtenerUid();
  if (MODO_DEMO) { escribirDemo('confirmaciones', uid, null); return; }
  const { db, fs } = await firebase();
  await fs.deleteDoc(fs.doc(db, 'confirmaciones', uid));
}

/** Una vela por dispositivo. */
export async function encenderVela(nombre) {
  const uid = await obtenerUid();
  if (MODO_DEMO) { escribirDemo('velas', uid, { nombre, creadoEn: Date.now() }); return uid; }
  const { db, fs } = await firebase();
  await fs.setDoc(fs.doc(db, 'velas', uid), { nombre, creadoEn: fs.serverTimestamp() });
  return uid;
}

/** Para el panel admin (demo): borrar cualquier documento. */
export function borrarDemo(col, id) { escribirDemo(col, id, null); }

/* ═════════════ Panel admin ═════════════ */

/** Escucha la sesión. cb(usuario | null). En demo entrega un admin ficticio. */
export function escucharSesionAdmin(cb) {
  if (MODO_DEMO) { cb({ uid: 'admin-demo', email: 'demo@ejemplo.com', demo: true }); return () => {}; }
  let cancelar = () => {};
  firebase().then(({ auth, au }) => {
    cancelar = au.onAuthStateChanged(auth, (u) => cb(u && !u.isAnonymous ? u : null));
  }).catch((err) => { console.warn(err); cb(null); });
  return () => cancelar();
}

export async function entrarAdmin(email, clave) {
  const { auth, au } = await firebase();
  await au.setPersistence(auth, au.browserLocalPersistence).catch(() => {});
  return au.signInWithEmailAndPassword(auth, email, clave);
}

export async function salirAdmin() {
  if (MODO_DEMO) return;
  const { auth, au } = await firebase();
  await au.signOut(auth);
}

/** Lee config/evento una vez (para saber si existe). */
export async function leerEvento() {
  if (MODO_DEMO) return { existe: !!leerJSON(CLAVE_DEMO_EVENTO), datos: mezclar(leerJSON(CLAVE_DEMO_EVENTO)) };
  const { db, fs } = await firebase();
  const snap = await fs.getDoc(fs.doc(db, 'config', 'evento'));
  return { existe: snap.exists(), datos: mezclar(snap.data()) };
}

export async function guardarEvento(datos) {
  if (MODO_DEMO) { guardarEventoDemo({ ...(leerJSON(CLAVE_DEMO_EVENTO) || {}), ...datos }); return; }
  const { db, fs } = await firebase();
  await fs.setDoc(fs.doc(db, 'config', 'evento'), datos, { merge: true });
}

export async function borrarDocumento(col, id) {
  if (MODO_DEMO) { escribirDemo(col, id, null); return; }
  const { db, fs } = await firebase();
  await fs.deleteDoc(fs.doc(db, col, id));
}

export async function quitarMensaje(id) {
  if (MODO_DEMO) {
    const d = leerDemo('confirmaciones')[id];
    if (d) escribirDemo('confirmaciones', id, { ...d, mensaje: '' });
    return;
  }
  const { db, fs } = await firebase();
  await fs.updateDoc(fs.doc(db, 'confirmaciones', id), { mensaje: '' });
}
