# Primera Comunión de Mariangel — invitación web

Invitación interactiva «La iglesia que se va llenando» para el sábado 19 de diciembre de 2026.
HTML/CSS/JS con módulos ES y Firebase por CDN: **sin build**, lista para GitHub Pages.

- Invitación: `https://juanjosexg23.github.io/InvitacionMariangel/`
- Panel admin: `https://juanjosexg23.github.io/InvitacionMariangel/admin.html`

## Estructura

```
index.html          Invitación (portada, vitral, cuenta, datos, bancas, RSVP, velas, fiesta, cierre)
admin.html          Panel de administración
css/styles.css      Estilos de la invitación (y tokens que reutiliza el panel)
css/admin.css       Estilos del panel
js/main.js          Arranque de la invitación
js/data.js          Firestore + Auth (y almacén local del modo demo)
js/firebase-config.js  ← aquí va el firebaseConfig real
js/defaults.js      Valores por defecto del evento (la fuente de verdad es Firestore)
js/…                portada, altar (vitral), cuenta, bancas, avatares, rsvp, velas, fiesta, compartir, admin
assets/             favicon, og-image.jpg (vista previa de WhatsApp), mariangel.webp (foto de respaldo, opcional)
firestore.rules     Reglas de seguridad
herramientas/og.html  Plantilla para regenerar assets/og-image.jpg
```

## Verla en local

Los módulos ES necesitan un servidor (no abras el archivo con doble clic):

```
python -m http.server 8765
```

| URL | Para qué |
|---|---|
| `index.html?demo=1` | Modo demo: datos falsos, invitados simulados que llegan en vivo |
| `&saltar=1` | Saltar la portada |
| `&reiniciar=1` | Borrar los datos locales del demo |
| `&vista=puertas` | Ver las puertas abiertas y quietas (depuración) |
| `admin.html?demo=1` | Panel en modo demo (sin login; los cambios se ven en vivo en la pestaña de la invitación demo) |

Mientras `js/firebase-config.js` tenga los marcadores `PEGAR_...`, todo funciona en modo local.

## Publicar en GitHub Pages

1. Sube los cambios a la rama `main` (`git push`).
2. GitHub → Settings → Pages → *Deploy from a branch* → `main` / `(root)`.
3. En 1–2 minutos queda en `https://juanjosexg23.github.io/InvitacionMariangel/`.
4. Ese dominio (`juanjosexg23.github.io`) debe estar en Firebase → Authentication → Settings → *Authorized domains*.

> WhatsApp guarda en caché la vista previa del enlace la primera vez que lo ve. Comparte el enlace solo cuando la foto y los datos estén listos.

## Usar el panel (admin.html)

- **Entrar** con el correo y contraseña del usuario administrador (solo existe uno; no hay registro).
- **Evento**: edita textos, fecha, misa, fiesta (con interruptor para mostrarla), frase, fecha límite, WhatsApp,
  «Registro abierto» y «Reabrir aunque pasó la fecha límite». Pulsa **Guardar cambios**: la invitación se actualiza en vivo.
- **Foto**: «Subir o cambiar foto» la reduce en el navegador (máx. 900 px, WebP/JPEG 0.82) y se guarda dentro de
  `config/evento.foto` (no usa Firebase Storage). Si no hay foto se usa `assets/mariangel.webp` y si tampoco existe, la silueta.
- **Invitados**: lista en vivo, búsqueda, totales, «Quitar mensaje», «Eliminar» (con confirmación), velas y **Exportar CSV** (abre en Excel).
- **Compartir**: enlace y mensaje de WhatsApp listo para copiar o abrir.

La primera vez que entras, el panel crea `config/evento` con los valores por defecto (las reglas lo necesitan para permitir confirmaciones).

## Seguridad (firestore.rules)

- `config/evento`: lectura pública, escritura solo admin.
- `confirmaciones/{uid}`: lectura pública; crear/editar solo el dueño (uid anónimo del dispositivo) con el registro abierto,
  validando campos, tipos y longitudes; el admin puede quitar mensajes; borrar: dueño o admin.
- `velas/{uid}`: lectura pública; una por dispositivo; borrar solo admin.
- `isAdmin()` exige proveedor `password` y el UID del administrador (`UID_DEL_ADMIN` en el archivo).
- La fecha límite se aplica en la página; para cerrar del todo, apaga «Registro abierto» en el panel.

### App Check (opcional, anti-bots)

1. Google reCAPTCHA admin → crear clave **reCAPTCHA v3** para `juanjosexg23.github.io`.
2. Firebase → App Check → registrar la app web con esa clave (proveedor reCAPTCHA v3).
3. Pegar la *site key* en `APP_CHECK_SITE_KEY` de `js/firebase-config.js` y publicar.
4. Revisar en App Check → Firestore las métricas unos días; cuando casi todo sea «verificado», pulsar **Enforce**.
