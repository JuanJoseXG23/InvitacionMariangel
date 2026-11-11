// ─────────────────────────────────────────────────────────────
//  CONFIGURACIÓN DE FIREBASE
//  Reemplaza los valores "PEGAR_..." con el firebaseConfig real
//  (Consola de Firebase → Configuración del proyecto → Tus apps → Web).
//  Estos valores NO son secretos: la seguridad está en firestore.rules.
// ─────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey: 'PEGAR_API_KEY',
  authDomain: 'PEGAR_PROJECT_ID.firebaseapp.com',
  projectId: 'PEGAR_PROJECT_ID',
  storageBucket: 'PEGAR_PROJECT_ID.appspot.com',
  messagingSenderId: 'PEGAR_SENDER_ID',
  appId: 'PEGAR_APP_ID',
};

// Opcional: clave de sitio de reCAPTCHA v3 para App Check.
// Déjala vacía ('') para no usar App Check.
export const APP_CHECK_SITE_KEY = '';

export const FIREBASE_SDK = 'https://www.gstatic.com/firebasejs/11.0.2';

export function firebaseListo() {
  return !Object.values(firebaseConfig).some((v) => String(v).includes('PEGAR'));
}
