// Personajitos sentados (vista frontal, torso y brazo levantado para saludar).
// Se dibujan una sola vez como <symbol> y cada invitado los reutiliza con <use>.

export const AVATARES = [
  { id: 'nina', nombre: 'Niña' },
  { id: 'nino', nombre: 'Niño' },
  { id: 'senora', nombre: 'Señora' },
  { id: 'senor', nombre: 'Señor' },
  { id: 'abuela', nombre: 'Abuela' },
  { id: 'abuelo', nombre: 'Abuelo' },
  { id: 'joven', nombre: 'Joven' },
  { id: 'angelito', nombre: 'Angelito' },
];
export const IDS_AVATAR = AVATARES.map((a) => a.id);

const P = {
  nina:     { piel: '#F3CBA8', ropa: '#FFFFFF', borde: '#E3D6C4', pelo: '#6B4226' },
  nino:     { piel: '#E8B48E', ropa: '#9CC3E6', borde: '#7FA9D2', pelo: '#3B2A20' },
  senora:   { piel: '#F0C29E', ropa: '#E79DB3', borde: '#CF7F98', pelo: '#8A5A3B' },
  senor:    { piel: '#D9A27A', ropa: '#3F6EA6', borde: '#30588A', pelo: '#2E2420' },
  abuela:   { piel: '#F2CDB0', ropa: '#B6A7DE', borde: '#9686C6', pelo: '#D2D2D8' },
  abuelo:   { piel: '#E2B08C', ropa: '#92B28C', borde: '#77976F', pelo: '#C9C9CE' },
  joven:    { piel: '#C98E66', ropa: '#E6C57F', borde: '#C9A55E', pelo: '#2B1E18' },
  angelito: { piel: '#F6D2B5', ropa: '#FFFDF6', borde: '#E6D9BE', pelo: '#E8C26A' },
};

const cara = (p) => `
  <rect x="17" y="21" width="6" height="7" rx="2" fill="${p.piel}"/>
  <circle cx="20" cy="16" r="9.5" fill="${p.piel}"/>
  <circle cx="16.4" cy="16.6" r="1.15" fill="#3A2B22"/><circle cx="23.6" cy="16.6" r="1.15" fill="#3A2B22"/>
  <circle cx="14.4" cy="19.6" r="1.9" fill="#F29A9A" opacity=".45"/><circle cx="25.6" cy="19.6" r="1.9" fill="#F29A9A" opacity=".45"/>
  <path d="M17.6 20.6 Q20 22.6 22.4 20.6" fill="none" stroke="#8A4B3A" stroke-width=".9" stroke-linecap="round"/>`;

const torso = (p) => `<path d="M6.5 52 V36 Q6.5 26.5 20 26.5 Q33.5 26.5 33.5 36 V52 Z" fill="${p.ropa}" stroke="${p.borde}" stroke-width=".8"/>`;

