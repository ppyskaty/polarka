#!/usr/bin/env python3
"""Sloučí appku do jednoho HTML souboru (náhled / Artifact)."""
import re, sys, pathlib
out_path = pathlib.Path(sys.argv[1])
html  = open('index.html', encoding='utf-8').read()
css   = open('styles.css', encoding='utf-8').read()
horse = open('horse.js',  encoding='utf-8').read()
app   = open('app.js',    encoding='utf-8').read()
app = app.replace("if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});", "")
body = html.split('<body>', 1)[1].split('</body>', 1)[0]
body = re.sub(r'<script src="[^"]+"></script>', '', body).strip()
out_path.write_text(
  '<title>Stáj Tiffany</title>\n<style>\n' + css + '\n</style>\n\n' + body +
  '\n\n<script>\n' + horse + '\n</script>\n<script>\n' + app + '\n</script>\n', encoding='utf-8')
print(out_path, out_path.stat().st_size, 'B')
