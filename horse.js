/* Parametrický SVG kůň — vykresluje se z barev a doplňků. */
(function (global) {

  const COATS = {
    hnedak:   { name: 'Hnědák',    c: '#A9683D', d: '#8A5230', l: '#C88857' },
    ryzka:    { name: 'Ryzka',     c: '#CE7F41', d: '#AC6531', l: '#E7A164' },
    vranik:   { name: 'Vraník',    c: '#4E434C', d: '#3A3038', l: '#6B5D68' },
    belous:   { name: 'Bělouš',    c: '#EFE4DA', d: '#D6C6B7', l: '#FFFAF4' },
    plavak:   { name: 'Plavák',    c: '#DDA95E', d: '#BE8B45', l: '#F2C782' },
    strakac:  { name: 'Strakáč',   c: '#8C6244', d: '#6F4C34', l: '#C99A78', pinto: true },
    ruzovy:   { name: 'Růžový sen',c: '#F3A7BE', d: '#DC8AA4', l: '#FFC6D6' },
    modry:    { name: 'Modrý vítr',c: '#8FB6E8', d: '#7099CC', l: '#B3D2F7' }
  };

  const MANES = {
    tmava:  { name: 'Tmavá',     c: '#3B3129' },
    svetla: { name: 'Světlá',    c: '#F0D9AE' },
    ohniva: { name: 'Ohnivá',    c: '#E2653C' },
    ruzova: { name: 'Růžová',    c: '#FF8FB6' },
    fialova:{ name: 'Fialová',   c: '#A98BE0' },
    duhova: { name: 'Duhová',    c: 'url(#rainbow)', rainbow: true }
  };

  function esc(s){ return String(s).replace(/[<>&]/g, m => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[m])); }

  /* --- doplňky --- */
  function accHead(id) {
    switch (id) {
      case 'masle': return `
        <g transform="translate(101,17) rotate(-12)">
          <path d="M0 0 L-17 -9 L-17 9 Z" fill="#FF7BA0"/>
          <path d="M0 0 L17 -9 L17 9 Z" fill="#FF7BA0"/>
          <circle cx="0" cy="0" r="5.5" fill="#FF5C87"/>
        </g>`;
      case 'kvetiny': return `
        <g>${[[70,20,'#FF8FB6'],[84,13,'#FFD36E'],[97,18,'#C7A6F5']].map(([x,y,c])=>`
          <g transform="translate(${x},${y})">
            ${[0,72,144,216,288].map(a=>`<ellipse cx="0" cy="-5.4" rx="3.6" ry="5.2" fill="${c}" transform="rotate(${a})"/>`).join('')}
            <circle r="2.7" fill="#FFF3C4"/>
          </g>`).join('')}</g>`;
      case 'klobouk': return `
        <g transform="translate(84,12) rotate(-8)">
          <ellipse cx="0" cy="4" rx="30" ry="8" fill="#B9814C"/>
          <path d="M-15 4 C-15 -12 15 -12 15 4 Z" fill="#CE9459"/>
          <rect x="-15" y="-1" width="30" height="5" rx="2.5" fill="#7E5230"/>
        </g>`;
      case 'roh': return `
        <g transform="translate(83,10) rotate(-14)">
          <path d="M0 -26 L6 4 L-6 4 Z" fill="#FFD86B"/>
          <path d="M0 -26 L2.4 4 L-6 4 Z" fill="#FFC132"/>
          <path d="M-5 0 L5 -1 M-4.4 -6 L4.4 -7 M-3.4 -12 L3.4 -13" stroke="#E8A81E" stroke-width="1.6" stroke-linecap="round" fill="none"/>
        </g>`;
      case 'celenka': return `
        <g><path d="M64 30 C74 20 92 18 100 24" stroke="#7EC8F0" stroke-width="5" fill="none" stroke-linecap="round"/>
        <circle cx="66" cy="30" r="4.5" fill="#FFD36E"/><circle cx="99" cy="24" r="4.5" fill="#FFD36E"/></g>`;
      default: return '';
    }
  }

  function accBody(id) {
    switch (id) {
      case 'deka': return `
        <g>
          <path d="M111 82 C132 70 164 70 180 82 L176 120 C156 110 132 110 113 120 Z" fill="#7EC8F0"/>
          <path d="M111 82 C132 70 164 70 180 82 L179 89 C160 78 132 78 112 89 Z" fill="#5AAEDB"/>
          ${[[128,98],[146,95],[164,99],[137,110],[156,109]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3.4" fill="#FFF" opacity=".75"/>`).join('')}
        </g>`;
      case 'sedlo': return `
        <g>
          <path d="M116 82 C136 71 162 71 178 82 L174 112 C156 104 134 104 118 112 Z" fill="#B9814C"/>
          <path d="M126 76 C140 70 158 70 170 76 C174 86 174 96 170 104 C156 98 140 98 128 104 C124 96 123 85 126 76 Z" fill="#8E5E33"/>
          <path d="M126 76 C140 70 158 70 170 76" stroke="#6E4623" stroke-width="3" fill="none" stroke-linecap="round"/>
          <rect x="140" y="104" width="8" height="26" rx="3" fill="#6E4623"/>
          <rect x="134" y="126" width="20" height="9" rx="4" fill="#D9A55F"/>
        </g>`;
      case 'plast': return `
        <g>
          <path d="M108 76 C132 62 168 64 184 80 L180 132 C158 118 128 120 110 130 Z" fill="#A98BE0"/>
          <path d="M108 76 C132 62 168 64 184 80 L183 88 C164 74 130 73 109 86 Z" fill="#8C6BD0"/>
          ${[[126,96],[150,90],[170,100],[136,114],[160,116]].map(([x,y])=>`<path d="M${x} ${y-5} l1.6 3.4 3.8.5-2.8 2.6.7 3.7-3.3-1.8-3.3 1.8.7-3.7-2.8-2.6 3.8-.5Z" fill="#FFF0A8"/>`).join('')}
        </g>`;
      default: return '';
    }
  }

  function accLegs(id) {
    if (id !== 'bandaze') return '';
    const w = (x) => `<rect x="${x}" y="152" width="19" height="15" rx="5" fill="#FF8FB6"/>`;
    return `<g>${w(85)}${w(95)}${w(159)}${w(171)}</g>`;
  }

  /**
   * @param {object} o {coat, mane, head, body, legs, mood, bob, crop}
   */
  function horseSVG(o) {
    o = o || {};
    const coat = COATS[o.coat] || COATS.hnedak;
    const mane = MANES[o.mane] || MANES.tmava;
    const mood = typeof o.mood === 'number' ? o.mood : 80;
    const happy = mood >= 55;
    const uid = 'h' + Math.random().toString(36).slice(2, 8);
    const box = o.crop === 'head' ? '24 2 92 92' : '0 -12 240 212';
    const bob = o.bob === false ? '' : `<animateTransform attributeName="transform" type="translate"
        values="0 0; 0 -3.5; 0 0" dur="3.4s" repeatCount="indefinite" calcMode="spline"
        keySplines=".45 0 .55 1;.45 0 .55 1" keyTimes="0;.5;1"/>`;

    return `<svg viewBox="${box}" xmlns="http://www.w3.org/2000/svg" aria-label="kůň">
  <defs>
    <linearGradient id="rainbow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FF7BA0"/><stop offset=".3" stop-color="#FFC93C"/>
      <stop offset=".6" stop-color="#6ED0A0"/><stop offset="1" stop-color="#9B8BE8"/>
    </linearGradient>
    <clipPath id="body-${uid}"><ellipse cx="132" cy="112" rx="52" ry="37"/></clipPath>
  </defs>
  <g>
   ${bob}
   <!-- zadní nohy -->
   <g fill="${coat.d}">
     <rect x="84" y="128" width="18" height="50" rx="9"/>
     <rect x="170" y="128" width="18" height="50" rx="9"/>
     <rect x="82" y="168" width="22" height="14" rx="5" fill="#57433A"/>
     <rect x="168" y="168" width="22" height="14" rx="5" fill="#57433A"/>
   </g>
   <!-- ocas -->
   <path d="M180 82 C202 80 216 100 215 124 C214 148 202 164 189 170 C199 150 202 126 189 110 C182 102 178 92 180 82 Z"
         fill="${mane.c}"/>
   <!-- tělo -->
   <ellipse cx="132" cy="112" rx="52" ry="37" fill="${coat.c}"/>
   <g clip-path="url(#body-${uid})">
     <ellipse cx="128" cy="140" rx="40" ry="20" fill="${coat.l}" opacity=".55"/>
     ${coat.pinto ? `<g fill="#FFF6EC" opacity=".95">
        <ellipse cx="150" cy="96" rx="26" ry="19"/><ellipse cx="112" cy="130" rx="22" ry="15"/>
      </g>` : ''}
   </g>
   <!-- krk -->
   <path d="M86 98 C74 80 68 62 68 46 L104 38 C106 62 112 82 120 96 Z" fill="${coat.c}"/>
   <!-- přední nohy -->
   <g fill="${coat.c}">
     <rect x="94" y="130" width="19" height="48" rx="9"/>
     <rect x="158" y="130" width="19" height="48" rx="9"/>
     <rect x="92" y="168" width="23" height="14" rx="5" fill="#6B5245"/>
     <rect x="156" y="168" width="23" height="14" rx="5" fill="#6B5245"/>
   </g>
   ${accLegs(o.legs)}
   ${accBody(o.body)}
   <!-- uši -->
   <path d="M92 26 L96 6 L106 24 Z" fill="${coat.c}" stroke="${coat.c}" stroke-width="4" stroke-linejoin="round"/>
   <path d="M74 28 L74 9 L88 24 Z" fill="${coat.d}" stroke="${coat.d}" stroke-width="4" stroke-linejoin="round"/>
   <!-- hlava -->
   <path d="M98 28 C88 14 66 17 55 30 C45 42 35 53 31 61 C27 70 34 77 43 75 C58 72 76 63 88 51 C96 43 103 36 98 28 Z"
         fill="${coat.c}"/>
   <ellipse cx="41" cy="65" rx="14" ry="10.5" transform="rotate(-24 41 65)" fill="${coat.l}"/>
   <ellipse cx="38" cy="63" rx="3.4" ry="2.6" transform="rotate(-24 38 63)" fill="${coat.d}"/>
   <ellipse cx="60" cy="55" rx="8" ry="5" fill="#FF8FB6" opacity=".32"/>
   <!-- oko -->
   ${happy
      ? `<circle cx="68" cy="38" r="4.6" fill="#3B2E2A"/><circle cx="69.6" cy="36.4" r="1.7" fill="#fff"/>`
      : `<path d="M63 39 q5 -5 10 0" stroke="#3B2E2A" stroke-width="3.2" fill="none" stroke-linecap="round"/>`}
   <!-- pusa -->
   ${happy
      ? `<path d="M34 70 q6 4 11 0" stroke="${coat.d}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
      : `<path d="M34 72 q6 -3 11 0" stroke="${coat.d}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`}
   <!-- hříva -->
   <path d="M94 8 C112 14 116 32 110 48 C104 66 110 84 120 98 L98 100 C86 80 82 56 84 38 C85 24 88 13 94 8 Z"
         fill="${mane.c}"/>
   <path d="M92 22 C82 26 74 34 70 44 C78 40 88 34 94 26 Z" fill="${mane.c}"/>
   ${accHead(o.head)}
  </g>
</svg>`;
  }

  global.Horse = { svg: horseSVG, COATS, MANES };
})(window);