const DIBUJOS = {
  nina: (p) => `
    <path d="M10 15 Q9.5 4 20 4.5 Q30.5 4 30 15 L31.5 31 Q27 29.5 25.5 25 H14.5 Q13 29.5 8.5 31 Z" fill="${p.pelo}"/>
    <path d="M9 9 Q20 -2 31 9 L33 34 Q28 30 27 27 H13 Q12 30 7 34 Z" fill="#FFFFFF" opacity=".75"/>
    ${torso(p)}
    <path d="M15 27 L20 31 L25 27" fill="none" stroke="${p.borde}" stroke-width="1"/>
    <path d="M20 33 v6 M17.5 35.5 h5" stroke="#D4AF63" stroke-width="1.2" stroke-linecap="round"/>
    ${cara(p)}
    <path d="M10.6 15 Q11 6.5 20 6.5 Q29 6.5 29.4 15 Q25 10.5 20 11.2 Q15 10.5 10.6 15 Z" fill="${p.pelo}"/>
    <g fill="#F7C9D6" stroke="#E3A2B6" stroke-width=".5"><circle cx="12" cy="9.5" r="1.9"/><circle cx="15.5" cy="6.6" r="1.9"/><circle cx="20" cy="5.6" r="1.9"/><circle cx="24.5" cy="6.6" r="1.9"/><circle cx="28" cy="9.5" r="1.9"/></g>`,
  nino: (p) => `
    ${torso(p)}
    <path d="M16 28.5 L20 30.5 L16 32.5 Z M24 28.5 L20 30.5 L24 32.5 Z" fill="#2D4A70"/>
    ${cara(p)}
    <path d="M10.4 14.5 Q10 5 20 5.4 Q30 5 29.6 14.5 Q28 9.5 22 9.6 Q19 11.5 13 10.6 Q11 12 10.4 14.5 Z" fill="${p.pelo}"/>`,
  senora: (p) => `
    <path d="M10 15 Q9 4 20 4.5 Q31 4 30 15 Q32 24 31 30 Q27 28 26 24 H14 Q13 28 9 30 Q8 24 10 15 Z" fill="${p.pelo}"/>
    ${torso(p)}
    <g fill="#FFF3D6"><circle cx="15.5" cy="29" r="1"/><circle cx="17.6" cy="30.4" r="1"/><circle cx="20" cy="30.9" r="1"/><circle cx="22.4" cy="30.4" r="1"/><circle cx="24.5" cy="29" r="1"/></g>
    ${cara(p)}
    <path d="M10.5 15.5 Q10 6 20 6.2 Q29.5 6 29.5 14 Q24 8 15 12.5 Q12 13.5 10.5 15.5 Z" fill="${p.pelo}"/>`,
  senor: (p) => `
    ${torso(p)}
    <path d="M15.5 27 L20 33 L24.5 27 Z" fill="#FFFFFF"/>
    ${cara(p)}
    <path d="M11 17 Q11.5 26.5 20 26.8 Q28.5 26.5 29 17 Q27 22 23 22.2 Q20 20.8 17 22.2 Q13 22 11 17 Z" fill="${p.pelo}" opacity=".85"/>
    <path d="M17.6 20.9 Q20 22.4 22.4 20.9" fill="none" stroke="#F1D9C8" stroke-width=".8" stroke-linecap="round"/>
    <path d="M10.4 14 Q10 5.2 20 5.4 Q30 5.2 29.6 14 Q28.5 9.8 20 9.8 Q11.5 9.8 10.4 14 Z" fill="${p.pelo}"/>`,
  abuela: (p) => `
    <circle cx="20" cy="5.2" r="4.4" fill="${p.pelo}"/>
    ${torso(p)}
    <path d="M14 27.5 Q20 33 26 27.5" fill="none" stroke="${p.borde}" stroke-width="1.2"/>
    ${cara(p)}
    <path d="M10.4 15.5 Q10 7 20 7.2 Q30 7 29.6 15.5 Q27 10.6 20 10.8 Q13 10.6 10.4 15.5 Z" fill="${p.pelo}"/>
    <g fill="none" stroke="#8A6F55" stroke-width=".8"><circle cx="16.4" cy="16.6" r="2.6"/><circle cx="23.6" cy="16.6" r="2.6"/><path d="M19 16.4 h2"/></g>`,
  abuelo: (p) => `
    ${torso(p)}
    <path d="M14 27.5 L20 34 L26 27.5" fill="none" stroke="${p.borde}" stroke-width="1.2"/>
    ${cara(p)}
    <path d="M10.6 17 Q10 10 13 9.2 Q12.6 13 13.4 16.6 Z M29.4 17 Q30 10 27 9.2 Q27.4 13 26.6 16.6 Z" fill="${p.pelo}"/>
    <path d="M16.2 20 Q20 18.6 23.8 20 Q22 21.2 20 20.6 Q18 21.2 16.2 20 Z" fill="${p.pelo}"/>
    <g fill="none" stroke="#6E5A48" stroke-width=".8"><rect x="13.9" y="14.8" width="5" height="3.6" rx="1.2"/><rect x="21.1" y="14.8" width="5" height="3.6" rx="1.2"/><path d="M18.9 16.2 h2.2"/></g>`,
  joven: (p) => `
    ${torso(p)}
    <path d="M14.5 27 Q20 30 25.5 27" fill="none" stroke="${p.borde}" stroke-width="1.2"/>
    ${cara(p)}
    <g fill="${p.pelo}"><circle cx="12" cy="11" r="3.4"/><circle cx="15.5" cy="7.6" r="3.6"/><circle cx="20" cy="6.4" r="3.8"/><circle cx="24.5" cy="7.6" r="3.6"/><circle cx="28" cy="11" r="3.4"/><circle cx="11" cy="14.6" r="2.4"/><circle cx="29" cy="14.6" r="2.4"/></g>`,
  angelito: (p) => `
    <g fill="#FFFFFF" stroke="#E3D6BE" stroke-width=".8">
      <path d="M8 34 Q-1 26 1.5 18 Q7 22 11 30 Z"/><path d="M32 34 Q41 26 38.5 18 Q33 22 29 30 Z"/>
    </g>
    ${torso(p)}
    <path d="M14 27.5 Q20 31 26 27.5" fill="none" stroke="#E2C27A" stroke-width="1.2"/>
    ${cara(p)}
    <g fill="${p.pelo}"><circle cx="12.4" cy="11.4" r="3"/><circle cx="15.6" cy="8.2" r="3.2"/><circle cx="20" cy="7.2" r="3.3"/><circle cx="24.4" cy="8.2" r="3.2"/><circle cx="27.6" cy="11.4" r="3"/></g>
    <ellipse cx="20" cy="2.2" rx="7.5" ry="1.9" fill="none" stroke="#E2B24F" stroke-width="1.5"/>`,
};

const brazo = (p) => `
  <path d="M29.5 32.5 L35.2 19.5" stroke="${p.ropa}" stroke-width="5.6" stroke-linecap="round"/>
  <path d="M29.5 32.5 L35.2 19.5" stroke="${p.borde}" stroke-width="5.6" stroke-linecap="round" opacity=".18"/>
  <circle cx="36" cy="16.8" r="3.1" fill="${p.piel}"/>`;

/** Inserta el sprite de símbolos en el documento (una vez). */
export function construirSprite() {
  if (document.getElementById('sprite-avatares')) return;
  const simbolos = AVATARES.map(({ id }) => {
    const p = P[id];
    return `<symbol id="av-${id}" viewBox="0 0 40 52" overflow="visible">${DIBUJOS[id](p)}</symbol>
            <symbol id="av-${id}-brazo" viewBox="0 0 40 52" overflow="visible">${brazo(p)}</symbol>`;
  }).join('');
  document.body.insertAdjacentHTML('afterbegin',
    `<svg id="sprite-avatares" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">${simbolos}</svg>`);
}

/** Markup del personaje (sin datos del usuario: seguro para innerHTML). */
export function svgPersonaje(avatar) {
  const id = IDS_AVATAR.includes(avatar) ? avatar : 'nina';
  return `<svg viewBox="0 0 40 52" aria-hidden="true" focusable="false"><use href="#av-${id}"/><use class="brazo" href="#av-${id}-brazo"/></svg>`;
}
