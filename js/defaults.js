// Valores por defecto del evento.
// La fuente de verdad es Firestore (config/evento); esto solo se usa
// mientras carga, en modo demo, o si un campo no existe todavía.

export const EVENTO_DEFECTO = Object.freeze({
  // Textos principales
  nombre: 'Mariangel',
  apellidos: 'Gómez Roldán',
  tituloPortada: 'Mi Primera Comunión',
  mensajeInvitacion:
    'Con inmensa alegría te invito a acompañarme el día en que recibiré a Jesús por primera vez.',
  fecha: '2026-12-19', // AAAA-MM-DD (hora de Colombia)

  // Misa
  misaHora: '10:00', // HH:MM 24 h
  misaLugar: 'Parroquia Nuestra Señora de La Asunción',
  misaDireccion: 'Parque principal de Copacabana, Antioquia',
  misaMaps:
    'https://www.google.com/maps/search/?api=1&query=Parroquia%20Nuestra%20Se%C3%B1ora%20de%20La%20Asunci%C3%B3n%20Copacabana%20Antioquia',

  // Compartir / fiesta
  fiestaMostrar: true,
  fiestaTitulo: 'Después de la misa, compartimos',
  fiestaDescripcion: 'Celebraremos juntos con un almuerzo, música y mucha alegría.',
  fiestaHora: '', // vacío = por definir
  fiestaLugar: '',
  fiestaDireccion: '',
  fiestaMaps: '',
  fiestaPendienteTexto: 'Muy pronto te contamos el lugar y la hora.',

  // Frase
  fraseTexto:
    'Jesús les dijo: Yo soy el pan de vida; el que a mí viene, nunca tendrá hambre; y el que en mí cree, no tendrá sed jamás.',
  fraseCita: 'Juan 6:35',

  // Confirmaciones
  fechaLimite: '2026-12-01', // último día para confirmar (inclusive)
  registroAbierto: true,
  whatsapp: '573002513594', // (con indicativo, sin +)

  // Cierre
  mensajeCierre: 'Gracias por acompañarnos',

  // Foto (data URL subida desde el panel). Vacío = respaldo assets/mariangel.webp o silueta.
  foto: '',
});

export const ZONA_HORARIA = 'America/Bogota';
export const OFFSET_COLOMBIA = '-05:00'; // Colombia no usa horario de verano
