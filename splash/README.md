# Odložený kůň

Tohle je všechno, co zbylo z koňské verze aplikace. **Nepoužívá se** — hlavní
aplikace jede na souhvězdích. Leží to tu, aby se k tomu šlo vrátit.

## Co tu je

| Soubor | Co to je |
|---|---|
| `horse-stand.png` | Stojící kůň, 438×460, průhledné pozadí. Vygenerováno v ChatGPT. |
| `horse-run.png` | Kůň ve skoku, 531×460. Chyběly k tomu další fáze cvalu. |
| `prep.py` | Zpracování vygenerovaných obrázků: odstraní bílé pozadí záplavou od okrajů (bílé odznaky a lysina zůstanou), změkčí okraj, ořízne na obrys a zmenší box filtrem s přednásobenou alfou. |
| `sprite.py` | Pixelový kůň 64×46: tvar po řádcích, celové stínování podle tvaru, obrys, prameny hřívy, čtyři fáze cvalu. |
| `scene.py` | Pixelová dostihová dráha 180×80 a export spritesheetu. |

## Kdyby se to mělo vrátit

```bash
python3 prep.py 460          # z ~/Downloads/kun1.png, kun2.png
python3 scene.py             # pixelová varianta
```

Obrázky se pak vrací do `assets/` a v aplikaci se na ně odkazuje.
Poslední verze aplikace s koněm je commit `0df2169` (dostih po dráze).
