# Polárka ✨

Plánovač úkolů pro dítě na 1. stupni. Jméno má po Severce — hvězdě, podle které
se lidi odjakživa orientovali. **Každý splněný úkol rozsvítí na obloze jednu
hvězdu.** Když se rozsvítí všechny, souhvězdí je celé.

Běží jako **webová appka (PWA)** přidaná na plochu iPhonu — vypadá a chová se jako
normální aplikace, funguje offline a **všechna data zůstávají v telefonu**.

- Žádný server, žádná registrace, žádné náklady.
- Žádné sledování, žádné reklamy, žádné nákupy.
- Celé to je pár statických souborů (HTML/CSS/JS).

## Jak to funguje

| Prvek | Popis |
|---|---|
| ✨ **Dnešní souhvězdí** | Hvězdy jsou dnešní úkoly — školní i domácí dohromady. |
| 🌙 **Týdenní souhvězdí** | Úkoly na celý týden — opakující se i jednorázové s termínem „tento týden". Hvězda se rozsvítí, jakmile je úkol splněn. |
| 🔢 **Počitadlo nahoře** | Kolik hvězd má z kolika, přes obě souhvězdí dohromady. |
| ☄️ **Komety** | Bonusy za dobrovolnou práci. Přičtou se k jejímu úlovku, ale **nezvedají počet hvězd, které musí splnit** — jinak by čím víc udělá, tím hůř vypadala. Jde je splnit víckrát denně. |
| 📊 **Přehled** | Den, týden, měsíc nebo od začátku: rozsvíceno, zhaslo, úspěšnost, celá souhvězdí, komety a rozpad po jednotlivých úkolech. |
| 🗓️ **Rozvrh** | Pevný rozvrh 3. třídy. |
| ✏️ **Úkoly** | Jeden editor na všechno: název, kam patří (u školy i předmět), jak často a u jednorázových kdy to má být hotové — dnes, zítra, tento týden nebo k datu. Seznam začíná prázdný. |

### Souhvězdí se vybírá podle počtu úkolů

Katalog skutečných souhvězdí je v [`sky.js`](sky.js), indexovaný počtem hvězd:
tři úkoly dají Trojúhelník, pět Kasiopeju, sedm Velký vůz, osm Orion. Hvězdy sedí
tam, kde na obloze opravdu jsou, a jméno je vypsané pod obrazcem.

**Tvar se zamkne**, jakmile se rozsvítí první hvězda. Úkol přidaný později obrazec
nepřekreslí, jen přibude hvězda navíc — jinak by se souhvězdí měnilo pod rukama.

### Týdenní úkoly mají vlastní den obnovy

Každý týdenní úkol si nese den, kdy se jeho týden obnovuje. English může běžet
pátek→pátek, čeština pondělí→pondělí. Nastavuje se v editoru úkolu.

## Instalace na iPhone

1. Otevřít adresu aplikace v **Safari** (musí to být Safari, ne Chrome).
2. Tlačítko **Sdílet** → **Přidat na plochu**.
3. Pojmenovat a potvrdit.

Vznikne ikona na ploše. Aplikace se otevírá na celou obrazovku bez adresního řádku
a funguje i bez internetu.

> Pracujte s ikonou na ploše, ne se záložkou v Safari. Verze na ploše má vlastní,
> trvalé úložiště.

## Zálohování

Data jsou jen v telefonu. V aplikaci: **Úkoly → Pro rodiče → Záloha**. Zkopírujte text
a uložte si ho. Obnova = vložit text zpět a dát *Obnovit*.

## Vývoj

```bash
python3 -m http.server 4331
```

- `index.html` — kostra aplikace
- `styles.css` — noční téma
- `sky.js` — katalog souhvězdí a vykreslení oblohy
- `app.js` — logika, data, obrazovky
- `sw.js` — service worker (offline režim)
- `make_icons.py` — generátor ikony (noční obloha se souhvězdím)
- `splash/` — odložená koňská verze (obrázky a generátory), nepoužívá se

Po změně souborů zvyšte `?v=` u odkazů v `index.html` a `V` v `sw.js`, aby si
telefon stáhl novou verzi.
