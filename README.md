# Stáj Tiffany 🐴

Hravý osobní organizér a plánovač pro dítě na 1. stupni, které má rádo koně.
Běží jako **webová appka (PWA)** přidaná na plochu iPhonu — vypadá a chová se
jako normální aplikace, funguje offline a **všechna data zůstávají v telefonu**.

- Žádný server, žádná registrace, žádné náklady.
- Žádné sledování, žádné reklamy, žádné nákupy.
- Celé to je pár statických souborů (HTML/CSS/JS).

## Jak to funguje

Jádro je **dnešní dostih**. Dnešní úkoly jsou dráha: každý splněný úkol
posune koně o kus blíž k cíli a zároveň se o něj nějak postará. Ráno je kůň
zanedbaný — špinavý, s rozcuchanou hřívou a přerostlými kopyty. Postupně ho
nakrmíš, napojíš, umyješ, vyčešeš, okováš a osedláš; po posledním úkolu
proběhne cílem s rozetou. Žádné krmení za body nezávisle na úkolech.

| Prvek | Popis |
|---|---|
| 🏁 **Dnešní dostih** | Úkoly = dráha. Každé splnění = posun + jeden krok péče (seno, voda, mytí, hříva, kopyta, sedlo, cíl). |
| 🐴 **Stav koně** | Mění se s postupem: špína mizí, hříva se vyčeše, kopyta se zkrátí, kůň se probudí a rozzáří. |
| 🧲 **Podkovy** | Za splněný úkol. Slouží jako zkušenosti i jako měna v obchodě. |
| ⭐ **Úrovně** | 10 stupňů: Hříbátko → … → Legenda stáje. |
| 🔥 **Série** | Počet dní v řadě, kdy dojela do cíle. |
| 🎁 **Cíl týdne** | Rodiče nastaví počet podkov a odměnu, na které se doma domluvíte. |
| 🏅 **Odznaky** | 12 achievementů (první dostih, týden v řadě, 10 úkolů do školy…). |
| 🗓️ **Rozvrh** | Pevný rozvrh 3. třídy na celý rok. Domácí úkol se přidá klepnutím na předmět. |
| ✏️ **Vlastní úkoly** | Sama si přidá úkol: název, obrázek, kategorii, hodnotu a jak často. |
| 🎨 **Obchod** | Doplňky, barvy srsti, hřívy a čtyři scény stáje (louka, západ, hory, noc). |

Za splnění všech dnešních úkolů je bonus **+15 podkov**.

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
- `app.js` — logika, data, ekonomika, obrazovky, dostih
- `horse.js` — parametrický SVG kůň (barvy, hříva, doplňky, stav péče 0–5)
- `build-preview.py` — sloučí appku do jednoho HTML souboru na náhled
- `sw.js` — service worker (offline režim)
- `make_icons.py` — generátor ikon (podkova)

Data v `localStorage` pod klíčem `tiffany.stable.v1`.

Po změně souborů zvyšte `V` v `sw.js`, aby si telefon stáhl novou verzi.
