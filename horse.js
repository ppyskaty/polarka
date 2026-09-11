/* ==========================================================================
   SVG kůň v profilu, čelem doprava. Realistické proporce:
   výška v kohoutku ≈ délka těla, nohy ≈ polovina výšky, hlava ≈ 2/5 výšky.
   Souřadnice: země y=200, kohoutek y=49, mordа x≈290.
   stage 0–5 = míra péče (0 zanedbaný → 5 vyhřebelcovaný).
   ========================================================================== */
(function (global) {

  const COATS = {
    hnedak:  { name:'Hnědák',   c:'#8B5A2F', d:'#5E3A1C', l:'#B07C48' },
    ryzka:   { name:'Ryzka',    c:'#B4652F', d:'#84461C', l:'#D68C4E' },
    vranik:  { name:'Vraník',   c:'#3B3339', d:'#231D22', l:'#5C5059' },
    belous:  { name:'Bělouš',   c:'#D9CCC0', d:'#A99788', l:'#F4EDE6' },
    plavak:  { name:'Plavák',   c:'#C99A54', d:'#9C7337', l:'#E6BE7D' },
    strakac: { name:'Strakáč',  c:'#7A5233', d:'#54351D', l:'#A2764F', pinto:true },
    grosak:  { name:'Grošák',   c:'#9A9AA0', d:'#6E6E76', l:'#C2C2C8', dapple:true },
    palomino:{ name:'Palomino', c:'#D7A85F', d:'#AE8340', l:'#F0CE8E' }
  };

  const MANES = {
    tmava:   { name:'Tmavá',    c:'#2B2019' }, svetla: { name:'Plavá',   c:'#E3CFA6' },
    ryzava:  { name:'Ryšavá',   c:'#8C4F27' }, seda:   { name:'Stříbrná',c:'#C9C4C0' },
    cerna:   { name:'Uhlová',   c:'#1C1815' }, duhova: { name:'Duhová',  c:'url(#rainbow)', rainbow:true }
  };

  /* ---------- nohy: kreslené tahy o různé šířce + kloubní klouby ---------- */
  function hoof(x, y, long, dark) {
    const h = long ? 17 : 11;
    return `<g>
      <path d="M${x - 7} ${y} L${x + 8} ${y}
               C${x + 11} ${y + 4} ${x + 11} ${y + h - 2} ${x + 10} ${y + h}
               L${x - 8} ${y + h}
               C${x - 9} ${y + h - 3} ${x - 9} ${y + 3} ${x - 7} ${y} Z" fill="${dark}"/>
      <path d="M${x - 7} ${y + 1.5} L${x + 8} ${y + 1.5}" stroke="#F2E7DA" stroke-width="2"
            opacity=".35" stroke-linecap="round"/>
      ${long ? `<path d="M${x + 1} ${y + 4} v${h - 6}" stroke="#00000055" stroke-width="1.4"/>` : ''}</g>`;
  }

  function foreleg(x, col, cls, long) {
    const d = long ? 6 : 0;
    return `<g class="${cls}" fill="none" stroke="${col}" stroke-linecap="round">
      <path d="M${x + 1} 98 L${x} 144" stroke-width="26"/>
      <path d="M${x} 142 L${x + 2} 176" stroke-width="10"/>
      <circle cx="${x}" cy="145" r="7.5" fill="${col}" stroke="none"/>
      <circle cx="${x + 2}" cy="177" r="6.2" fill="${col}" stroke="none"/>
      <path d="M${x + 2} 178 L${x + 5} ${186 + d}" stroke-width="8.5"/>
      </g><g class="${cls}">${hoof(x + 5, 186 + d, long, '#3B2C22')}</g>`;
  }

  function hindleg(x, col, cls, long) {
    const d = long ? 6 : 0;
    return `<g class="${cls}" fill="none" stroke="${col}" stroke-linecap="round">
      <path d="M${x + 17} 78 L${x + 1} 116" stroke-width="38"/>
      <path d="M${x + 1} 116 L${x - 11} 146" stroke-width="20"/>
      <path d="M${x - 10} 147 L${x - 2} 176" stroke-width="9"/>
      <circle cx="${x - 10}" cy="147" r="8" fill="${col}" stroke="none"/>
      <path d="M${x - 16} 140 L${x - 8} 152 L${x - 14} 152 Z" fill="${col}" stroke="none"/>
      <circle cx="${x - 2}" cy="177" r="6" fill="${col}" stroke="none"/>
      <path d="M${x - 2} 178 L${x + 1} ${186 + d}" stroke-width="8"/>
      </g><g class="${cls}">${hoof(x + 1, 186 + d, long, '#3B2C22')}</g>`;
  }

  /* ---------- doplňky ---------- */
  function accHead(id) {
    switch (id) {
      case 'masle': return `<g transform="translate(246,20) rotate(-18)">
          <path d="M0 0 L-13 -7 L-13 7 Z" fill="#C2415F"/><path d="M0 0 L13 -7 L13 7 Z" fill="#C2415F"/>
          <circle r="4" fill="#9E2E48"/></g>`;
      case 'kvetiny': return `<g>${[[246,22,'#C96A86'],[257,26,'#E0B04E'],[266,32,'#8E77C0']].map(([x, y, c]) => `
          <g transform="translate(${x},${y})">${[0,72,144,216,288].map(a =>
            `<ellipse cy="-4.4" rx="2.8" ry="4.2" fill="${c}" transform="rotate(${a})"/>`).join('')}
          <circle r="2.1" fill="#F5E6B0"/></g>`).join('')}</g>`;
      case 'uzdecka': return `<g fill="none" stroke="#5A3A22" stroke-width="3.2" stroke-linecap="round">
          <path d="M258 36 C266 44 274 56 280 68"/>
          <path d="M252 50 C260 58 268 64 276 68"/>
          <path d="M283 70 C288 72 290 76 288 80"/>
          <path d="M250 44 C244 52 244 62 248 70" stroke-width="2.6"/></g>`;
      case 'roh': return `<g transform="translate(262,20) rotate(28)">
          <path d="M0 -24 L5 3 L-5 3 Z" fill="#E8C356"/><path d="M0 -24 L1.8 3 L-5 3 Z" fill="#CFA636"/>
          <path d="M-4.2 0 L4.2 -1 M-3.6 -6 L3.6 -7 M-2.8 -12 L2.8 -13" stroke="#B98E24"
                stroke-width="1.4" stroke-linecap="round" fill="none"/></g>`;
      default: return '';
    }
  }

  function accBody(id) {
    switch (id) {
      case 'deka': return `<g>
          <path d="M92 56 C120 62 152 58 172 50 L182 96 C160 106 122 110 96 104 Z" fill="#3E6E96"/>
          <path d="M92 56 C120 62 152 58 172 50 L174 59 C152 67 120 71 94 65 Z" fill="#2E5878"/>
          <path d="M96 100 C122 106 158 102 180 92" stroke="#E4C15A" stroke-width="3.5" fill="none"/></g>`;
      case 'sedlo': return `<g>
          <path d="M118 52 C140 56 160 53 176 47 L180 88 C160 96 134 98 116 92 Z" fill="#6B4526"/>
          <path d="M126 44 C144 50 160 48 172 42 C178 52 178 66 174 78 C158 84 138 84 124 78
                   C120 66 121 52 126 44 Z" fill="#4E3119"/>
          <path d="M126 44 C144 50 160 48 172 42" stroke="#33200F" stroke-width="3" fill="none" stroke-linecap="round"/>
          <path d="M142 84 L138 120" stroke="#33200F" stroke-width="5"/>
          <path d="M130 118 h20 a4 4 0 0 1 4 4 v5 a3 3 0 0 1 -3 3 h-22 a3 3 0 0 1 -3 -3 v-5 a4 4 0 0 1 4 -4 Z"
                fill="#8A6234"/></g>`;
      case 'plast': return `<g>
          <path d="M86 54 C120 62 156 56 178 46 L186 104 C158 118 114 120 88 110 Z" fill="#4A3A6B"/>
          <path d="M86 54 C120 62 156 56 178 46 L180 56 C156 66 120 72 88 64 Z" fill="#362A50"/>
          ${[[104,78],[132,84],[158,76],[116,98],[146,96]].map(([x, y]) =>
            `<path d="M${x} ${y-4.5} l1.5 3 3.4.5-2.5 2.4.6 3.4-3-1.6-3 1.6.6-3.4-2.5-2.4 3.4-.5Z"
                   fill="#E8DBA0"/>`).join('')}</g>`;
      default: return '';
    }
  }

  function horseSVG(o) {
    o = o || {};
    const coat = COATS[o.coat] || COATS.hnedak;
    const M = MANES[o.mane] || MANES.tmava;
    const mc = M.c;
    const st = Math.max(0, Math.min(5, o.stage == null ? 5 : o.stage));
    const u = 'h' + Math.random().toString(36).slice(2, 7);
    const box = o.crop === 'head' ? '230 8 78 78' : '24 2 278 202';

    const mud = st === 0 ? .7 : st === 1 ? .46 : st === 2 ? .2 : 0;
    const rough = st <= 3;                       /* neupravená hříva a ocas */
    const longHoof = st <= 3;
    const gloss = st >= 3;
    const ready = st >= 5;
    const droop = st === 0 ? 7 : st === 1 ? 3.5 : 0;   /* svěšená hlava */
    const eyeOpen = st >= 1;

    const BODY = `M82 52
      C106 58 138 60 166 49
      C184 51 204 70 210 96
      C214 110 208 121 198 127
      C180 137 140 139 112 131
      C98 127 88 120 84 108
      C74 105 60 100 56 86
      C52 70 62 50 82 52 Z`;

    const NECK = `M163 51
      C188 44 220 35 250 27
      C258 31 263 38 264 47
      C243 55 225 66 214 83
      C210 89 209 93 210 98
      C196 83 177 63 163 51 Z`;

    const HEAD = `M248 25
      C258 21 269 27 275 38
      C282 50 289 63 291 73
      C293 80 289 86 282 86
      C274 86 267 81 263 75
      C257 67 251 58 247 52
      C243 45 242 33 248 25 Z`;

    const MANE = rough
      ? `M253 21 L244 28 L237 23 L227 32 L218 28 L208 37 L198 34 L188 43 L178 41 L168 51 L158 51 L150 63
         L166 67 C174 59 186 52 202 46 C222 38 242 32 256 34 Z`
      : `M253 22 C230 25 204 32 182 42 C168 49 158 56 152 62
         L166 67 C174 59 186 52 202 46 C222 38 242 32 256 34 Z`;

    const TAIL = rough
      ? `M62 55 C46 52 33 66 29 88 C24 114 30 145 41 163
         L35 146 L43 140 L36 126 L44 118 L39 104 C44 88 52 74 58 66 C62 62 63 58 62 55 Z`
      : `M62 55 C46 52 33 66 29 88 C24 114 30 145 41 163
         C38 134 43 104 56 84 C61 74 64 63 62 55 Z`;

    return `<svg viewBox="${box}" xmlns="http://www.w3.org/2000/svg" class="horse-svg" aria-label="kůň">
  <defs>
    <linearGradient id="rainbow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#C2415F"/><stop offset=".33" stop-color="#E0B04E"/>
      <stop offset=".66" stop-color="#5AA57C"/><stop offset="1" stop-color="#8E77C0"/></linearGradient>
    <linearGradient id="cg-${u}" gradientUnits="userSpaceOnUse" x1="150" y1="24" x2="168" y2="150">
      <stop offset="0" stop-color="${coat.l}"/><stop offset=".45" stop-color="${coat.c}"/>
      <stop offset="1" stop-color="${coat.d}"/></linearGradient>
    <clipPath id="cp-${u}"><path d="${BODY}"/></clipPath>
  </defs>

  <!-- odvrácené nohy -->
  ${hindleg(98, coat.d, 'lg lg-b', longHoof)}
  ${foreleg(184, coat.d, 'lg lg-b', longHoof)}

  <path d="${TAIL}" fill="${mc}"/>
  <path d="M58 62 C52 80 48 110 47 138" stroke="#00000022" stroke-width="3" fill="none"/>

  <!-- trup -->
  <path d="${BODY}" fill="url(#cg-${u})"/>
  <g clip-path="url(#cp-${u})">
    <path d="M166 50 C186 57 202 75 209 97 C198 96 186 86 176 72 C170 62 166 54 166 50 Z"
          fill="${coat.d}" opacity=".2"/>
    <ellipse cx="86" cy="82" rx="28" ry="26" fill="${coat.l}" opacity=".2"/>
    <ellipse cx="150" cy="126" rx="54" ry="16" fill="${coat.d}" opacity=".26"/>
    <path d="M88 52 C118 59 146 59 168 50" stroke="${coat.l}" stroke-width="6" opacity=".22" fill="none"/>
    <path d="M78 96 C86 106 92 114 96 124" stroke="${coat.d}" stroke-width="3" opacity=".22" fill="none"/>
    ${coat.dapple ? `<g fill="${coat.l}" opacity=".3">${
      [[96,74],[118,66],[140,70],[160,80],[104,100],[128,96],[150,104],[84,96]].map(([x, y]) =>
        `<circle cx="${x}" cy="${y}" r="6.5"/>`).join('')}</g>` : ''}
    ${coat.pinto ? `<g fill="#F4EAE0" opacity=".96">
       <path d="M108 58 C132 52 158 58 170 74 C154 86 124 88 106 78 Z"/>
       <ellipse cx="84" cy="116" rx="24" ry="15"/></g>` : ''}
    ${gloss ? `<ellipse cx="120" cy="62" rx="46" ry="7" fill="#fff" opacity=".18"/>
       <ellipse cx="92" cy="74" rx="16" ry="20" fill="#fff" opacity=".1"/>` : ''}
    ${st === 0 ? `<g stroke="${coat.d}" stroke-width="2.6" opacity=".3" fill="none">
       <path d="M150 78 C152 92 150 104 146 114"/><path d="M162 76 C164 90 162 102 158 112"/></g>` : ''}
    ${mud ? `<g fill="#4A3A22" opacity="${mud}">
       <path d="M96 112 C110 106 126 110 134 118 C120 126 104 124 96 112 Z"/>
       <ellipse cx="150" cy="120" rx="14" ry="8"/><ellipse cx="74" cy="96" rx="11" ry="8"/>
       <ellipse cx="182" cy="106" rx="9" ry="7"/><ellipse cx="116" cy="64" rx="12" ry="6"/></g>` : ''}
  </g>

  <!-- bližší nohy -->
  ${hindleg(84, coat.c, 'lg lg-a', longHoof)}
  ${foreleg(197, coat.c, 'lg lg-a', longHoof)}

  ${accBody(o.body)}

  <!-- krk, hlava, hříva -->
  <g transform="rotate(${droop} 172 54)">
    <path d="${NECK}" fill="url(#cg-${u})"/>
    <path d="M212 84 C206 72 196 60 182 50" stroke="${coat.d}" stroke-width="3" opacity=".18" fill="none"/>
    <path d="M239 30 C233 18 236 9 242 6 C247 11 248 22 245 32 Z"
          fill="${coat.d}" stroke="${coat.d}" stroke-width="2" stroke-linejoin="round"/>
    <path d="${MANE}" fill="${mc}"/>
    <path d="M250 25 C245 17 248 8 254 5 C260 10 261 21 258 30 Z"
          fill="${coat.c}" stroke="${coat.c}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M252 8 C255 12 256 20 255 26" stroke="${coat.d}" stroke-width="2.4" fill="none" opacity=".5"/>
    <path d="${HEAD}" fill="url(#cg-${u})"/>
    <path d="M251 27 C258 34 258 46 252 52 C246 48 244 34 251 27 Z" fill="${coat.d}" opacity=".16"/>
    <path d="M276 62 C284 62 290 68 291 75 C292 81 288 86 282 86 C275 86 270 80 270 73
             C270 67 272 63 276 62 Z" fill="${coat.l}" opacity=".5"/>
    <path d="M283 74 C287 73 289 76 288 79 C287 82 283 82 281 80 C280 77 281 75 283 74 Z" fill="${coat.d}"/>
    <path d="M272 84 C277 87 283 87 288 84" stroke="${coat.d}" stroke-width="1.8" fill="none"
          opacity=".55" stroke-linecap="round"/>
    <path d="M247 52 C253 62 259 70 266 76" stroke="${coat.d}" stroke-width="1.8" fill="none"
          opacity=".3" stroke-linecap="round"/>
    <path d="M253 24 C244 30 242 40 246 50" stroke="${mc}" stroke-width="5" fill="none"
          stroke-linecap="round" opacity=".9"/>
    ${eyeOpen
      ? `<g><ellipse cx="262" cy="42" rx="5" ry="4.3" transform="rotate(18 262 42)" fill="#170F0A"/>
         <circle cx="263.4" cy="40.6" r="1.5" fill="#fff" opacity=".9"/>
         <path d="M256 37 C259 34 264 34 267 37" stroke="${coat.d}" stroke-width="1.8" fill="none"
               stroke-linecap="round"/></g>`
      : `<path d="M257 41 C260 45 265 45 268 42" stroke="#170F0A" stroke-width="2.4" fill="none"
               stroke-linecap="round"/>`}
    ${accHead(o.head)}
    ${ready ? `<g transform="translate(253,54) rotate(24)">
       <path d="M-3 5 L-5 16 L0 12.5 L5 16 L3 5 Z" fill="#B33A55"/>
       <circle r="6" fill="#B33A55"/><circle r="3.3" fill="#E0B04E"/></g>` : ''}
  </g>

</svg>`;
  }

  global.Horse = { svg: horseSVG, COATS, MANES };
})(window);
