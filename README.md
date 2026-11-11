# Primera Comunión de Mariangel — invitación web

Invitación interactiva ("La iglesia que se va llenando"). HTML/CSS/JS con módulos ES, sin build, lista para GitHub Pages.

## Verla en local
Los módulos ES necesitan un servidor (no abras el archivo con doble clic):

```
python -m http.server 8765
```

- Modo demo (datos locales, sin Firebase): http://localhost:8765/index.html?demo=1
- Saltar la portada: añade `&saltar=1`
- Ver las puertas abiertas y quietas (depuración): `&vista=puertas`
- Volver a empezar el demo (borra confirmaciones/velas locales): `&reiniciar=1`

En modo demo llegan invitados simulados cada pocos segundos para ver cómo se llenan las bancas.

> Mientras `js/firebase-config.js` tenga los marcadores `PEGAR_...`, la página usa los valores por defecto de `js/defaults.js`.

## Estado
- [x] Etapa (a): portada, vitral, cuenta regresiva y datos
- [x] Etapa (b): bancas en vivo, confirmación (RSVP) y velas
- [ ] Etapa (c): de la misa a la fiesta y cierre
- [ ] Etapa (d): panel admin, reglas de Firestore y guía de publicación

## Imagen de vista previa (WhatsApp)
`assets/og-image.jpg` (1200×630) se genera desde `herramientas/og.html`. La etiqueta `og:image` de `index.html` debe llevar la URL **absoluta** del sitio publicado.
