// Datos falsos para el modo demo (?demo=1). Solo se carga en ese modo.

const NOMBRES = ['Ana', 'Luisa', 'Camila', 'Valentina', 'Sofía', 'Isabella', 'Mariana', 'Daniela', 'Paula', 'Laura',
  'Gloria', 'Marta', 'Rosa', 'Beatriz', 'Carmen', 'Juan', 'Andrés', 'Carlos', 'Santiago', 'Mateo', 'Samuel',
  'Felipe', 'Jorge', 'Luis', 'Alejandro', 'Sebastián', 'Tomás', 'Emilio', 'Hernán', 'Óscar', 'Lucía', 'Sara',
  'Manuela', 'Antonella', 'Martín', 'Jerónimo', 'Esteban', 'Natalia', 'Catalina', 'Diego'];
const APELLIDOS = ['Gómez', 'Roldán', 'Restrepo', 'Ospina', 'Zapata', 'Muñoz', 'Arango', 'Vélez', 'Londoño', 'Cardona',
  'Henao', 'Mejía', 'Correa', 'Echeverri', 'Álvarez', 'Uribe', 'Jaramillo', 'Montoya', 'Posada', 'Betancur'];
const MENSAJES = [
  'Que Jesús siempre habite en tu corazón, Mariangel. ¡Te queremos mucho!',
  'Qué alegría acompañarte en este día tan especial. Dios te bendiga.',
  'Felicitaciones, princesa. Que este sea el comienzo de una vida llena de fe.',
  'Ahí estaremos con todo el amor del mundo.',
  'Que la luz de Dios te guíe siempre. Un abrazo gigante.',
  '¡Qué orgullo tan grande! Te amamos.',
  'Bendiciones para ti y para toda la familia.',
  'Que nunca te falte el Pan de Vida. ¡Felicidades!',
  '',
  '',
  '',
  'No nos lo perdemos por nada. ❤',
  'Que la Virgen te cubra con su manto. Te queremos.',
];
const AVATARES = ['nina', 'nino', 'senora', 'senor', 'abuela', 'abuelo', 'joven', 'angelito'];

let semilla = 7;
const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
const elegir = (arr) => arr[Math.floor(azar() * arr.length)];

function confirmacionFalsa(t) {
  const personas = azar() < 0.35 ? 1 : 1 + Math.floor(azar() * 4);
  const acompanantes = Array.from({ length: personas - 1 }, () => (azar() < 0.7 ? elegir(NOMBRES) : ''));
  return {
    nombre: `${elegir(NOMBRES)} ${elegir(APELLIDOS)} ${elegir(APELLIDOS)}`,
    acompanantes,
    personas,
    mensaje: elegir(MENSAJES),
    avatar: elegir(AVATARES),
    creadoEn: t,
    actualizadoEn: t,
  };
}

/** Colecciones iniciales del demo. */
export function sembrar() {
  const ahora = Date.now();
  const confirmaciones = {};
  for (let i = 0; i < 44; i++) confirmaciones[`demo-${i}`] = confirmacionFalsa(ahora - (44 - i) * 3600e3 * 7);
  const velas = {};
  for (let i = 0; i < 31; i++) {
    velas[`demo-v${i}`] = { nombre: azar() < 0.6 ? elegir(NOMBRES) : '', creadoEn: ahora - (31 - i) * 3600e3 * 9 };
  }
  return { confirmaciones, velas };
}

/** Simula invitados que llegan en vivo mientras miras la demo. */
export function simularLlegadas({ agregarConfirmacion, agregarVela }) {
  semilla = (Date.now() % 100000) + 11;
  let n = 0;
  const tic = () => {
    if (n++ > 40) return;
    if (azar() < 0.7) agregarConfirmacion(`demo-vivo-${Date.now()}`, confirmacionFalsa(Date.now()));
    else agregarVela(`demo-vivo-v${Date.now()}`, { nombre: azar() < 0.5 ? elegir(NOMBRES) : '', creadoEn: Date.now() });
    setTimeout(tic, 7000 + azar() * 9000);
  };
  setTimeout(tic, 6000);
}
