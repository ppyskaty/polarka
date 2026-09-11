/* ==========================================================================
   Stáj Tiffany — jedna mechanika: dnešní dostih.
   Splněný úkol posune koně po dráze. Všechno hotovo = cíl.
   Data zůstávají v localStorage na telefonu. Žádný server.
   ========================================================================== */
(function () {
'use strict';

/* ---------- pomocníci ---------- */
const $ = (s, r) => (r || document).querySelector(s);
const pad = n => String(n).padStart(2, '0');
const dk = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const TODAY = () => dk(new Date());
const iso = d => (d.getDay() === 0 ? 7 : d.getDay());
const addD = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const monday = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return addD(x, -(iso(x) - 1)); };
const weekKey = d => dk(monday(d));
const uid = () => Math.random().toString(36).slice(2, 9);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const DOW = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
const plur = (n, a, b, c) => (n === 1 ? a : n >= 2 && n <= 4 ? b : c);

/* ---------- pevný rozvrh 3. třídy ---------- */
const SCHEDULE = {
  1: ['Matematika', 'Tělocvik', 'Tělocvik', 'Čeština', 'Čeština / English'],
  2: ['English / Matematika', 'Matematika / English', 'Prvouka', 'Čeština', 'Čtení'],
  3: ['Čeština', 'Matematika (geometrie)', 'Čtení', 'Workshop (D)', 'Workshop (D)'],
  4: ['Čeština', 'Matematika', 'Čtení / English', 'Prvouka', 'Workshop (M)'],
  5: ['English', 'English', 'Čeština', 'Prvouka', 'Výtvarka']
};
const SUBJ_ICO = [['geometri', '📐'], ['Matematika', '🔢'], ['Čeština', '📕'], ['English', '🇬🇧'],
                  ['Prvouka', '🌍'], ['Čtení', '📖'], ['Tělocvik', '🤸'], ['Výtvarka', '🎨'], ['Workshop', '🛠️']];
const lessonIco = nm => (SUBJ_ICO.find(([k]) => nm.indexOf(k) >= 0) || [, '📘'])[1];
const HW = [
  { nm: 'Čeština', ico: '📕' }, { nm: 'Matematika', ico: '🔢' }, { nm: 'English', ico: '🇬🇧' },
  { nm: 'Čtení', ico: '📖' }, { nm: 'Prvouka', ico: '🌍' }, { nm: 'Geometrie', ico: '📐' },
  { nm: 'Výtvarka', ico: '🎨' }, { nm: 'Workshop', ico: '🛠️' }
];

const EMOJIS = ['🎒','📚','✏️','📒','🔢','🇬🇧','🧹','🧺','👕','🛏️','🍽️','🗑️','🪥','🚿','🌙','⏰','🐴','🎹','⚽','🎨','💖','📖','🐕','💧','🌱','🧸','🎵','🏃'];
const CATS = [
  { id: 'skola', nm: 'Škola',   cls: 'cat-skola' }, { id: 'domov', nm: 'Domov',  cls: 'cat-domov' },
  { id: 'ja',    nm: 'Já sama', cls: 'cat-ja' },    { id: 'volno', nm: 'Zábava', cls: 'cat-volno' }
];
const catCls = c => (CATS.find(x => x.id === c) || CATS[1]).cls;

/* ---------- stav ---------- */
const KEY = 'tiffany.stable.v1';
let S = null, tab = 'dnes';

function fresh() {
  return {
    v: 3, kid: 'Tiffany',
    horse: { name: 'Hvězdička' },
    streak: { n: 0, best: 0 },
    tasks: [], hist: {}, gone: {},
    goal: { days: 5, reward: '', week: weekKey(new Date()), claimed: false },
    stats: { races: 0 },
    sound: true
  };
}

function load() {
  try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
  if (!S) { S = fresh(); return; }
  if (S.v !== 3) {                       /* přechod ze starších verzí */
    const old = S;
    S = fresh();
    S.horse.name = (old.horse && old.horse.name) || S.horse.name;
    S.streak = { n: (old.streak && old.streak.n) || 0, best: (old.streak && old.streak.best) || 0 };
    S.stats.races = (old.stats && old.stats.races) || 0;
    S.sound = old.sound !== false;
    if (Array.isArray(old.tasks) && old.tasks.length) {
      S.tasks = old.tasks.map(t => ({ id: t.id || uid(), title: t.title, emo: t.emo, cat: t.cat,
        type: t.type, days: t.days, due: t.due, doneAt: t.doneAt, arch: t.arch, created: t.created }));
    }
    if (old.hist) {
      S.hist = {};
      Object.keys(old.hist).forEach(k => {
        const d = old.hist[k] && old.hist[k].done;
        if (d) S.hist[k] = { done: Object.keys(d).reduce((a, id) => (a[id] = true, a), {}) };
      });
    }
    if (old.goal) S.goal.reward = old.goal.reward || '';
  }
  if (!S.stats) S.stats = { races: 0 };
  if (!S.gone) S.gone = {};
  rollGoal();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function rollGoal() {
  const wk = weekKey(new Date());
  if (S.goal.week !== wk) { S.goal.week = wk; S.goal.claimed = false; }
}

/* ---------- výpočty ---------- */
function reqIds(k) {
  const w = iso(new Date(k + 'T00:00:00'));
  return S.tasks.filter(t => !t.arch && t.type === 'daily' && (t.days || []).includes(w)
    && (!t.created || t.created <= k)).map(t => t.id);
}
/* Co se ten den očekávalo. U dneška se přepočítává, minulost se zamkne,
   aby pozdější úprava seznamu úkolů nepřepsala statistiku zpětně. */
const day = k => {
  const h = S.hist[k] || (S.hist[k] = { done: {} });
  if (k === TODAY() || !h.req) h.req = reqIds(k);
  return h;
};
const expectedFor = k => (k === TODAY() ? reqIds(k)
  : ((S.hist[k] && S.hist[k].req) || reqIds(k)));
function weekDays(d) { const m = monday(d || new Date()); return [0,1,2,3,4,5,6].map(i => dk(addD(m, i))); }
function doneToday(t) { return !!day(TODAY()).done[t.id]; }
function doneThisWeek(t) { return weekDays().some(k => S.hist[k] && S.hist[k].done[t.id]); }
function isDone(t) { return t.type === 'weekly' ? doneThisWeek(t) : doneToday(t); }

function todaysTasks() {
  const d = iso(new Date());
  return S.tasks.filter(t => !t.arch && (
    (t.type === 'daily' && (t.days || []).includes(d)) ||
    (t.type === 'once' && !t.doneAt && (!t.due || t.due <= TODAY())) ||
    (t.type === 'once' && t.doneAt === TODAY())));
}
function weeklyOpen() { return S.tasks.filter(t => !t.arch && t.type === 'weekly'); }
function dayComplete(k) {
  const req = expectedFor(k);
  if (!req.length) return false;
  const h = S.hist[k];
  return !!h && req.every(id => h.done[id]);
}
function progress() {
  const l = todaysTasks(), d = l.filter(isDone).length;
  return { done: d, total: l.length, p: l.length ? d / l.length : 0 };
}
const weekWins = () => weekDays().filter(dayComplete).length;
const totalRaces = () => Object.keys(S.hist).filter(dayComplete).length;

const MONTHS = ['Leden','Únor','Březen','Duben','Květen','Červen',
                'Červenec','Srpen','Září','Říjen','Listopad','Prosinec'];
let period = 'week', pOff = 0;

function periodRange() {
  const now = new Date();
  if (period === 'week') {
    const m = addD(monday(now), pOff * 7);
    const days = [0,1,2,3,4,5,6].map(i => dk(addD(m, i)));
    const a = m, b = addD(m, 6);
    return { days, label: `${a.getDate()}. ${a.getMonth() + 1}. – ${b.getDate()}. ${b.getMonth() + 1}.` };
  }
  const f = new Date(now.getFullYear(), now.getMonth() + pOff, 1);
  const y = f.getFullYear(), mo = f.getMonth(), n = new Date(y, mo + 1, 0).getDate();
  const days = [];
  for (let i = 1; i <= n; i++) days.push(dk(new Date(y, mo, i)));
  return { days, label: `${MONTHS[mo]} ${y}` };
}

function statsFor(days) {
  const td = TODAY();
  const past = days.filter(k => k <= td);
  let done = 0, exp = 0, races = 0, active = 0;
  const per = {};
  past.forEach(k => {
    const req = expectedFor(k);
    if (!req.length) return;
    active++; exp += req.length;
    const h = S.hist[k];
    let d = 0;
    req.forEach(id => {
      const ok = !!(h && h.done[id]);
      if (ok) d++;
      per[id] = per[id] || { exp: 0, done: 0 };
      per[id].exp++; if (ok) per[id].done++;
    });
    done += d;
    if (d === req.length) races++;
  });
  /* týdenní úkoly: za každý týden, který do období spadá */
  const weeks = [...new Set(past.map(k => weekKey(new Date(k + 'T00:00:00'))))];
  const wk = S.tasks.filter(t => !t.arch && t.type === 'weekly');
  let wExp = 0, wDone = 0;
  weeks.forEach(mk => {
    const wd = [0,1,2,3,4,5,6].map(i => dk(addD(new Date(mk + 'T00:00:00'), i)));
    wk.forEach(t => {
      if (t.created && t.created > wd[6]) return;
      wExp++;
      if (wd.some(k => S.hist[k] && S.hist[k].done[t.id])) wDone++;
    });
  });
  /* domácí úkoly podle termínu */
  const hw = S.tasks.filter(t => !t.arch && t.type === 'once' && t.due &&
    days.includes(t.due) && t.due <= td);
  return { done, exp, miss: exp - done, pct: exp ? Math.round(done / exp * 100) : 0,
           races, active, per, wExp, wDone,
           hwExp: hw.length, hwDone: hw.filter(t => t.doneAt).length };
}

function dueLabel(due) {
  const d = Math.round((new Date(due + 'T00:00:00') - new Date(TODAY() + 'T00:00:00')) / 86400000);
  if (d < 0) return d === -1 ? 'Mělo být včera' : `Mělo být před ${-d} dny`;
  if (d === 0) return 'Dnes';
  if (d === 1) return 'Zítra';
  if (d <= 6) return `Za ${d} ${d <= 4 ? 'dny' : 'dní'}`;
  if (d === 7) return 'Za týden';
  return 'Do ' + (+due.slice(8)) + '. ' + (+due.slice(5, 7)) + '.';
}

/* Změna seznamu úkolů mění dnešní dostih, sérii i statistiku. */
function tasksChanged() {
  day(TODAY());
  recalcStreak();
  save(); render();
  raceTo(progress().p);
}

function recalcStreak() {
  let k = TODAY(), n = 0;
  if (!dayComplete(k)) k = dk(addD(new Date(), -1));
  while (dayComplete(k) && n < 400) { n++; k = dk(addD(new Date(k + 'T00:00:00'), -1)); }
  S.streak.n = n;
  S.streak.best = Math.max(S.streak.best || 0, n);
}

/* ---------- dostih ---------- */
const HORSE = { stand: 'assets/horse-stand.png', run: 'assets/horse-run.png' };
Object.values(HORSE).forEach(src => { const i = new Image(); i.src = src; });

let raceP = 0, raceT = 0;
const runnerLeft = p => (1 + 58 * p).toFixed(1);

function sceneSVG() {
  return `<svg class="scene" viewBox="0 0 400 250" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#A8D4EC"/><stop offset=".62" stop-color="#D8ECF6"/>
        <stop offset="1" stop-color="#EDF4EE"/></linearGradient>
      <linearGradient id="grs" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#9CC182"/><stop offset="1" stop-color="#7BA765"/></linearGradient>
      <linearGradient id="drt" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#9E7A55"/><stop offset=".14" stop-color="#C39A6D"/>
        <stop offset="1" stop-color="#A9855E"/></linearGradient>
      <filter id="hz" x="-10%" y="-40%" width="120%" height="200%">
        <feGaussianBlur stdDeviation="3.5"/></filter>
    </defs>
    <rect width="400" height="250" fill="url(#sky)"/>
    <circle cx="336" cy="44" r="26" fill="#FFF6DC" opacity=".85"/>
    <g filter="url(#hz)" fill="#FFFFFF" opacity=".72">
      <ellipse cx="74" cy="56" rx="34" ry="9"/><ellipse cx="218" cy="38" rx="27" ry="7"/>
      <ellipse cx="150" cy="82" rx="20" ry="5"/></g>
    <g filter="url(#hz)">
      <path d="M0 148 C58 126 116 142 176 132 C244 121 306 138 400 126 L400 178 L0 178 Z" fill="#A9C6B4"/>
      <path d="M0 158 C70 142 138 158 214 150 C292 142 344 156 400 148 L400 186 L0 186 Z" fill="#93B88E"/>
    </g>
    <rect y="170" width="400" height="28" fill="url(#grs)"/>
    <g stroke="#FBF6EC" stroke-linecap="round" opacity=".96">
      <path d="M0 168 H400" stroke-width="4"/><path d="M0 180 H400" stroke-width="4"/>
      ${[18, 92, 166, 240, 314, 388].map(x => `<path d="M${x} 158 v30" stroke-width="5"/>`).join('')}</g>
    <g stroke="#000" opacity=".1" stroke-linecap="round">
      <path d="M0 171 H400" stroke-width="1.6"/><path d="M0 183 H400" stroke-width="1.6"/></g>
    <rect y="192" width="400" height="58" fill="url(#drt)"/>
    <path d="M0 192 H400" stroke="#7E5F3F" stroke-width="2.5" opacity=".35"/>
    <g opacity=".18" stroke="#6E5235" stroke-linecap="round" stroke-width="2">
      ${[6,54,102,150,198,246,294,342,380].map((x, i) =>
        `<path d="M${x} ${206 + (i % 3) * 12} h${16 + (i % 4) * 7}"/>`).join('')}</g>
    <g opacity=".13" fill="#5E4527">
      ${[[28,222],[96,236],[164,214],[232,240],[300,220],[358,234],[64,244],[268,228]]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2"/>`).join('')}</g>
  </svg>`;
}

function finishSVG() {
  return `<svg class="finish" viewBox="0 0 40 130" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
    <rect x="17" y="8" width="5" height="122" rx="2" fill="#F3EADA"/>
    <rect x="17" y="8" width="2" height="122" fill="#CBBDA6"/>
    <g>${[0,1,2,3].map(r => [0,1,2].map(c =>
      `<rect x="${22 + c * 6}" y="${8 + r * 6}" width="6" height="6"
             fill="${(r + c) % 2 ? '#FFFFFF' : '#2B2622'}"/>`).join('')).join('')}</g>
  </svg>`;
}

function raceTo(target, finished) {
  const el = document.getElementById('runner');
  if (!el) { raceP = target; return; }
  if (target <= raceP) {
    raceP = target; void el.offsetWidth;
    requestAnimationFrame(() => { el.style.left = runnerLeft(target) + '%'; });
    return;
  }
  clearTimeout(raceT);
  el.src = HORSE.run;
  el.classList.add('running');
  requestAnimationFrame(() => { el.style.left = runnerLeft(target) + '%'; });
  raceT = setTimeout(() => {
    raceP = target;
    el.classList.remove('running');
    el.src = HORSE.stand;
    if (finished) { el.classList.add('cheer'); confetti(90);
      setTimeout(() => el.classList.remove('cheer'), 1400); }
  }, 1250);
}

/* ---------- akce ---------- */
function toggleTask(t) {
  const k = TODAY(), h = day(k), wasDone = isDone(t);
  if (wasDone) {
    if (t.type === 'weekly') weekDays().forEach(d => { if (S.hist[d]) delete S.hist[d].done[t.id]; });
    else { delete h.done[t.id]; if (t.type === 'once') delete t.doneAt; }
    recalcStreak(); save(); render(); raceTo(progress().p);
    return;
  }
  h.done[t.id] = true;
  if (t.type === 'once') t.doneAt = k;
  const after = progress();
  const finished = after.total > 0 && after.done === after.total && t.type !== 'weekly';
  recalcStreak(); save(); render();
  if (t.type === 'weekly') { confetti(40); ding(false); toast('Týdenní úkol hotový 👏'); return; }
  raceTo(after.p, finished);
  ding(finished);
  toast(finished ? `🏆 ${S.horse.name} je v cíli!` : `Hurá! ${after.done} ze ${after.total}`);
}

function claimGoal() {
  S.goal.claimed = true; save(); render(); confetti(90); ding(true);
  toast('Cíl týdne splněn! 🎉');
}

/* ---------- efekty ---------- */
let toastT;
function toast(msg) {
  const el = $('#toast'); el.innerHTML = msg; el.hidden = false;
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 2400);
}
let actx;
function ding(big) {
  if (!S.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    (big ? [523, 659, 784, 1047, 1319] : [660, 880, 1170]).forEach((f, i) => {
      const t = i * .085, o = actx.createOscillator(), g = actx.createGain();
      o.type = 'square'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, actx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.09, actx.currentTime + t + .02);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + t + .22);
      o.connect(g); g.connect(actx.destination);
      o.start(actx.currentTime + t); o.stop(actx.currentTime + t + .24);
    });
  } catch (e) {}
}
const cvs = $('#confetti'), cctx = cvs.getContext('2d');
let parts = [], praf = 0;
function confetti(n) {
  const dpr = window.devicePixelRatio || 1;
  cvs.width = innerWidth * dpr; cvs.height = innerHeight * dpr;
  cvs.style.width = innerWidth + 'px'; cvs.style.height = innerHeight + 'px';
  cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const colors = ['#E8556D', '#F2B33D', '#5AA55F', '#4F8FC4', '#9A6BD0'];
  for (let i = 0; i < (n || 40); i++) parts.push({
    x: innerWidth / 2 + (Math.random() - .5) * 180, y: innerHeight * .3,
    vx: (Math.random() - .5) * 9, vy: -Math.random() * 11 - 3,
    s: 4 + Math.round(Math.random() * 3) * 2, r: 0, vr: 0,
    c: colors[(Math.random() * colors.length) | 0], life: 90 + Math.random() * 40
  });
  if (!praf) praf = requestAnimationFrame(pstep);
}
function pstep() {
  cctx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter(p => p.life-- > 0 && p.y < innerHeight + 40);
  parts.forEach(p => {
    p.vy += .38; p.x += p.vx; p.y += p.vy; p.vx *= .995;
    cctx.fillStyle = p.c;
    cctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
  });
  praf = parts.length ? requestAnimationFrame(pstep) : 0;
  if (!praf) cctx.clearRect(0, 0, innerWidth, innerHeight);
}

/* ---------- sheety ---------- */
function openSheet(title, html, after) {
  $('#sheetTitle').textContent = title;
  $('#sheetBody').innerHTML = html;
  $('#sheet').hidden = false;
  if (after) after($('#sheetBody'));
}
function closeSheet() { $('#sheet').hidden = true; }
$('#sheet').addEventListener('click', e => { if (e.target.hasAttribute('data-close')) closeSheet(); });

/* ---------- obrazovky ---------- */
function heroHTML() {
  const pr = progress(), win = pr.total > 0 && pr.done === pr.total;
  const virgin = !S.tasks.some(t => !t.arch);
  return `<div class="hero">
    <div class="track">
      ${sceneSVG()}${finishSVG()}
      <img id="runner" class="runner" src="${HORSE.stand}" alt="" draggable="false"
           style="left:${runnerLeft(raceP)}%">
    </div>
    <div class="hero-foot">
      <div class="race-lbl"><b>${virgin ? '🐴 Kůň čeká na startu' : win ? '🏆 V cíli!' : '🏁 Dnešní dostih'}</b>
        <span>${virgin ? '' : pr.done + ' ze ' + pr.total}</span></div>
      <div class="race-bar"><i style="width:${(pr.p * 100).toFixed(1)}%"></i></div>
    </div></div>`;
}

function goalHTML() {
  const w = weekWins(), t = S.goal.days || 5, p = clamp(w / t, 0, 1);
  const ready = w >= t && !S.goal.claimed;
  return `<div class="goal">
    <div class="goal-top"><h3>🎁 Cíl týdne</h3><span class="goal-num">${w} z ${t} ${plur(t, 'dne', 'dnů', 'dnů')}</span></div>
    <div class="race-bar gold"><i style="width:${p * 100}%"></i></div>
    ${S.goal.reward ? `<div class="rew">Odměna: <b>${S.goal.reward}</b></div>`
      : `<button class="rew rew-btn" data-act="parents">Odměnu vyplní rodiče →</button>`}
    ${ready ? `<button class="btn gold" style="margin-top:12px" data-act="claim">Vyzvednout odměnu 🎉</button>` : ''}
    ${S.goal.claimed ? `<div class="rew">✅ Splněno — hurá!</div>` : ''}</div>`;
}

function schoolHTML() {
  const d = iso(new Date()), weekend = d > 5, show = weekend ? 1 : d;
  return `<div class="card">
    <div class="card-top"><h3>🎒 ${weekend ? 'V pondělí ve škole' : 'Dnes ve škole'}</h3>
      <button class="lnk" data-act="rozvrh">Celý rozvrh</button></div>
    <ol class="lessons">${SCHEDULE[show].map((nm, i) =>
      `<li><span class="ln">${i + 1}.</span><span class="li-ico">${lessonIco(nm)}</span>${nm}</li>`).join('')}</ol>
    <button class="btn lav" style="margin-top:14px" data-act="hw">➕ Přidat domácí úkol</button></div>`;
}

function taskHTML(t, showWhen) {
  const done = isDone(t);
  const when = t.type === 'weekly' ? 'Tento týden'
    : t.type === 'once' && t.due ? dueLabel(t.due) : '';
  return `<div class="task ${done ? 'done' : ''}" data-task="${t.id}">
    <div class="emo ${catCls(t.cat)}">${t.emo}</div>
    <div class="tx"><div class="tt">${t.title}</div>
      ${showWhen && when ? `<div class="ts">${when}</div>` : ''}</div>
    <div class="chk">${done ? '✓' : ''}</div></div>`;
}

function viewDnes() {
  const list = todaysTasks(), done = list.filter(isDone).length, left = list.length - done;
  const virgin = !S.tasks.some(t => !t.arch);
  if (virgin) return heroHTML() + `<div class="card welcome">
      <h3>👋 Vítej ve stáji!</h3>
      <p>Zatím tu nejsou žádné úkoly. Domluv se s rodiči, co budeš plnit, a přidej si je sem.</p>
      <p>Každý splněný úkol popožene koně po dráze. Když stihneš všechny, dojede do cíle.</p>
      <button class="btn" style="margin-top:14px" data-act="new">➕ Přidat první úkol</button>
    </div>` + schoolHTML();
  const wk = weeklyOpen().filter(t => !doneThisWeek(t));
  const soon = S.tasks.filter(t => !t.arch && t.type === 'once' && !t.doneAt && t.due && t.due > TODAY())
                      .sort((a, b) => a.due < b.due ? -1 : 1);
  return heroHTML() + goalHTML() + schoolHTML() +
    `<div class="section-title">${list.length && left === 0 ? 'Dnešek je hotový 🎉'
      : left ? plur(left, 'Zbývá 1 úkol', 'Zbývají ' + left + ' úkoly', 'Zbývá ' + left + ' úkolů') : 'Dnešní plán'}</div>` +
    (list.length ? list.map(t => taskHTML(t, true)).join('')
      : `<div class="empty"><span class="big">🌈</span>Dneska máš volno! Můžeš si přidat vlastní úkol.</div>`) +
    (wk.length ? `<div class="section-title">Tento týden</div>` + wk.map(t => taskHTML(t)).join('') : '') +
    (soon.length ? `<div class="section-title">Chystá se</div>` + soon.map(t => taskHTML(t, true)).join('') : '') +
    `<button class="btn sec" style="margin-top:6px" data-act="new">➕ Přidat úkol</button>`;
}

function viewTyden() {
  const { days, label } = periodRange(), st = statsFor(days), td = TODAY();
  const isWeek = period === 'week';
  const taskName = id => (S.tasks.find(t => t.id === id) || S.gone[id] || {});

  const strip = isWeek ? `<div class="week-strip">${days.map((k, i) => {
      const req = expectedFor(k), h = S.hist[k];
      const d = req.filter(id => h && h.done[id]).length;
      const cls = k > td ? 'fut' : !req.length ? 'none' : d === req.length ? 'full' : d ? 'part' : 'zero';
      return `<div class="day ${k === td ? 'today' : ''} ${cls}">
        <b>${DOW[i]}</b><span class="mark">${k > td ? '·' : !req.length ? '–'
          : d === req.length ? '🏆' : d ? d + '/' + req.length : '—'}</span></div>`;
    }).join('')}</div>`
    : `<div class="mgrid">${days.map(k => {
      const req = expectedFor(k), h = S.hist[k];
      const d = req.filter(id => h && h.done[id]).length;
      const cls = k > td ? 'fut' : !req.length ? 'none' : d === req.length ? 'full' : d ? 'part' : 'zero';
      return `<div class="mday ${k === td ? 'today' : ''} ${cls}">${+k.slice(8)}</div>`;
    }).join('')}</div>`;

  const rows = Object.keys(st.per).map(id => {
    const t = taskName(id), p = st.per[id], pc = p.exp ? Math.round(p.done / p.exp * 100) : 0;
    const gone = !S.tasks.some(x => x.id === id);
    return { emo: t.emo || '•', title: (t.title || 'Smazaný úkol') + (gone ? ' · smazáno' : ''), ...p, pc };
  }).sort((a, b) => a.pc - b.pc);

  return `<div class="seg" id="seg">
      <button data-p="week" class="${isWeek ? 'on' : ''}">Týden</button>
      <button data-p="month" class="${!isWeek ? 'on' : ''}">Měsíc</button></div>
    <div class="pernav">
      <button data-off="-1" aria-label="Předchozí">‹</button>
      <b>${pOff === 0 ? (isWeek ? 'Tento týden' : 'Tento měsíc') : label}</b>
      <button data-off="1" ${pOff >= 0 ? 'disabled' : ''} aria-label="Další">›</button></div>
    ${pOff !== 0 ? '' : `<div class="card streak-card">
      <div class="streak-ico">🔥</div>
      <div><h2>${S.streak.n} ${plur(S.streak.n, 'den', 'dny', 'dní')} v řadě</h2>
      <p>Nejdelší série ${S.streak.best} · dostihů celkem ${totalRaces()}</p></div></div>`}

    <div class="kpi">
      <div class="k ok"><b>${st.done}</b><span>splněno</span></div>
      <div class="k no"><b>${st.miss}</b><span>nesplněno</span></div>
      <div class="k pc"><b>${st.pct} %</b><span>úspěšnost</span></div>
    </div>

    <div class="card">
      <div class="srow"><span>🏆 Dojetých dostihů</span><b>${st.races} z ${st.active}
        ${plur(st.active, 'dne', 'dnů', 'dnů')}</b></div>
      ${st.wExp ? `<div class="srow"><span>🧹 Týdenní úkoly</span><b>${st.wDone} z ${st.wExp}</b></div>` : ''}
      ${st.hwExp ? `<div class="srow"><span>📚 Domácí úkoly</span><b>${st.hwDone} z ${st.hwExp}</b></div>` : ''}
    </div>

    <div class="section-title">${isWeek ? 'Dny v týdnu' : 'Dny v měsíci'}</div>
    ${strip}

    <div class="section-title">Po jednotlivých úkolech</div>
    ${rows.length ? `<div class="card">${rows.map(r => `
      <div class="tstat">
        <span class="t-emo">${r.emo}</span>
        <div class="t-mid"><div class="t-nm">${r.title}</div>
          <div class="t-bar"><i class="${r.pc >= 80 ? 'hi' : r.pc >= 50 ? 'mid' : 'lo'}"
            style="width:${r.pc}%"></i></div></div>
        <b class="t-num">${r.done}/${r.exp}</b></div>`).join('')}</div>`
      : `<div class="empty">Za tohle období zatím nejsou data</div>`}`;
}

function viewUkoly() {
  const grp = (nm, arr) => arr.length ? `<div class="section-title">${nm}</div>` + arr.map(t => `
    <div class="task" data-edit="${t.id}">
      <div class="emo ${catCls(t.cat)}">${t.emo}</div>
      <div class="tx"><div class="tt">${t.title}</div>
        <div class="ts">${t.type === 'daily' ? (t.days || []).map(d => DOW[d - 1]).join(' ')
          : t.type === 'weekly' ? 'Každý týden' : (t.due || 'jednorázově')}</div></div>
      <div class="chev">›</div></div>`).join('') : '';
  const stale = dk(addD(new Date(), -14));
  const a = S.tasks.filter(t => !t.arch && !(t.type === 'once' && t.doneAt && t.doneAt < stale));
  return `<button class="btn" data-act="new">➕ Nový úkol</button>
    ${grp('Každý den', a.filter(t => t.type === 'daily'))}
    ${grp('Každý týden', a.filter(t => t.type === 'weekly'))}
    ${grp('Jednorázové', a.filter(t => t.type === 'once'))}
    <div class="section-title">Další</div>
    <button class="btn sec" data-act="rozvrh">🗓️ Rozvrh hodin</button>
    <div style="height:10px"></div>
    <button class="btn sec" data-act="parents">⚙️ Pro rodiče a nastavení</button>`;
}

function render() {
  $('#horseName').textContent = S.horse.name;
  $('#statStreak').querySelector('b').textContent = S.streak.n;
  $('#screen').innerHTML = ({ dnes: viewDnes, tyden: viewTyden, ukoly: viewUkoly })[tab]();
  document.querySelectorAll('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
}

/* ---------- editor úkolu ---------- */
function editSheet(t) {
  const nw = !t;
  t = t || { id: uid(), title: '', emo: '✏️', cat: 'domov', type: 'daily', days: [1,2,3,4,5,6,7], created: TODAY() };
  const d = JSON.parse(JSON.stringify(t));
  openSheet(nw ? 'Nový úkol' : 'Upravit úkol', `
    <label class="f">Co mám udělat?</label>
    <input type="text" id="fT" value="${d.title.replace(/"/g, '&quot;')}" placeholder="Např. Uklidit si stůl" autocomplete="off">
    <label class="f">Obrázek</label>
    <div class="emo-grid" id="fE">${EMOJIS.map(e => `<button class="emo-pick ${e === d.emo ? 'on' : ''}" data-e="${e}">${e}</button>`).join('')}</div>
    <label class="f">Kam patří</label>
    <div class="chips" id="fC">${CATS.map(c => `<button class="chip ${c.id === d.cat ? 'on' : ''}" data-c="${c.id}">${c.nm}</button>`).join('')}</div>
    <label class="f">Jak často</label>
    <div class="chips" id="fY">${[['daily','Každý den'],['weekly','Každý týden'],['once','Jen jednou']].map(([k, n]) =>
      `<button class="chip ${k === d.type ? 'on' : ''}" data-y="${k}">${n}</button>`).join('')}</div>
    <p class="note" style="margin-top:9px">Opakující se úkol se objeví znovu každý den (nebo týden).
      <b>Jen jednou</b> zmizí, jakmile ho splní.</p>
    <div id="fDaysWrap" ${d.type !== 'daily' ? 'hidden' : ''}>
      <label class="f">Ve které dny</label>
      <div class="days" id="fD">${DOW.map((n, i) => `<button class="${(d.days || []).includes(i + 1) ? 'on' : ''}" data-d="${i + 1}">${n}</button>`).join('')}</div>
    </div>
    <div id="fDueWrap" ${d.type !== 'once' ? 'hidden' : ''}>
      <label class="f">Do kdy (nepovinné)</label><input type="date" id="fDue" value="${d.due || ''}">
    </div>
    <div style="height:18px"></div>
    <button class="btn" id="fSave">Uložit</button>
    ${nw ? '' : `<button class="btn ghost" style="margin-top:8px" id="fDel">Smazat úkol</button>`}`, box => {
    const pick = (sel, attr, fn) => box.querySelector(sel).addEventListener('click', e => {
      const b = e.target.closest('[data-' + attr + ']'); if (!b) return; fn(b.dataset[attr], b);
    });
    pick('#fE', 'e', v => { d.emo = v; box.querySelectorAll('#fE .emo-pick').forEach(x => x.classList.toggle('on', x.dataset.e === v)); });
    pick('#fC', 'c', v => { d.cat = v; box.querySelectorAll('#fC .chip').forEach(x => x.classList.toggle('on', x.dataset.c === v)); });
    pick('#fY', 'y', v => {
      d.type = v; box.querySelectorAll('#fY .chip').forEach(x => x.classList.toggle('on', x.dataset.y === v));
      box.querySelector('#fDaysWrap').hidden = v !== 'daily';
      box.querySelector('#fDueWrap').hidden = v !== 'once';
    });
    pick('#fD', 'd', (v, b) => {
      const n = +v; d.days = d.days || [];
      d.days = d.days.includes(n) ? d.days.filter(x => x !== n) : d.days.concat(n);
      b.classList.toggle('on', d.days.includes(n));
    });
    box.querySelector('#fSave').addEventListener('click', () => {
      d.title = box.querySelector('#fT').value.trim();
      if (!d.title) { toast('Napiš, co máš udělat 🙂'); return; }
      if (d.type === 'once') d.due = box.querySelector('#fDue').value || '';
      if (d.type === 'daily' && !(d.days || []).length) d.days = [1,2,3,4,5,6,7];
      const i = S.tasks.findIndex(x => x.id === d.id);
      if (i >= 0) S.tasks[i] = d; else S.tasks.push(d);
      closeSheet(); tasksChanged(); toast(nw ? 'Úkol přidán 🎉' : 'Uloženo ✓');
    });
    const del = box.querySelector('#fDel');
    if (del) del.addEventListener('click', () => {
      if (!confirm(`Smazat úkol „${d.title}"?\n\nZmizí ze seznamu a už se nikdy neobjeví. ` +
                   `V přehledu minulých týdnů zůstane, aby čísla za odehrané dny seděla.`)) return;
      const cur = S.tasks.find(x => x.id === d.id);
      if (cur) S.gone[cur.id] = { title: cur.title, emo: cur.emo };
      S.tasks = S.tasks.filter(x => x.id !== d.id);
      closeSheet(); tasksChanged(); toast('Úkol smazán');
    });
  });
}

