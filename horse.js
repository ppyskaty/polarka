/* ==========================================================================
   Kůň v profilu čelem doprava — malovaný, ne plochý vektor.
   Objem dělá vrstvené měkké stínování (rozostřené masky uvnitř siluety),
   odlesky, textura srsti a hříva/ocas z jednotlivých pramenů.
   Země y=200, kohoutek y=49, morda x≈290. stage 0–5 = míra péče.
   ========================================================================== */
(function (global) {

  const COATS = {
    hnedak:  { name:'Hnědák',   c:'#8A5729', d:'#4A2C11', l:'#C08A4E' },
    ryzka:   { name:'Ryzka',    c:'#B0602A', d:'#6B3512', l:'#DE9855' },
    vranik:  { name:'Vraník',   c:'#39312F', d:'#17110F', l:'#6B5C56' },
    belous:  { name:'Bělouš',   c:'#D3C5B8', d:'#8F7F71', l:'#FBF6F1' },
    plavak:  { name:'Plavák',   c:'#C79950', d:'#8A632B', l:'#F0CE8C' },
    strakac: { name:'Strakáč',  c:'#76502F', d:'#402611', l:'#A87A4E', pinto:true },
    grosak:  { name:'Grošák',   c:'#95949B', d:'#57565E', l:'#D2D1D6', dapple:true },
    palomino:{ name:'Palomino', c:'#CFA157', d:'#93692C', l:'#F3D79A' }
  };

  const MANES = {
    tmava:   { name:'Tmavá',    c:'#2A1F17' }, cerna:  { name:'Uhlová',   c:'#171310' },
    svetla:  { name:'Plavá',    c:'#DFC79C' }, ryzava: { name:'Ryšavá',   c:'#8A4B22' },
    seda:    { name:'Stříbrná', c:'#C3BEBA' }, duhova: { name:'Duhová',   c:'url(#rainbow)', rainbow:true }
  };

  /* mírné ztmavení/zesvětlení hex barvy */
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const f = v => Math.max(0, Math.min(255, Math.round(v + (k > 0 ? (255 - v) * k : v * k))));
    return '#' + [f(n >> 16 & 255), f(n >> 8 & 255), f(n & 255)]
      .map(v => v.toString(16).padStart(2, '0')).join('');
  }

  /* ---------- prameny hřívy a ocasu ---------- */
  const CREST = [[252,25],[240,27],[228,30],[215,34],[203,39],[192,44],[181,49],[171,54],[162,59]];

  function maneStrands(c, rough) {
    /* hustší podklad, aby mezi prameny neprosvítala srst */
    let out = `<path d="M253 22 C232 25 208 32 188 41 C174 47 164 54 158 60
                L171 69 C178 61 189 54 204 48 C224 40 241 34 256 35 Z"
                fill="${shade(c, -.22)}"/>`;
    const pts = [];
    for (let i = 0; i < CREST.length - 1; i++) {
      const a = CREST[i], b = CREST[i + 1];
      pts.push(a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
    }
    pts.push(CREST[CREST.length - 1]);
    pts.forEach(([x, y], i) => {
      const t = i / (pts.length - 1);
      const len = rough ? 12 + ((i * 5) % 13) : 15 + t * 11;
      const dx = -4 - t * 4;
      const tone = i % 3 === 0 ? shade(c, -.32) : i % 3 === 1 ? c : shade(c, .15);
      out += `<path d="M${x} ${y + 1.5} C${x - 1} ${y + len * .4} ${x + dx * .6} ${y + len * .75}
              ${x + dx} ${y + len}" stroke="${tone}" stroke-width="${rough ? 5 : 6}" fill="none"
              stroke-linecap="round"/>`;
    });
    if (rough) out += `<path d="M234 29 C232 21 235 16 239 14" stroke="${shade(c, -.2)}"
        stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M206 38 C204 31 207 26 212 24" stroke="${c}" stroke-width="2.6" fill="none"
        stroke-linecap="round"/>`;
    return out;
  }

  function tailStrands(c, rough) {
    const S = [[0, 98, 170], [-5, 90, 162], [5, 106, 174], [-9, 82, 152],
               [9, 112, 166], [-2, 94, 178], [3, 102, 158], [-7, 100, 168]];
    return S.map(([o, mid, end], i) => {
      const tone = i % 4 === 0 ? shade(c, -.38) : i % 4 === 1 ? c
                 : i % 4 === 2 ? shade(c, .18) : shade(c, -.16);
      const e = rough ? end - (i % 3) * 10 : end;
      return `<path d="M${60 + o * .25} 58 C${44 + o * .8} 64 ${34 + o} ${mid - 22} ${33 + o} ${mid}
              C${32 + o} ${mid + 22} ${37 + o} ${e - 14} ${42 + o} ${e}"
              stroke="${tone}" stroke-width="${rough ? 7 : 8.5}" fill="none" stroke-linecap="round"/>`;
    }).join('');
  }

  /* ---------- nohy ---------- */
  function hoof(x, y, long) {
    const h = long ? 15 : 10;
    return `<g>
      <path d="M${x - 6} ${y} L${x + 6} ${y}
               C${x + 8.5} ${y + 3} ${x + 9} ${y + h - 2} ${x + 8} ${y + h}
               L${x - 7} ${y + h}
               C${x - 7.5} ${y + h - 3} ${x - 7.5} ${y + 3} ${x - 6} ${y} Z" fill="#33261D"/>
      <path d="M${x - 5} ${y + 2} C${x - 2} ${y + 4} ${x + 2} ${y + 4} ${x + 5} ${y + 2}
               L${x + 6} ${y + h - 3} C${x + 2} ${y + h - 4} ${x - 2} ${y + h - 4} ${x - 5.5} ${y + h - 3} Z"
            fill="#7A6250" opacity=".38"/>
      <path d="M${x - 6} ${y + .8} L${x + 6} ${y + .8}" stroke="#E6DACB" stroke-width="2.2"
            opacity=".35" stroke-linecap="round"/>
      ${long ? `<path d="M${x + .5} ${y + 4} v${h - 6}" stroke="#00000055" stroke-width="1.3"/>` : ''}</g>`;
  }

  function foreleg(x, col, dk, cls, long) {
    const d = long ? 6 : 0;
    return `<g class="${cls}">
      <g fill="none" stroke="${col}" stroke-linecap="round">
        <path d="M${x + 1} 98 L${x} 144" stroke-width="26"/>
        <path d="M${x} 142 L${x + 2} 176" stroke-width="10"/>
        <path d="M${x + 2} 178 L${x + 5} ${186 + d}" stroke-width="8.5"/></g>
      <circle cx="${x}" cy="145" r="7.5" fill="${col}"/>
      <circle cx="${x + 2}" cy="177" r="6.2" fill="${col}"/>
      <g fill="none" stroke="${dk}" stroke-linecap="round" opacity=".38">
        <path d="M${x + 10} 100 L${x + 9} 142" stroke-width="7"/>
        <path d="M${x + 5} 146 L${x + 6} 174" stroke-width="3.4"/></g>
      <g fill="none" stroke="${shade(col, .3)}" stroke-linecap="round" opacity=".3">
        <path d="M${x - 9} 104 L${x - 9} 140" stroke-width="4.5"/>
        <path d="M${x - 2} 150 L${x - 1} 172" stroke-width="2.4"/></g>
      ${hoof(x + 5, 186 + d, long)}</g>`;
  }

  function hindleg(x, col, dk, cls, long) {
    const d = long ? 6 : 0;
    return `<g class="${cls}">
      <g fill="none" stroke="${col}" stroke-linecap="round">
        <path d="M${x + 17} 78 L${x + 1} 116" stroke-width="38"/>
        <path d="M${x + 1} 116 L${x - 11} 146" stroke-width="20"/>
        <path d="M${x - 10} 147 L${x - 2} 176" stroke-width="9"/>
        <path d="M${x - 2} 178 L${x + 1} ${186 + d}" stroke-width="8"/></g>
      <circle cx="${x - 10}" cy="147" r="8" fill="${col}"/>
      <path d="M${x - 17} 139 L${x - 8} 152 L${x - 14} 153 Z" fill="${col}"/>
      <circle cx="${x - 2}" cy="177" r="6" fill="${col}"/>
      <g fill="none" stroke="${dk}" stroke-linecap="round" opacity=".38">
        <path d="M${x + 9} 96 L${x + 5} 114" stroke-width="10"/>
        <path d="M${x - 4} 124 L${x - 7} 142" stroke-width="6"/>
        <path d="M${x + 1} 150 L${x + 3} 174" stroke-width="3"/></g>
      <g fill="none" stroke="${shade(col, .3)}" stroke-linecap="round" opacity=".28">
        <path d="M${x + 1} 90 L${x - 8} 112" stroke-width="7"/>
        <path d="M${x - 14} 126 L${x - 17} 142" stroke-width="4"/>
        <path d="M${x - 6} 152 L${x - 4} 172" stroke-width="2.2"/></g>
      ${hoof(x + 1, 186 + d, long)}</g>`;
  }

  /* ---------- doplňky ---------- */
  function accHead(id) {
    switch (id) {
      case 'masle': return `<g transform="translate(246,20) rotate(-18)">
          <path d="M0 0 L-13 -7 L-13 7 Z" fill="#A8324C"/><path d="M0 0 L13 -7 L13 7 Z" fill="#C2415F"/>
          <circle r="4" fill="#8C2740"/></g>`;
      case 'kvetiny': return `<g>${[[246,22,'#C96A86'],[257,26,'#E0B04E'],[266,32,'#8E77C0']].map(([x, y, c]) => `
          <g transform="translate(${x},${y})">${[0,72,144,216,288].map(a =>
            `<ellipse cy="-4.4" rx="2.8" ry="4.2" fill="${c}" transform="rotate(${a})"/>`).join('')}
          <circle r="2.1" fill="#F5E6B0"/></g>`).join('')}</g>`;
      case 'uzdecka': return `<g fill="none" stroke="#4A2F1A" stroke-width="3.4" stroke-linecap="round">
          <path d="M258 36 C266 44 274 56 280 68"/><path d="M252 50 C260 58 268 64 276 68"/>
          <path d="M283 70 C288 72 290 76 288 80"/>
          <path d="M250 44 C244 52 244 62 248 70" stroke-width="2.8"/>
          <path d="M258 36 C266 44 274 56 280 68" stroke="#7A5230" stroke-width="1.2" opacity=".7"/></g>`;
      case 'roh': return `<g transform="translate(262,20) rotate(28)">
          <path d="M0 -24 L5 3 L-5 3 Z" fill="#E8C356"/><path d="M0 -24 L1.8 3 L-5 3 Z" fill="#B8912F"/>
          <path d="M-4.2 0 L4.2 -1 M-3.6 -6 L3.6 -7 M-2.8 -12 L2.8 -13" stroke="#96721E"
                stroke-width="1.4" stroke-linecap="round" fill="none"/></g>`;
      default: return '';
    }
  }

  function accBody(id) {
    switch (id) {
      case 'deka': return `<g>
          <path d="M92 56 C120 62 152 58 172 50 L182 96 C160 106 122 110 96 104 Z" fill="#35617F"/>
          <path d="M92 56 C120 62 152 58 172 50 L174 59 C152 67 120 71 94 65 Z" fill="#254860"/>
          <path d="M96 100 C122 106 158 102 180 92" stroke="#D8B653" stroke-width="3.5" fill="none"/>
          <path d="M120 60 C124 80 126 94 124 106" stroke="#00000033" stroke-width="3" fill="none"/></g>`;
      case 'sedlo': return `<g>
          <path d="M118 52 C140 56 160 53 176 47 L180 88 C160 96 134 98 116 92 Z" fill="#63401F"/>
          <path d="M126 44 C144 50 160 48 172 42 C178 52 178 66 174 78 C158 84 138 84 124 78
                   C120 66 121 52 126 44 Z" fill="#472C14"/>
          <path d="M126 44 C144 50 160 48 172 42" stroke="#2C1A0A" stroke-width="3" fill="none" stroke-linecap="round"/>
          <path d="M132 50 C146 55 160 53 170 48" stroke="#8A6234" stroke-width="2" fill="none" opacity=".6"/>
          <path d="M142 84 L138 120" stroke="#2C1A0A" stroke-width="5"/>
          <path d="M130 118 h20 a4 4 0 0 1 4 4 v5 a3 3 0 0 1 -3 3 h-22 a3 3 0 0 1 -3 -3 v-5 a4 4 0 0 1 4 -4 Z"
                fill="#8A6234"/></g>`;
      case 'plast': return `<g>
          <path d="M86 54 C120 62 156 56 178 46 L186 104 C158 118 114 120 88 110 Z" fill="#413263"/>
          <path d="M86 54 C120 62 156 56 178 46 L180 56 C156 66 120 72 88 64 Z" fill="#2C2146"/>
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
    const mc = M.rainbow ? '#C2415F' : M.c;
    const st = Math.max(0, Math.min(5, o.stage == null ? 5 : o.stage));
    const u = 'h' + Math.random().toString(36).slice(2, 7);
    const head = o.crop === 'head';
    const box = head ? '232 10 74 74' : '20 2 286 210';

    const mud = st === 0 ? .62 : st === 1 ? .4 : st === 2 ? .17 : 0;
    const rough = st <= 3, longHoof = st <= 3, gloss = st >= 3, ready = st >= 5;
    const droop = st === 0 ? 7 : st === 1 ? 3.5 : 0;
    const eyeOpen = st >= 1;

    const legC = shade(coat.c, -.06), legD = coat.d, farC = shade(coat.d, .06);

    const BODY = `M82 52 C106 58 138 60 166 49 C184 51 204 70 210 96
      C214 110 208 121 198 127 C180 137 140 139 112 131 C98 127 88 120 84 108
      C74 105 60 100 56 86 C52 70 62 50 82 52 Z`;
    const NECK = `M163 51 C188 44 220 35 250 27 C258 31 263 38 264 47
      C243 55 225 66 214 83 C210 89 209 93 210 98 C196 83 177 63 163 51 Z`;
    const HEAD = `M248 25 C258 21 269 27 275 38 C282 50 289 63 291 73
      C293 80 289 86 282 86 C274 86 267 81 263 75 C257 67 251 58 247 52
      C243 45 242 33 248 25 Z`;

    return `<svg viewBox="${box}" xmlns="http://www.w3.org/2000/svg" class="horse-svg" aria-label="kůň">
  <defs>
    <linearGradient id="rainbow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#C2415F"/><stop offset=".33" stop-color="#E0B04E"/>
      <stop offset=".66" stop-color="#5AA57C"/><stop offset="1" stop-color="#8E77C0"/></linearGradient>
    <linearGradient id="cg-${u}" gradientUnits="userSpaceOnUse" x1="150" y1="22" x2="172" y2="146">
      <stop offset="0" stop-color="${shade(coat.l, .1)}"/><stop offset=".4" stop-color="${coat.c}"/>
      <stop offset="1" stop-color="${coat.d}"/></linearGradient>
    <filter id="b4-${u}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="b9-${u}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="9"/></filter>
    <filter id="b16-${u}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16"/></filter>
    <filter id="fur-${u}" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="9"/>
      <feColorMatrix type="saturate" values="0"/></filter>
    <clipPath id="sil-${u}"><path d="${BODY}"/><path d="${NECK}"/><path d="${HEAD}"/></clipPath>
  </defs>

  ${head ? '' : `<ellipse cx="140" cy="200" rx="86" ry="7" fill="#2A1B0C" opacity=".3" filter="url(#b9-${u})"/>`}

  <!-- odvrácené nohy -->
  ${hindleg(98, farC, shade(farC, -.25), 'lg lg-b', longHoof)}
  ${foreleg(184, farC, shade(farC, -.25), 'lg lg-b', longHoof)}

  <!-- ocas -->
  <g>${tailStrands(mc, rough)}</g>

  <!-- silueta: trup + krk + hlava jako jeden celek -->
  <g>
    <path d="${BODY}" fill="url(#cg-${u})"/>
    <path d="${NECK}" fill="url(#cg-${u})"/>
    <path d="${HEAD}" fill="url(#cg-${u})"/>
  </g>

  <g clip-path="url(#sil-${u})">
    <!-- měkké vlastní stíny -->
    <g filter="url(#b9-${u})" fill="${coat.d}">
      <path d="M60 108 C96 142 160 148 214 128 L220 160 L40 160 Z" opacity=".55"/>
      <path d="M166 48 C190 58 206 78 214 100 C200 100 184 86 172 68 Z" opacity=".42"/>
      <path d="M214 84 C224 70 240 56 258 48 L266 62 C244 70 228 84 218 100 Z" opacity=".34"/>
      <ellipse cx="96" cy="126" rx="30" ry="12" opacity=".3"/>
      <path d="M246 52 C254 62 262 72 270 78 L262 88 L240 66 Z" opacity=".3"/>
    </g>
    <!-- světla -->
    <g filter="url(#b16-${u})" fill="#FFFFFF">
      <ellipse cx="92" cy="72" rx="30" ry="22" opacity=".2"/>
      <ellipse cx="140" cy="60" rx="42" ry="10" opacity=".22"/>
      <ellipse cx="222" cy="42" rx="26" ry="9" transform="rotate(-20 222 42)" opacity=".18"/>
      <ellipse cx="276" cy="52" rx="12" ry="16" transform="rotate(-24 276 52)" opacity=".16"/>
    </g>
    <!-- obrysové světlo shora -->
    <g filter="url(#b4-${u})">
      <path d="M84 52 C112 59 144 59 168 49" stroke="${shade(coat.l, .35)}" stroke-width="4"
            opacity=".5" fill="none"/>
      <path d="M170 47 C198 40 226 32 252 26" stroke="${shade(coat.l, .35)}" stroke-width="3.4"
            opacity=".45" fill="none"/>
      <path d="M56 84 C52 68 64 52 82 52" stroke="${shade(coat.l, .3)}" stroke-width="3.5"
            opacity=".35" fill="none"/>
    </g>
    ${coat.dapple ? `<g fill="${coat.l}" opacity=".26" filter="url(#b4-${u})">${
      [[96,74],[118,66],[140,70],[160,80],[104,100],[128,96],[150,104],[84,96],[112,84],[142,88]]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7"/>`).join('')}</g>` : ''}
    ${coat.pinto ? `<g fill="#F6EEE6" opacity=".95">
       <path d="M108 58 C132 52 158 58 170 74 C154 86 124 88 106 78 Z"/>
       <ellipse cx="84" cy="116" rx="24" ry="15"/></g>
       <g filter="url(#b9-${u})" fill="#9C8B7C" opacity=".3">
       <path d="M110 74 C130 70 150 74 162 82 C146 88 122 88 108 80 Z"/></g>` : ''}
    ${gloss ? `<g filter="url(#b4-${u})" fill="#FFFFFF">
       <ellipse cx="118" cy="60" rx="34" ry="4" opacity=".4"/>
       <ellipse cx="88" cy="70" rx="11" ry="15" opacity=".25"/>
       <ellipse cx="206" cy="40" rx="14" ry="4" transform="rotate(-22 206 40)" opacity=".3"/></g>` : ''}
    ${st === 0 ? `<g stroke="${coat.d}" stroke-width="3" opacity=".28" fill="none" filter="url(#b4-${u})">
       <path d="M150 78 C152 92 150 104 146 114"/><path d="M162 76 C164 90 162 102 158 112"/>
       <path d="M138 80 C140 94 138 106 134 116"/></g>` : ''}
    ${mud ? `<g fill="#3E2F19" opacity="${mud}" filter="url(#b4-${u})">
       <path d="M96 112 C110 104 128 108 136 118 C120 128 102 126 96 112 Z"/>
       <ellipse cx="152" cy="120" rx="15" ry="8"/><ellipse cx="74" cy="98" rx="12" ry="9"/>
       <ellipse cx="184" cy="108" rx="10" ry="7"/><ellipse cx="114" cy="64" rx="13" ry="6"/>
       <ellipse cx="232" cy="52" rx="8" ry="6"/></g>` : ''}
    <!-- textura srsti -->
    <rect x="20" y="2" width="286" height="210" filter="url(#fur-${u})" opacity=".13"
          style="mix-blend-mode:overlay"/>
  </g>

  <!-- bližší nohy -->
  ${hindleg(84, legC, legD, 'lg lg-a', longHoof)}
  ${foreleg(197, legC, legD, 'lg lg-a', longHoof)}

  ${accBody(o.body)}

  <!-- hlava, uši, hříva -->
  <g transform="rotate(${droop} 172 54)">
    <path d="M239 30 C233 18 236 9 242 6 C247 11 248 22 245 32 Z" fill="${shade(coat.d, .08)}"/>
    <g>${maneStrands(mc, rough)}</g>
    <path d="M250 25 C245 17 248 8 254 5 C260 10 261 21 258 30 Z" fill="${shade(coat.c, .06)}"/>
    <path d="M252.5 9 C255 13 256 20 255 26" stroke="${coat.d}" stroke-width="2.6" fill="none" opacity=".55"/>
    <path d="${HEAD}" fill="url(#cg-${u})" opacity="0"/>
    <path d="M253 24 C245 30 242 40 246 51" stroke="${mc}" stroke-width="6" fill="none"
          stroke-linecap="round" opacity=".95"/>
    <path d="M276 62 C285 61 291 68 291 75 C292 81 288 86 282 86 C275 86 270 80 270 73
             C270 67 272 63 276 62 Z" fill="${shade(coat.l, .12)}" opacity=".55"/>
    <path d="M283 73 C288 72 290 76 288 79 C286 82 282 82 281 79 C280 76 281 74 283 73 Z" fill="#1C120A"/>
    <path d="M272 84 C277 87 283 87 288 84" stroke="${coat.d}" stroke-width="1.8" fill="none"
          opacity=".6" stroke-linecap="round"/>
    <path d="M247 52 C253 62 259 70 266 76" stroke="${coat.d}" stroke-width="2" fill="none"
          opacity=".28" stroke-linecap="round"/>
    <path d="M252 36 C258 44 262 54 264 64" stroke="${shade(coat.l, .3)}" stroke-width="3.5"
          fill="none" opacity=".25" stroke-linecap="round"/>
    <path d="M270 46 C278 54 284 62 288 70" stroke="${shade(coat.l, .35)}" stroke-width="3"
          fill="none" opacity=".3" stroke-linecap="round"/>
    ${eyeOpen
      ? `<g><ellipse cx="262" cy="42.5" rx="7" ry="6" transform="rotate(18 262 42.5)" fill="${coat.d}" opacity=".45"/>
         <ellipse cx="262" cy="42" rx="5.8" ry="4.8" transform="rotate(18 262 42)" fill="#100A06"/>
         <ellipse cx="261" cy="43.5" rx="3" ry="2" transform="rotate(18 261 43.5)" fill="#3A2A1E" opacity=".7"/>
         <circle cx="263.8" cy="40.2" r="1.7" fill="#fff" opacity=".95"/>
         <path d="M256 37.5 C259 34 265 34 268 37.5" stroke="${coat.d}" stroke-width="2"
               fill="none" stroke-linecap="round"/>
         <path d="M256.5 36.5 C259 33.5 265 33.5 267.5 36.5" stroke="#100A06" stroke-width="1.1"
               fill="none" opacity=".7"/></g>`
      : `<path d="M256.5 41 C260 45.5 265 45.5 268 41.5" stroke="#100A06" stroke-width="2.6"
               fill="none" stroke-linecap="round"/>`}
    ${accHead(o.head)}
    ${ready ? `<g transform="translate(253,54) rotate(24)">
       <path d="M-3 5 L-5 16 L0 12.5 L5 16 L3 5 Z" fill="#8C2740"/>
       <circle r="6" fill="#B33A55"/><circle r="3.3" fill="#E0B04E"/>
       <circle r="1.4" fill="#8C2740"/></g>` : ''}
  </g>
</svg>`;
  }

  global.Horse = { svg: horseSVG, COATS, MANES };
})(window);
