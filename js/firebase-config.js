// ─────────────────────────────────────────────────────────────
//  CONFIGURACIÓN DE FIREBASE
//  Proyecto: invitacion-mariangel (Consola de Firebase → Configuración del proyecto → Tus apps → Web).
//  Estos valores NO son secretos: la seguridad está en firestore.rules.
// ─────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey: 'AIzaSyDW5s91HMB6vRtoCOb5ifmYVVmhEzATrDs',
  authDomain: 'invitacion-mariangel.firebaseapp.com',
  projectId: 'invitacion-mariangel',
  storageBucket: 'invitacion-mariangel.firebasestorage.app',
  messagingSenderId: '888491137834',
  appId: '1:888491137834:web:d7a90f15ac09572e10dc53',
};

// Opcional: clave de sitio de reCAPTCHA v3 para App Check.
// Déjala vacía ('') para no usar App Check.
export const APP_CHECK_SITE_KEY = '';

export const FIREBASE_SDK = 'https://www.gstatic.com/firebasejs/11.0.2';

export function firebaseListo() {
  return !Object.values(firebaseConfig).some((v) => String(v).includes('PEGAR'));
}