function rozvrhSheet() {
  const d = iso(new Date());
  openSheet('Rozvrh hodin', `<div class="sched">${[1,2,3,4,5].map(i => `
    <div class="sched-day ${i === d ? 'on' : ''}">
      <div class="sched-nm">${DOW[i - 1]}</div>
      <ol class="lessons small">${SCHEDULE[i].map((nm, j) =>
        `<li><span class="ln">${j + 1}.</span><span class="li-ico">${lessonIco(nm)}</span>${nm}</li>`).join('')}</ol>
    </div>`).join('')}</div><p class="note">Rozvrh je pevný na celý rok.</p>`);
}

function homeworkSheet() {
  const d = iso(new Date());
  const todayL = (SCHEDULE[d] || []).join(' '), tomL = (SCHEDULE[d >= 5 ? 1 : d + 1] || []).join(' ');
  const near = HW.filter(x => todayL.indexOf(x.nm) >= 0 || tomL.indexOf(x.nm) >= 0);
  const rest = HW.filter(x => near.indexOf(x) < 0);
  let when = 'zitra';
  const grid = arr => `<div class="pick-grid">${arr.map(x =>
    `<button class="pick" data-hw="${x.nm}"><span class="p-ico">${x.ico}</span>
      <span class="p-nm">${x.nm}</span></button>`).join('')}</div>`;
  openSheet('Domácí úkol', `
    <label class="f">Kdy to musí být hotové</label>
    <div class="chips" id="hwWhen">
      <button class="chip" data-w="dnes">Dnes</button>
      <button class="chip on" data-w="zitra">Zítra</button>
      <button class="chip" data-w="tyden">Za týden</button>
      <button class="chip" data-w="jine">Jiné datum</button></div>
    <div id="hwDate" hidden><input type="date" id="hwD" value="${dk(addD(new Date(), 7))}"></div>
    <p class="note" style="margin-top:10px">Úkol se objeví v dnešním dostihu v den termínu.
      Do té doby čeká v sekci <b>Chystá se</b> s odpočtem.</p>
    ${near.length ? `<label class="f">Z dnešního a zítřejšího rozvrhu</label>${grid(near)}` : ''}
    ${rest.length ? `<label class="f">Ostatní</label>${grid(rest)}` : ''}
    <div style="height:14px"></div>`, box => {
    box.querySelector('#hwWhen').addEventListener('click', e => {
      const b = e.target.closest('[data-w]'); if (!b) return;
      when = b.dataset.w;
      box.querySelectorAll('#hwWhen .chip').forEach(x => x.classList.toggle('on', x === b));
      box.querySelector('#hwDate').hidden = when !== 'jine';
    });
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-hw]'); if (!b) return;
      const nm = b.dataset.hw, x = HW.find(y => y.nm === nm);
      const due = when === 'dnes' ? TODAY()
                : when === 'zitra' ? dk(addD(new Date(), 1))
                : when === 'tyden' ? dk(addD(new Date(), 7))
                : (box.querySelector('#hwD').value || dk(addD(new Date(), 7)));
      S.tasks.push({ id: uid(), title: 'Úkol – ' + nm, emo: x.ico, cat: 'skola', type: 'once',
        due, created: TODAY() });
      closeSheet(); tasksChanged();
      toast(`Úkol z ${nm}: ${dueLabel(due).toLowerCase()} 📚`);
    });
  });
}

