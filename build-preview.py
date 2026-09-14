#!/usr/bin/env python3
"""Sloučí appku do jednoho HTML souboru (náhled / Artifact). Obrázky jako data URI."""
import re, sys, base64, pathlib
out = pathlib.Path(sys.argv[1])
html = open('index.html', encoding='utf-8').read()
css  = open('styles.css', encoding='utf-8').read()
app  = open('app.js', encoding='utf-8').read()

assets = {f'assets/{k}.png': 'data:image/png;base64,' +
          base64.b64encode(open(f'assets/{k}.png', 'rb').read()).decode()
          for k in ('horse-stand', 'horse-run')}
for path, uri in assets.items():
    app = app.replace(f"'{path}'", f'ASSETS["{path}"]')
app = app.replace("if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});", "")
app = "const ASSETS = " + repr(assets).replace("'", '"') + ";\n" + app

body = html.split('<body>', 1)[1].split('</body>', 1)[0]
body = re.sub(r'<script src="[^"]+"></script>', '', body).strip()
out.write_text('<title>Polárka</title>\n<style>\n' + css + '\n</style>\n\n' + body +
               '\n\n<script>\n' + app + '\n</script>\n', encoding='utf-8')
print(out, out.stat().st_size, 'B')
