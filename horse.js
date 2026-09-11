/* ==========================================================================
   Parametrický SVG kůň — profil čelem doprava (běží k cíli).
   stage 0–5 = jak je o něj postaráno; roste s plněním úkolů.
   Souřadnice: kopyta na y=177, hlava vpravo nahoře.
   ========================================================================== */
(function (global) {

  const COATS = {
    hnedak:  { name:'Hnědák',     c:'#A9683D', d:'#834E28', l:'#CB8B58' },
    ryzka:   { name:'Ryzka',      c:'#CE7F41', d:'#A35C2D', l:'#E9A667' },
    vranik:  { name:'Vraník',     c:'#4E434C', d:'#332B31', l:'#71636D' },
    belous:  { name:'Bělouš',     c:'#EADDD1', d:'#C4B2A1', l:'#FFFBF7' },
    plavak:  { name:'Plavák',     c:'#DDA95E', d:'#B47F3C', l:'#F5CC8A' },
    strakac: { name:'Strakáč',    c:'#8C6244', d:'#66432B', l:'#C99A78', pinto:true },
    ruzovy:  { name:'Růžový sen', c:'#F0A3BB', d:'#CE7791', l:'#FFC8D8' },
    modry:   { name:'Modrý vítr', c:'#8FB6E8', d:'#658CC4', l:'#B9D6F9' }
  };

  const MANES = {
    tmava:   { name:'Tmavá',   c:'#3A2F28' }, svetla:  { name:'Světlá',  c:'#EFD5A2' },
    ohniva:  { name:'Ohnivá',  c:'#DE5A33' }, ruzova:  { name:'Růžová',  c:'#FF7FA8' },
    fialova: { name:'Fialová', c:'#9E82DE' }, duhova:  { name:'Duhová',  c:'url(#rainbow)', rainbow:true }
  };

  const HOOF = '#4E3A30';

  /* ---------- nohy ---------- */
  function foreleg(x, fill, cls, long) {
    const h = long ? 6 : 0, b = 166 + h;
    return `<g class="${cls}">
      <path d="M${x - 7} 104
               C${x - 9} 122 ${x - 8} 140 ${x - 6} ${b}
               L${x + 6} ${b}
               C${x + 7} 140 ${x + 7} 122 ${x + 6} 104 Z" fill="${fill}"/>
      <path d="M${x - 8} ${b - 3} h16 a4 4 0 0 1 4 4 v${7 + h} a3 3 0 0 1 -3 3 h-18
               a3 3 0 0 1 -3 -3 v-${7 + h} a4 4 0 0 1 4 -4 Z" fill="${HOOF}"/></g>`;
  }
  function hindleg(x, fill, cls, long) {
    const h = long ? 6 : 0, b = 166 + h;
    return `<g class="${cls}">
      <path d="M${x - 14} 96
               C${x - 22} 116 ${x - 16} 132 ${x - 8} 146
               C${x - 5} 153 ${x - 5} 160 ${x - 5} ${b}
               L${x + 7} ${b}
               C${x + 7} 154 ${x + 4} 146 ${x + 1} 138
               C${x - 4} 126 ${x - 1} 112 ${x + 8} 98 Z" fill="${fill}"/>
      <path d="M${x - 7} ${b - 3} h16 a4 4 0 0 1 4 4 v${7 + h} a3 3 0 0 1 -3 3 h-18
               a3 3 0 0 1 -3 -3 v-${7 + h} a4 4 0 0 1 4 -4 Z" fill="${HOOF}"/></g>`;
  }

  /* ---------- doplňky ---------- */
  function accHead(id) {
    switch (id) {
      case 'masle': return `<g transform="translate(200,22) rotate(16)">
          <path d="M0 0 L-15 -8 L-15 8 Z" fill="#FF7BA0"/><path d="M0 0 L15 -8 L15 8 Z" fill="#FF7BA0"/>
          <circle r="4.6" fill="#FF5C87"/></g>`;
      case 'kvetiny': return `<g>${[[186,30,'#FF8FB6'],[199,21,'#FFD36E'],[213,16,'#C7A6F5']].map(([x, y, c]) => `
          <g transform="translate(${x},${y})">${[0,72,144,216,288].map(a =>
            `<ellipse cy="-4.8" rx="3.2" ry="4.6" fill="${c}" transform="rotate(${a})"/>`).join('')}
          <circle r="2.4" fill="#FFF3C4"/></g>`).join('')}</g>`;
      case 'klobouk': return `<g transform="translate(214,14) rotate(13)">
          <ellipse cy="3" rx="26" ry="7" fill="#B9814C"/>
          <path d="M-13 3 C-13 -11 13 -11 13 3 Z" fill="#CE9459"/>
          <rect x="-13" y="-2" width="26" height="5" rx="2.5" fill="#7E5230"/></g>`;
      case 'roh': return `<g transform="translate(216,12) rotate(20)">
          <path d="M0 -25 L5.5 3 L-5.5 3 Z" fill="#FFD86B"/><path d="M0 -25 L2 3 L-5.5 3 Z" fill="#FFC132"/>
          <path d="M-4.6 0 L4.6 -1 M-4 -6 L4 -7 M-3 -12 L3 -13" stroke="#E8A81E" stroke-width="1.5"
                stroke-linecap="round" fill="none"/></g>`;
      case 'celenka': return `<g><path d="M202 30 C212 22 226 22 234 30" stroke="#7EC8F0" stroke-width="5"
            fill="none" stroke-linecap="round"/>
          <circle cx="202" cy="30" r="4" fill="#FFD36E"/><circle cx="234" cy="30" r="4" fill="#FFD36E"/></g>`;
      default: return '';
    }
  }

  function accBody(id) {
    switch (id) {
      case 'deka': return `<g>
          <path d="M82 76 C104 66 136 68 154 80 L150 118 C128 108 100 110 84 118 Z" fill="#7EC8F0"/>
          <path d="M82 76 C104 66 136 68 154 80 L153 87 C134 76 104 75 83 84 Z" fill="#58AADA"/>
          ${[[98,96],[118,92],[136,98],[106,110],[126,108]].map(([x, y]) =>
            `<circle cx="${x}" cy="${y}" r="3.1" fill="#FFF" opacity=".78"/>`).join('')}</g>`;
      case 'sedlo': return `<g>
          <path d="M92 74 C112 64 140 66 156 78 L152 110 C132 100 108 102 94 110 Z" fill="#B9814C"/>
          <path d="M100 68 C114 61 134 62 146 70 C150 80 150 90 146 98 C132 91 116 92 102 98
                   C98 90 97 77 100 68 Z" fill="#8E5E33"/>
          <path d="M100 68 C114 61 134 62 146 70" stroke="#6E4623" stroke-width="3" fill="none" stroke-linecap="round"/>
          <rect x="112" y="98" width="8" height="24" rx="3" fill="#6E4623"/>
          <rect x="106" y="119" width="20" height="9" rx="4" fill="#D9A55F"/></g>`;
      case 'plast': return `<g>
          <path d="M74 70 C102 56 140 60 160 78 L154 130 C128 116 96 118 78 128 Z" fill="#A98BE0"/>
          <path d="M74 70 C102 56 140 60 160 78 L159 86 C136 70 102 68 75 80 Z" fill="#8A68CE"/>
          ${[[96,96],[124,88],[144,100],[104,114],[130,116]].map(([x, y]) =>
            `<path d="M${x} ${y-5} l1.6 3.4 3.8.5-2.8 2.6.7 3.7-3.3-1.8-3.3 1.8.7-3.7-2.8-2.6 3.8-.5Z"
                   fill="#FFF0A8"/>`).join('')}</g>`;
      default: return '';
    }
  }

  function horseSVG(o) {
    o = o || {};
    const coat = COATS[o.coat] || COATS.hnedak;
    const mane = MANES[o.mane] || MANES.tmava;
    const st = Math.max(0, Math.min(5, o.stage == null ? 5 : o.stage));
    const u = 'h' + Math.random().toString(36).slice(2, 7);
    const box = o.crop === 'head' ? '184 0 76 76' : '24 0 232 182';

    const dirt = st === 0 ? .75 : st === 1 ? .5 : st === 2 ? .22 : 0;
    const messy = st <= 3, longHoof = st <= 3, shine = st >= 3, ready = st >= 5, awake = st >= 1;

    const BODY = `M66 98 C64 79 80 69 104 68 C128 67 148 71 158 81
                  C167 90 168 105 161 115 C152 127 128 133 104 131 C82 129 68 116 66 98 Z`;
    const NECK = `M146 78 C152 60 168 46 192 36 L213 56 C195 64 181 78 173 94
                  C170 100 168 104 167 108 C158 104 150 92 146 78 Z`;
    const HEAD = `M190 32 C194 16 212 9 229 15 C241 20 250 33 252 44
                  C254 53 250 61 242 63 C233 65 225 60 219 54
                  C209 47 196 41 190 38 Z`;

    const maneShape = messy
      ? `M195 26 L183 32 L189 38 L174 45 L180 52 L165 60 L170 67 L155 76 L160 83 L144 92 L148 98
         L128 85 L140 75 L134 69 L150 57 L145 50 L160 40 L156 34 L172 27 Z`
      : `M194 26 C181 33 167 46 156 62 C147 74 142 83 139 91 L122 83
         C128 68 141 51 157 36 C168 27 182 22 194 26 Z`;

    return `<svg viewBox="${box}" xmlns="http://www.w3.org/2000/svg" class="horse-svg" aria-label="kůň">
  <defs>
    <linearGradient id="rainbow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FF7BA0"/><stop offset=".33" stop-color="#FFC93C"/>
      <stop offset=".66" stop-color="#6ED0A0"/><stop offset="1" stop-color="#9B8BE8"/></linearGradient>
    <linearGradient id="bd-${u}" x1=".2" y1="0" x2=".5" y2="1">
      <stop offset="0" stop-color="${coat.l}"/><stop offset=".45" stop-color="${coat.c}"/>
      <stop offset="1" stop-color="${coat.d}"/></linearGradient>
    <clipPath id="cl-${u}"><path d="${BODY}"/></clipPath>
  </defs>

  <!-- vzdálené nohy -->
  ${hindleg(76, coat.d, 'lg lg-b', longHoof)}
  ${foreleg(136, coat.d, 'lg lg-b', longHoof)}

  <!-- ocas -->
  <path d="M74 80 C55 75 40 90 35 112 C30 137 38 159 51 169
           C42 148 45 123 58 107 C66 98 73 90 74 80 Z" fill="${mane.c}"/>

  <!-- krk -->
  <path d="${NECK}" fill="url(#bd-${u})"/>

  <!-- trup -->
  <path d="${BODY}" fill="url(#bd-${u})"/>
  <g clip-path="url(#cl-${u})">
    <ellipse cx="106" cy="136" rx="52" ry="20" fill="${coat.d}" opacity=".3"/>
    <path d="M150 70 C158 86 158 104 150 122 L166 122 L166 70 Z" fill="${coat.d}" opacity=".18"/>
    ${coat.pinto ? `<g fill="#FFF8F0" opacity=".95"><ellipse cx="128" cy="90" rx="24" ry="17"/>
       <ellipse cx="86" cy="116" rx="20" ry="13"/></g>` : ''}
    ${shine ? `<ellipse cx="106" cy="78" rx="34" ry="6" fill="#fff" opacity=".16"/>` : ''}
    ${dirt ? `<g fill="#5F4A2E" opacity="${dirt}">
       <ellipse cx="94" cy="118" rx="17" ry="10" transform="rotate(-12 94 118)"/>
       <ellipse cx="128" cy="122" rx="12" ry="7.5"/><ellipse cx="74" cy="102" rx="10" ry="7"/>
       <ellipse cx="140" cy="92" rx="8" ry="6"/><ellipse cx="108" cy="78" rx="9" ry="5"/></g>` : ''}
  </g>

  <!-- bližší nohy -->
  ${hindleg(90, coat.c, 'lg lg-a', longHoof)}
  ${foreleg(150, coat.c, 'lg lg-a', longHoof)}

  ${accBody(o.body)}

  <!-- hříva, uši, hlava -->
  <path d="${maneShape}" fill="${mane.c}"/>
  <path d="M194 22 L195 4 L208 19 Z" fill="${coat.d}" stroke="${coat.d}" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M211 19 L222 4 L226 21 Z" fill="${coat.c}" stroke="${coat.c}" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M210 13 C221 12 229 18 231 27 C223 22 216 19 208 20 Z" fill="${mane.c}"/>
  <path d="${HEAD}" fill="url(#bd-${u})"/>
  <path d="M236 40 C247 40 253 47 251 54 C249 61 240 64 232 61 C229 53 231 43 236 40 Z" fill="${coat.l}"/>
  <ellipse cx="245" cy="51" rx="2.8" ry="2.2" fill="${coat.d}"/>
  <path d="M220 52 C226 58 232 61 240 62" stroke="${coat.d}" stroke-width="1.6" fill="none"
        opacity=".35" stroke-linecap="round"/>
  <ellipse cx="218" cy="47" rx="6.2" ry="4" fill="#FF8FB6" opacity=".3"/>
  ${awake
    ? `<g><circle cx="215" cy="31" r="4.5" fill="#2E241F"/><circle cx="216.5" cy="29.4" r="1.7" fill="#fff"/>
       <path d="M209 25 q6 -4 12 -1" stroke="#2E241F" stroke-width="2" fill="none" stroke-linecap="round"/></g>`
    : `<path d="M209 32 q6 5 12 0" stroke="#2E241F" stroke-width="2.8" fill="none" stroke-linecap="round"/>`}
  <path d="${st >= 3 ? 'M239 59 q5 4 8 -1' : 'M239 61 q5 -3 8 1'}" stroke="${coat.d}" stroke-width="2"
        fill="none" stroke-linecap="round"/>

  ${accHead(o.head)}

  ${ready ? `<g>
     <g transform="translate(166,104)"><circle r="10" fill="#FF5C87"/><circle r="5.8" fill="#FFD36E"/>
       <path d="M-4.5 9 L-7 24 L0 19 L7 24 L4.5 9 Z" fill="#FF5C87"/></g>
     ${[[80,46],[188,80],[48,92]].map(([x, y]) =>
       `<path d="M${x} ${y - 7} l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" fill="#FFE9A3"/>`).join('')}
   </g>` : ''}
</svg>`;
  }

  global.Horse = { svg: horseSVG, COATS, MANES };
})(window);