function parentsSheet() {
  openSheet('Pro rodiče', `
    <p class="note">Cíl týdne je počet dnů, kdy dojede do cíle — tedy dnů, kdy splní všechny své denní úkoly.</p>
    <label class="f">Kolik dnů v týdnu</label>
    <div class="chips" id="pD">${[3,4,5,6,7].map(n =>
      `<button class="chip ${n === S.goal.days ? 'on' : ''}" data-d="${n}">${n}</button>`).join('')}</div>
    <label class="f">Odměna za splněný cíl</label>
    <input type="text" id="pR" value="${(S.goal.reward || '').replace(/"/g, '&quot;')}" placeholder="Např. výlet do stáje">
    <label class="f">Jméno koně</label>
    <input type="text" id="pH" value="${S.horse.name.replace(/"/g, '&quot;')}">
    <label class="f">Zvuky</label>
    <div class="chips" id="pS">
      <button class="chip ${S.sound ? 'on' : ''}" data-s="1">Zapnuté</button>
      <button class="chip ${!S.sound ? 'on' : ''}" data-s="0">Vypnuté</button></div>
    <div style="height:18px"></div>
    <button class="btn" id="pSave">Uložit</button>
    <div class="section-title">Záloha</div>
    <p class="note">Data jsou jen v tomto telefonu. Zkopírujte si text níže jako zálohu, nebo sem vložte starší zálohu a dejte Obnovit.</p>
    <textarea id="pB" spellcheck="false">${JSON.stringify(S)}</textarea>
    <div class="btn-row" style="margin-top:10px">
      <button class="btn sec" id="pRestore">Obnovit ze zálohy</button>
      <button class="btn sec danger" id="pReset">Vymazat vše</button></div>
    <div style="height:10px"></div>`, box => {
    box.querySelector('#pD').addEventListener('click', e => {
      const b = e.target.closest('[data-d]'); if (!b) return;
      S.goal.days = +b.dataset.d;
      box.querySelectorAll('#pD .chip').forEach(x => x.classList.toggle('on', x === b));
    });
    box.querySelector('#pS').addEventListener('click', e => {
      const b = e.target.closest('[data-s]'); if (!b) return;
      S.sound = b.dataset.s === '1';
      box.querySelectorAll('#pS .chip').forEach(x => x.classList.toggle('on', x === b));
    });
    box.querySelector('#pSave').addEventListener('click', () => {
      S.goal.reward = box.querySelector('#pR').value.trim();
      S.horse.name = box.querySelector('#pH').value.trim() || 'Hvězdička';
      save(); closeSheet(); render(); toast('Uloženo ✓');
    });
    box.querySelector('#pRestore').addEventListener('click', () => {
      try {
        const o = JSON.parse(box.querySelector('#pB').value);
        if (!o || !o.tasks) throw 0;
        localStorage.setItem(KEY, JSON.stringify(o));
        load(); save(); closeSheet(); raceP = progress().p; render(); toast('Obnoveno ✓');
      } catch (e) { toast('Záloha nejde přečíst'); }
    });
    box.querySelector('#pReset').addEventListener('click', () => {
      if (!confirm('Opravdu vymazat všechna data a začít znovu?')) return;
      S = fresh(); save(); closeSheet(); raceP = 0; render();
    });
  });
}

