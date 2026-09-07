# Stáj Tiffany 🐴

Hravý osobní organizér a plánovač pro dítě na 1. stupni, které má rádo koně.
Běží jako **webová appka (PWA)** přidaná na plochu iPhonu — vypadá a chová se
jako normální aplikace, funguje offline a **všechna data zůstávají v telefonu**.

- Žádný server, žádná registrace, žádné náklady.
- Žádné sledování, žádné reklamy, žádné nákupy.
- Celé to je pár statických souborů (HTML/CSS/JS).

## Jak to funguje

| Prvek | Popis |
|---|---|
| 🧲 **Podkovy** | Měna. Za splněný úkol dostane podkovy podle jeho hodnoty. |
| ⭐ **Úrovně** | Podkovy se sčítají do zkušeností: Hříbátko → … → Legenda stáje (10 úrovní). |
| 🐴 **Vlastní kůň** | Má jméno, barvu srsti, hřívu a doplňky. Za podkovy se dá krmit a oblékat. |
| 💗 **Nálada koně** | Roste plněním úkolů a krmením, sama pomalu klesá (nikdy ne pod 35 %, kůň nikdy nestrádá). Nad 85 % dává bonus +20 % podkov. |
| 🔥 **Série** | Počet dní v řadě, kdy splnila všechny denní úkoly. |
| 🎁 **Cíl týdne** | Rodiče nastaví počet podkov a odměnu, na které se doma domluvíte. |
| 🏅 **Odznaky** | 12 achievementů (první úkol, týden v řadě, 10 úkolů do školy…). |
| ✏️ **Vlastní úkoly** | Sama si přidá úkol: název, obrázek, kategorii, hodnotu a jak často. |
| 🗓️ **Rozvrh hodin** | Zadá se jednou. Domácí úkol pak přidá jedním klepnutím na předmět, s termínem na dnes nebo na zítra. |

Denní bonus: když splní všechny dnešní úkoly, dostane **+15 podkov navíc**.

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
- `app.js` — logika, data, ekonomika, obrazovky
- `horse.js` — parametrický SVG kůň (barvy, hříva, doplňky)
- `sw.js` — service worker (offline režim)
- `make_icons.py` — generátor ikon (podkova)

Data v `localStorage` pod klíčem `tiffany.stable.v1`.

Po změně souborů zvyšte `V` v `sw.js`, aby si telefon stáhl novou verzi.
