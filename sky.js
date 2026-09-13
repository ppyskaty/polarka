/* ==========================================================================
   Noční obloha: katalog skutečných souhvězdí a jejich vykreslení.
   Souřadnice jsou 0–1 v obou osách a odpovídají tvaru na obloze.
   ========================================================================== */
(function (global) {

const CAT = {
  2:  { n:'Blíženci',     p:[[.34,.30],[.66,.62]], l:[[0,1]] },
  3:  { n:'Trojúhelník',  p:[[.14,.76],[.86,.72],[.50,.18]], l:[[0,1],[1,2],[2,0]] },
  4:  { n:'Jižní kříž',   p:[[.50,.08],[.50,.92],[.16,.52],[.84,.44]], l:[[0,1],[2,3]] },
  5:  { n:'Kasiopeja',    p:[[.06,.32],[.28,.76],[.50,.28],[.72,.80],[.94,.26]],
        l:[[0,1],[1,2],[2,3],[3,4]] },
  6:  { n:'Lyra',         p:[[.52,.06],[.28,.30],[.37,.54],[.67,.44],[.44,.86],[.74,.76]],
        l:[[0,1],[0,2],[2,3],[2,4],[4,5],[5,3]] },
  7:  { n:'Velký vůz',    p:[[.90,.22],[.90,.58],[.70,.64],[.68,.32],[.49,.26],[.30,.36],[.10,.56]],
        l:[[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,6]] },
  8:  { n:'Orion',        p:[[.74,.18],[.26,.20],[.39,.50],[.51,.54],[.63,.58],[.68,.90],[.21,.86],[.50,.04]],
        l:[[7,0],[7,1],[0,4],[1,2],[2,3],[3,4],[4,5],[2,6]] },
  9:  { n:'Labuť',        p:[[.50,.04],[.50,.26],[.50,.50],[.50,.72],[.50,.96],[.24,.34],[.05,.23],[.76,.38],[.95,.27]],
        l:[[0,1],[1,2],[2,3],[3,4],[2,5],[5,6],[2,7],[7,8]] },
  10: { n:'Pegas',        p:[[.30,.16],[.74,.14],[.78,.60],[.32,.62],[.18,.78],[.05,.93],[.13,.04],[.90,.24],[.96,.45],[.60,.90]],
        l:[[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[0,6],[1,7],[7,8],[2,9]] },
  11: { n:'Štír',         p:[[.12,.10],[.20,.24],[.30,.20],[.34,.38],[.42,.54],[.52,.66],[.64,.74],[.76,.76],[.86,.68],[.90,.54],[.82,.44]],
        l:[[0,1],[1,2],[1,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10]] },
  12: { n:'Kentaur',      p:[[.10,.30],[.22,.22],[.34,.32],[.30,.50],[.42,.62],[.54,.54],[.62,.38],[.74,.30],[.84,.42],[.78,.60],[.66,.72],[.50,.84]],
        l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[4,11]] }
};

/* Volné rozestavení hvězd, dokud se souhvězdí neukáže. Hvězda číslo k sedí
   vždy na stejném místě, takže přidání úkolu ostatními nehne. */
const SCATTER = [[.14,.24],[.41,.15],[.67,.22],[.89,.33],[.09,.50],[.35,.44],[.60,.52],
                 [.85,.58],[.21,.74],[.47,.80],[.73,.76],[.95,.18],[.06,.84],[.33,.64]];
const scatterAt = i => SCATTER[i % SCATTER.length];

const pickFor = n => CAT[n] || null;
const isReal = n => !!CAT[n];
const nameFor = n => (pickFor(n) || CAT[12]).n;

/* drobné hvězdy v pozadí — vždy stejné, ať obloha „neposkakuje" */
function dust(seed, w, h, count) {
  let s = seed, out = '';
  const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < count; i++) {
    const x = rnd() * w, y = rnd() * h, r = .4 + rnd() * 1.1, o = .18 + rnd() * .5;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}"
             fill="#EAF0FF" opacity="${o.toFixed(2)}"/>`;
  }
  return out;
}

/**
 * @param {object} o {n, done, h, flash, comets, uid, base}
 * base = počet hvězd, podle kterého se vybral obrazec (zamyká tvar, když úkolů přibude)
 */
function skySVG(o) {
  const n = Math.max(0, o.n | 0), done = Math.max(0, Math.min(n, o.done | 0));
  const h = o.h || 190, W = 320, u = o.uid || 's';
  const revealed = !!o.revealed;
  const shape = revealed ? (pickFor(o.base || n) || CAT[12]) : null;
  const figN = revealed ? Math.min(n, shape.p.length) : 0;
  const extra = revealed ? n - figN : 0;

  const PADX = 34, PADY = 28, EXTRA_H = extra > 0 ? 34 : 0;
  const figH = h - PADY * 2 - EXTRA_H;
  const box = p => [PADX + p[0] * (W - PADX * 2), PADY + p[1] * figH];
  const loose = p => [PADX + p[0] * (W - PADX * 2), PADY + p[1] * (h - PADY * 2)];

  const P = [], from = [];
  for (let i = 0; i < n; i++) {
    const sc = loose(scatterAt(i));
    let pos;
    if (!revealed) pos = sc;
    else if (i < figN) pos = box(shape.p[i]);
    else {
      const k = i - figN, span = Math.min(extra, 6);
      pos = [46 + ((k % span) * 30), h - 17 - (k >= span ? 16 : 0)];
    }
    P.push(pos);
    from.push([sc[0] - pos[0], sc[1] - pos[1]]);
  }

  const lines = revealed ? (shape.l || []).filter(([a, b]) => a < figN && b < figN).map(([a, b]) =>
    `<line x1="${P[a][0].toFixed(1)}" y1="${P[a][1].toFixed(1)}"
      x2="${P[b][0].toFixed(1)}" y2="${P[b][1].toFixed(1)}" class="cl on"/>`).join('') : '';

  const stars = P.map(([x, y], i) => {
    const on = i < done, pop = o.flash === i, ex = revealed && i >= figN;
    const mv = o.glide ? ` style="--dx:${from[i][0].toFixed(1)}px;--dy:${from[i][1].toFixed(1)}px"` : '';
    return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
      <g class="mv"${mv}><g class="st ${on ? 'on' : 'off'} ${pop ? 'pop' : ''} ${ex ? 'ex' : ''}"
        style="--d:${(i % 5) * .7}s">
        ${on ? `<circle class="ring" r="6"/>
          <circle class="halo" r="${ex ? 11 : 15}"/><circle class="glow" r="${ex ? 5 : 6.5}"/>
          <path class="spark" d="M0 -13 L1.5 -1.5 L13 0 L1.5 1.5 L0 13 L-1.5 1.5 L-13 0 L-1.5 -1.5 Z"/>
          <circle class="core" r="${ex ? 2.6 : 3.2}"/>` : `<circle class="core" r="${ex ? 2 : 2.3}"/>`}
      </g></g></g>`;
  }).join('');

  const comets = (o.comets || 0) > 0 ? Array.from({ length: Math.min(o.comets, 4) }, (_, i) => {
    const x = W - 40 - i * 52, y = 46 + (i % 2) * 26;
    return `<g class="cm" style="--d:${i * .5}s" transform="translate(${x},${y})">
      <path class="tail" d="M3 -2 L-34 15 L-30 20 L1 3 Z" fill="url(#ct-${u})"/>
      <circle class="chalo" r="11"/><circle class="chead" r="3.6"/>
      <circle class="cspark" r="1.4" cx="-9" cy="4"/></g>`;
  }).join('') : '';

  return `<svg viewBox="0 0 ${W} ${h}" class="sky-svg" aria-hidden="true">
    <defs>
      <radialGradient id="sg-${u}" cx="72%" cy="6%" r="118%">
        <stop offset="0" stop-color="#3E4684"/><stop offset="38%" stop-color="#212a5e"/>
        <stop offset="100%" stop-color="#0A0D28"/></radialGradient>
      <linearGradient id="mw-${u}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#8FA0E8" stop-opacity="0"/>
        <stop offset=".5" stop-color="#A7B4F0" stop-opacity=".16"/>
        <stop offset="1" stop-color="#8FA0E8" stop-opacity="0"/></linearGradient>
      <linearGradient id="ct-${u}" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#FFE6A8" stop-opacity=".85"/>
        <stop offset=".55" stop-color="#FFD98A" stop-opacity=".28"/>
        <stop offset="1" stop-color="#FFD98A" stop-opacity="0"/></linearGradient>
      <filter id="bl-${u}" x="-40%" y="-60%" width="180%" height="220%">
        <feGaussianBlur stdDeviation="9"/></filter>
    </defs>
    <rect width="${W}" height="${h}" fill="url(#sg-${u})"/>
    <ellipse cx="${W * .38}" cy="${h * .42}" rx="${W * .62}" ry="${h * .30}"
      transform="rotate(-19 ${W * .38} ${h * .42})" fill="url(#mw-${u})" filter="url(#bl-${u})"/>
    ${dust((o.base || n) * 977 + h, W, h, 54)}
    ${lines}${stars}${comets}
  </svg>`;
}

/* Jméno platí pro obrazec. Hvězdy navíc do souhvězdí nepatří a je to přiznané. */
function label(base, total) {
  const shape = pickFor(base || total) || CAT[12];
  const nm = isReal(base || total) ? shape.n : 'Vlastní souhvězdí';
  const extra = Math.max(0, (total || 0) - Math.min(total, shape.p.length));
  if (!extra) return nm;
  return `${nm} + ${extra} ${extra === 1 ? 'hvězda' : extra <= 4 ? 'hvězdy' : 'hvězd'} navíc`;
}

global.Sky = { svg: skySVG, nameFor, label, isReal, CAT };
})(window);
