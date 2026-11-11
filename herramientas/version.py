"""Marca una versión nueva en todos los CSS/JS para evitar mezclas de caché.

Uso (desde la carpeta del proyecto):  python herramientas/version.py
Cambia ?v=... en index.html, admin.html y en todos los import de js/*.js.
Ejecutarlo SIEMPRE antes de publicar (git push).
"""
import pathlib
import re
import time

RAIZ = pathlib.Path(__file__).resolve().parent.parent
V = time.strftime('%Y%m%d%H%M%S')

# Referencias en HTML: css/*.css y js/*.js (con o sin ?v=)
patron_html = re.compile(r'((?:css|js)/[\w-]+\.(?:css|js))(?:\?v=\w+)?')
# Imports en JS: './modulo.js' (estático o dinámico), con o sin ?v=
patron_js = re.compile(r"""(['"]\./[\w-]+\.js)(?:\?v=\w+)?(['"])""")

for nombre in ('index.html', 'admin.html'):
    p = RAIZ / nombre
    s = p.read_text(encoding='utf-8')
    p.write_text(patron_html.sub(lambda m: f'{m.group(1)}?v={V}', s), encoding='utf-8')

for p in (RAIZ / 'js').glob('*.js'):
    s = p.read_text(encoding='utf-8')
    p.write_text(patron_js.sub(lambda m: f'{m.group(1)}?v={V}{m.group(2)}', s), encoding='utf-8')

print('versión', V)