/* ---------- události ---------- */
document.addEventListener('click', e => {
  const tb = e.target.closest('#tabbar button');
  if (tb) { tab = tb.dataset.tab; pOff = 0; render(); window.scrollTo(0, 0); return; }
  const sg = e.target.closest('#seg button');
  if (sg) { period = sg.dataset.p; pOff = 0; render(); return; }
  const pv = e.target.closest('[data-off]');
  if (pv && !pv.disabled) { pOff = Math.min(0, pOff + (+pv.dataset.off)); render(); return; }
  const tk = e.target.closest('[data-task]');
  if (tk) { const t = S.tasks.find(x => x.id === tk.dataset.task); if (t) toggleTask(t); return; }
  const ed = e.target.closest('[data-edit]');
  if (ed) { editSheet(S.tasks.find(x => x.id === ed.dataset.edit)); return; }
  const ac = e.target.closest('[data-act]');
  if (ac) {
    const a = ac.dataset.act;
    if (a === 'new') editSheet(null);
    else if (a === 'parents') parentsSheet();
    else if (a === 'claim') claimGoal();
    else if (a === 'rozvrh') rozvrhSheet();
    else if (a === 'hw') homeworkSheet();
  }
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { load(); raceP = progress().p; render(); }
});

/* ---------- start ---------- */
load(); recalcStreak(); raceP = progress().p; render(); save();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
