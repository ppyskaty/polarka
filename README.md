# Stáj Tiffany 🐴

Hravý osobní organizér a plánovač pro dítě na 1. stupni, které má rádo koně.
Běží jako **webová appka (PWA)** přidaná na plochu iPhonu — vypadá a chová se
jako normální aplikace, funguje offline a **všechna data zůstávají v telefonu**.

- Žádný server, žádná registrace, žádné náklady.
- Žádné sledování, žádné reklamy, žádné nákupy.
- Celé to je pár statických souborů (HTML/CSS/JS).

## Jak to funguje

Jediná mechanika: **dnešní dostih**. Dnešní úkoly jsou dráha. Každý splněný
úkol rozeběhne koně o kus blíž k cílové vlajce; poslední úkol znamená cíl.
Nic jiného — žádná měna, žádný obchod, žádné úrovně, žádné odznaky.

| Prvek | Popis |
|---|---|
| 🏁 **Dnešní dostih** | Úkoly = dráha. Splněný úkol = posun a cvalová animace. Všechno hotovo = cíl a konfety. |
| 🔥 **Série** | Počet dní v řadě, kdy dojela do cíle. |
| 📊 **Přehled** | Záložka *Týden* přepíná mezi týdnem a měsícem a listuje do minulosti: splněno / nesplněno / úspěšnost, dojeté dostihy, kalendář dnů a rozpad po jednotlivých úkolech. |
| 🎁 **Cíl týdne** | Kolik dnů v týdnu má dojet do cíle a co za to. Nastaví rodiče. |
| 🗓️ **Rozvrh** | Pevný rozvrh 3. třídy. Domácí úkol se přidá klepnutím na předmět. |
| ✏️ **Vlastní úkoly** | Název, obrázek, kategorie a jak často. Bez bodování — úkol je úkol. |

## Grafika

Pixel art, kreslený po pixelech ve složce `pixel/`:

- `pixel/sprite.py` — kůň 64×46 px: tvar po řádcích, celové stínování podle
  tvaru, obrys, prameny hřívy a ocasu, čtyři fáze cvalu.
- `pixel/scene.py` — dráha 180×80 px: obloha s ditheringem na přechodech,
  slunce, mraky, kopce s lesní siluetou, ohradník, tráva, hlína, cílová vlajka.

Obojí generuje PNG do `assets/`. Po úpravě spusťte `python3 pixel/scene.py`
(vyrobí scénu i spritesheet) a zvyšte `V` v `sw.js`.

## Instalace na iPhone

1. Otevřít adresu aplikace v **Safari** (musí to být Safari, ne Chrome).
2. Tlačítko **Sdílet** (čtvereček se šipkou) → **Přidat na plochu**.
3. Pojmenovat „Stáj" → **Přidat**.

Tím vznikne ikona na ploše. Aplikace se otevírá na celou obrazovku bez
adresního řádku a funguje i bez internetu.

> Důležité: pracujte s ikonou na ploše, ne se záložkou v Safari. Verze na ploše
> má vlastní, trvalé úložiště.

## Zálohování

Data jsou jen v telefonu. V aplikaci: **Úkoly → Pro rodiče a nastavení → Záloha**.
Zkopírujte text a uložte si ho (e-mail, poznámky). Obnova = vložit text zpět a dát
*Obnovit ze zálohy*. Doporučeno jednou za čas, ať se při výměně telefonu nic neztratí.

## Vývoj / úpravy

```bash
python3 -m http.server 4331
```

Pak otevřít `http://localhost:4331`.

Struktura:

- `index.html` — kostra aplikace
- `styles.css` — vzhled
- `app.js` — logika, data, obrazovky, dostih
- `assets/` — vygenerované pixelové PNG (scéna a spritesheet koně)
- `build-preview.py` — sloučí appku do jednoho HTML souboru na náhled
- `sw.js` — service worker (offline režim)
- `make_icons.py` — generátor ikon (podkova)

Data v `localStorage` pod klíčem `tiffany.stable.v1`.

Po změně souborů zvyšte `V` v `sw.js`, aby si telefon stáhl novou verzi.
