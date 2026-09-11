/* ==========================================================================
   Stáj Tiffany — offline organizér. Plnění úkolů = péče o koně a dostih.
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
const HS = '<span class="hs"></span>';
const plur = (n, a, b, c) => (n === 1 ? a : n >= 2 && n <= 4 ? b : c);

/* ---------- pevný rozvrh (3. třída, celý rok) ---------- */
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

const HW_SUBJECTS = [
  { nm: 'Čeština', ico: '📕' }, { nm: 'Matematika', ico: '🔢' }, { nm: 'English', ico: '🇬🇧' },
  { nm: 'Čtení', ico: '📖' }, { nm: 'Prvouka', ico: '🌍' }, { nm: 'Geometrie', ico: '📐' },
  { nm: 'Výtvarka', ico: '🎨' }, { nm: 'Workshop', ico: '🛠️' }
];

/* ---------- péče o koně: co udělá každý splněný úkol ---------- */
const CARE = [
  { ico: '🌾', nm: 'Seno',   say: 'Nasypala jsi mu seno' },
  { ico: '💧', nm: 'Voda',   say: 'Nalila jsi čerstvou vodu' },
  { ico: '🧼', nm: 'Mytí',   say: 'Umyla jsi ho do lesku' },
  { ico: '🪮', nm: 'Hříva',  say: 'Vyčesala jsi mu hřívu' },
  { ico: '🔨', nm: 'Kopyta', say: 'Vyčistila jsi mu kopyta' },
  { ico: '🐎', nm: 'Sedlo',  say: 'Osedlala jsi ho' },
  { ico: '🏁', nm: 'Cíl',    say: 'A je v cíli!' }
];

const LEVELS = [
  { xp: 0,    name: 'Hříbátko' },       { xp: 120,  name: 'Poník' },
  { xp: 300,  name: 'Nováček ve stáji'},{ xp: 550,  name: 'Malá jezdkyně' },
  { xp: 900,  name: 'Jezdkyně' },       { xp: 1400, name: 'Skokanka' },
  { xp: 2000, name: 'Drezurní hvězda'}, { xp: 2800, name: 'Kovbojka' },
  { xp: 3800, name: 'Šampionka' },      { xp: 5000, name: 'Legenda stáje' }
];

const BADGES = [
  { id: 'first',   ico: '⭐', nm: 'První úkol',        test: s => s.stats.tasks >= 1 },
  { id: 'race1',   ico: '🏁', nm: 'První dostih',      test: s => s.stats.races >= 1 },
  { id: 'race5',   ico: '🏆', nm: '5 dostihů',         test: s => s.stats.races >= 5 },
  { id: 'd3',      ico: '🔥', nm: '3 dny v řadě',      test: s => s.streak.best >= 3 },
  { id: 'd7',      ico: '🏅', nm: 'Celý týden',        test: s => s.streak.best >= 7 },
  { id: 'd30',     ico: '👑', nm: '30 dní v řadě',     test: s => s.streak.best >= 30 },
  { id: 'c100',    ico: HS,  nm: '100 podkov',         test: s => s.xp >= 100 },
  { id: 'c1000',   ico: '💎', nm: '1000 podkov',       test: s => s.xp >= 1000 },
  { id: 'week4',   ico: '🧹', nm: '4× týdenní úklid',  test: s => s.stats.weekly >= 4 },
  { id: 'school10',ico: '📚', nm: '10 úkolů do školy', test: s => s.stats.school >= 10 },
  { id: 'early',   ico: '🌅', nm: 'Ranní ptáče',       test: s => s.stats.early },
  { id: 'shop1',   ico: '🎀', nm: 'První nákup',       test: s => s.stats.buys >= 1 }
];

const GEAR = [
  { id: 'head:masle',   ico: '🎀', nm: 'Mašle do hřívy', pr: 50,  slot: 'head', v: 'masle' },
  { id: 'head:uzdecka', ico: '🪢', nm: 'Uzdečka',        pr: 90,  slot: 'head', v: 'uzdecka' },
  { id: 'head:kvetiny', ico: '🌸', nm: 'Květiny do hřívy', pr: 120, slot: 'head', v: 'kvetiny' },
  { id: 'body:deka',    ico: '🟦', nm: 'Závodní dečka',  pr: 150, slot: 'body', v: 'deka' },
  { id: 'body:sedlo',   ico: '🏇', nm: 'Sedlo',          pr: 260, slot: 'body', v: 'sedlo' },
  { id: 'body:plast',   ico: '✨', nm: 'Hvězdná deka',   pr: 380, slot: 'body', v: 'plast' },
  { id: 'head:roh',     ico: '🦄', nm: 'Jednorožčí roh', pr: 550, slot: 'head', v: 'roh' }
];

const SCENES = {
  louka: { nm:'Louka', ico:'🌳', pr:0, night:false,
    sky:['#7FC2E8','#C9E6F5'], haze:'#EDF6FB', sun:'#FFF6D2', cloud:'#FFFFFF',
    far:'#A7C3A6', mid:'#84B26E', grass:['#7FB765','#548F45'],
    track:['#D9AC74','#AD7F4C'], tree:['#4E8C4A','#2F5C31'], trunk:'#6A4B31' },
  zapad: { nm:'Západ slunce', ico:'🌇', pr:200, night:false,
    sky:['#F0A863','#FFD6A8'], haze:'#FFE4C4', sun:'#FFF4D8', cloud:'#FFC9A4',
    far:'#B08A76', mid:'#8E6A52', grass:['#8A6349','#5E4130'],
    track:['#DDAF80','#A87A50'], tree:['#5C4032','#33231B'], trunk:'#3E2A1E' },
  hory: { nm:'Hory', ico:'🏔️', pr:300, night:false,
    sky:['#93C9EC','#DCEEF9'], haze:'#EAF4FB', sun:'#FFFBE8', cloud:'#FFFFFF',
    far:'#A9BCC9', mid:'#7FA76A', grass:['#79AC61','#4F8742'],
    track:['#D2AB80','#A47F58'], tree:['#3E7A45','#26522E'], trunk:'#5C432E' },
  noc: { nm:'Hvězdná noc', ico:'🌙', pr:450, night:true,
    sky:['#1D2550','#5A5286'], haze:'#6E6494', sun:'#FFF8DC', cloud:'#3E4570',
    far:'#39405E', mid:'#33513F', grass:['#33523F','#1F3628'],
    track:['#8A7358','#5E4C39'], tree:['#1F4030','#12271D'], trunk:'#2A1F18' }
};

const COAT_PR = { hnedak: 0, ryzka: 70, plavak: 100, belous: 130, vranik: 150, strakac: 190, grosak: 240, palomino: 280 };
const MANE_PR = { tmava: 0, cerna: 50, svetla: 70, ryzava: 90, seda: 110, duhova: 320 };

const EMOJIS = ['🎒','📚','✏️','📒','🔢','🇬🇧','🧹','🧺','👕','🛏️','🍽️','🗑️','🪥','🚿','🌙','⏰','🐴','🎹','⚽','🎨','💖','📖','🐕','💧','🌱','🧸','🎵','🏃'];
const CATS = [
  { id: 'skola', nm: 'Škola',   cls: 'cat-skola' }, { id: 'domov', nm: 'Domov',   cls: 'cat-domov' },
  { id: 'ja',    nm: 'Já sama', cls: 'cat-ja' },    { id: 'volno', nm: 'Zábava',  cls: 'cat-volno' }
];
const catCls = c => (CATS.find(x => x.id === c) || CATS[1]).cls;

/* ---------- stav ---------- */
const KEY = 'tiffany.stable.v1';
let S = null, tab = 'dnes', shopTab = 'doplnky', lastP = 0;

function seedTasks() {
  const t = (title, emo, cat, pts, type, days) =>
    ({ id: uid(), title, emo, cat, pts, type, days: days || [1,2,3,4,5,6,7], created: TODAY() });
  return [
    t('Připravit si tašku do školy', '🎒', 'skola', 10, 'daily', [1,2,3,4,5]),
    t('Udělat domácí úkoly',         '📚', 'skola', 15, 'daily', [1,2,3,4,5]),
    t('Vyčistit si zuby ráno i večer','🪥', 'ja',     5, 'daily'),
    t('Poskládat a uklidit oblečení', '👕', 'domov', 10, 'daily'),
    t('Nachystat si věci na zítra',   '🌙', 'ja',     8, 'daily', [1,2,3,4,7]),
    t('Uklidit si pokoj',             '🧹', 'domov', 40, 'weekly'),
    t('Srovnat tašku a sešity',       '📒', 'skola', 20, 'weekly'),
    t('Udělat někomu radost',         '💖', 'volno', 10, 'weekly')
  ];
}

function fresh() {
  return {
    v: 2, kid: 'Tiffany', coins: 40, xp: 0,
    streak: { n: 0, best: 0, last: null },
    horse: { name: 'Hvězdička', coat: 'hnedak', mane: 'tmava' },
    owned: ['coat:hnedak', 'mane:tmava', 'scene:louka'],
    eq: { head: null, body: null, scene: 'louka' },
    tasks: seedTasks(), hist: {}, badges: {},
    goal: { target: 200, reward: '', week: weekKey(new Date()), claimed: false },
    stats: { tasks: 0, school: 0, weekly: 0, buys: 0, goals: 0, races: 0, early: false },
    sound: true
  };
}

function load() {
  try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
  if (!S) { S = fresh(); return; }
  if (S.v === 1) {                       /* přechod ze staré verze s náladou */
    delete S.horse.mood; delete S.horse.decay;
    S.owned = (S.owned || []).filter(x => !/^(seno|mrkev|cukr|jablko)$/.test(x));
    S.eq = S.eq || {}; delete S.eq.legs;
    S.stats = Object.assign({ tasks: 0, school: 0, weekly: 0, buys: 0, goals: 0, races: 0, early: false }, S.stats || {});
    delete S.schedule;
    S.v = 2;
  }
  if (!S.stats) S.stats = fresh().stats;
  if (S.stats.races == null) S.stats.races = 0;
  /* po překreslení koně už některé staré barvy a doplňky neexistují */
  if (!Horse.COATS[S.horse.coat]) S.horse.coat = 'hnedak';
  if (!Horse.MANES[S.horse.mane]) S.horse.mane = 'tmava';
  if (GEAR.filter(g => g.slot === 'head').every(g => g.v !== S.eq.head)) S.eq.head = null;
  if (GEAR.filter(g => g.slot === 'body').every(g => g.v !== S.eq.body)) S.eq.body = null;
  if (!SCENES[S.eq.scene]) S.eq.scene = 'louka';
  rollGoal();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function rollGoal() {
  const wk = weekKey(new Date());
  if (S.goal.week !== wk) { S.goal.week = wk; S.goal.claimed = false; }
}

/* ---------- výpočty ---------- */
const day = k => (S.hist[k] || (S.hist[k] = { done: {}, bonus: false }));
const level = () => { let i = 0; LEVELS.forEach((l, j) => { if (S.xp >= l.xp) i = j; }); return i; };
const levelName = () => LEVELS[level()].name;
function levelProgress() {
  const i = level(), cur = LEVELS[i].xp, next = LEVELS[i + 1] ? LEVELS[i + 1].xp : cur + 1;
  return LEVELS[i + 1] ? clamp((S.xp - cur) / (next - cur), 0, 1) : 1;
}
function weekDays(d) { const m = monday(d || new Date()); return [0,1,2,3,4,5,6].map(i => dk(addD(m, i))); }
function doneToday(t) { return !!day(TODAY()).done[t.id]; }
function doneThisWeek(t) { return weekDays().some(k => S.hist[k] && S.hist[k].done[t.id]); }
function isDone(t) { return t.type === 'weekly' ? doneThisWeek(t) : doneToday(t); }

function todaysDaily() {
  const d = iso(new Date());
  return S.tasks.filter(t => !t.arch && (
    (t.type === 'daily' && (t.days || []).includes(d)) ||
    (t.type === 'once' && !t.doneAt && (!t.due || t.due <= TODAY())) ||
    (t.type === 'once' && t.doneAt === TODAY())));
}
function weeklyOpen() { return S.tasks.filter(t => !t.arch && t.type === 'weekly'); }
function earnedOn(k) {
  const h = S.hist[k]; if (!h) return 0;
  return Object.keys(h.done).reduce((a, id) => a + h.done[id], 0) + (h.bonus ? 15 : 0);
}
function weekEarned() { return weekDays().reduce((a, k) => a + earnedOn(k), 0); }
function dayComplete(k) {
  const d = new Date(k + 'T00:00:00'), w = iso(d);
  const req = S.tasks.filter(t => !t.arch && t.type === 'daily' && (t.days || []).includes(w));
  if (!req.length) return false;
  const h = S.hist[k];
  return !!h && req.every(t => h.done[t.id]);
}
function progress() {
  const l = todaysDaily(), d = l.filter(isDone).length;
  return { done: d, total: l.length, p: l.length ? d / l.length : 0 };
}
const stageOf = p => Math.round(p * 5);
const careCount = p => Math.round(p * CARE.length);

/* ---------- akce ---------- */
function toggleTask(t) {
  const k = TODAY(), h = day(k), before = progress();
  if (isDone(t)) {
    let back = 0;
    if (t.type === 'weekly') {
      weekDays().forEach(d => { if (S.hist[d] && S.hist[d].done[t.id]) { back += S.hist[d].done[t.id]; delete S.hist[d].done[t.id]; } });
    } else {
      back = h.done[t.id] || t.pts; delete h.done[t.id];
      if (t.type === 'once') delete t.doneAt;
    }
    S.stats.tasks = Math.max(0, S.stats.tasks - 1);
    if (t.cat === 'skola') S.stats.school = Math.max(0, S.stats.school - 1);
    if (t.type === 'weekly') S.stats.weekly = Math.max(0, S.stats.weekly - 1);
    S.coins = Math.max(0, S.coins - back); S.xp = Math.max(0, S.xp - back);
    if (h.bonus && !dayComplete(k)) { h.bonus = false; S.coins = Math.max(0, S.coins - 15); S.xp = Math.max(0, S.xp - 15); }
    recalcStreak(); save();
    const after = progress(); lastP = after.p; render();
    return;
  }
  h.done[t.id] = t.pts;
  if (t.type === 'once') t.doneAt = k;
  S.coins += t.pts; S.xp += t.pts;
  S.stats.tasks++;
  if (t.cat === 'skola') S.stats.school++;
  if (t.type === 'weekly') S.stats.weekly++;
  if (new Date().getHours() < 8) S.stats.early = true;

  const after = progress();
  let msg = `+${t.pts} ${HS}`;
  const cBefore = careCount(before.p), cAfter = careCount(after.p);
  if (cAfter > cBefore && CARE[cAfter - 1]) msg = `${CARE[cAfter - 1].ico} ${CARE[cAfter - 1].say} · +${t.pts} ${HS}`;

  let finished = false;
  if (!h.bonus && dayComplete(k)) {
    h.bonus = true; S.coins += 15; S.xp += 15; S.stats.races++; finished = true;
    msg = `🏆 Dojel do cíle! +15 ${HS} navíc`;
  }
  recalcStreak(); checkBadges(); save(); render();
  runTo(after.p, finished);
  confetti(finished ? 90 : 34); ding(finished); toast(msg); bump('statCoins');
}

function recalcStreak() {
  let k = TODAY(), n = 0;
  if (!dayComplete(k)) k = dk(addD(new Date(), -1));
  while (dayComplete(k) && n < 400) { n++; k = dk(addD(new Date(k + 'T00:00:00'), -1)); }
  S.streak.n = n; S.streak.best = Math.max(S.streak.best || 0, n); S.streak.last = TODAY();
}
function checkBadges() {
  BADGES.forEach(b => {
    if (!S.badges[b.id] && b.test(S)) { S.badges[b.id] = TODAY(); setTimeout(() => toast(`Nový odznak: ${b.ico} ${b.nm}`), 1100); }
  });
}
function buy(id, pr) {
  if (S.owned.indexOf(id) >= 0) return equip(id);
  if (S.coins < pr) { toast('Ještě si musíš vydělat víc podkov 💪'); return; }
  S.coins -= pr; S.owned.push(id); S.stats.buys++;
  equip(id, true); checkBadges(); save(); render(); confetti(40); ding();
  toast('Máš to! 🎉');
}
function equip(id, silent) {
  const p = id.split(':'), kind = p[0], val = p[1];
  if (kind === 'coat') S.horse.coat = val;
  else if (kind === 'mane') S.horse.mane = val;
  else if (kind === 'scene') S.eq.scene = val;
  else S.eq[kind] = (S.eq[kind] === val ? null : val);
  save(); if (!silent) render();
}
function claimGoal() {
  S.goal.claimed = true; S.coins += 50; S.stats.goals++;
  checkBadges(); save(); render(); confetti(90); ding(true);
  toast(`Cíl týdne splněn! +50 ${HS}`);
}

/* ---------- efekty ---------- */
let toastT;
function toast(msg) {
  const el = $('#toast'); el.innerHTML = msg; el.hidden = false;
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 2600);
}
function bump(id) { const el = $('#' + id); if (!el) return; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

let actx;
function ding(big) {
  if (!S.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = big ? [523, 659, 784, 1047, 1319] : [660, 880, 1170];
    notes.forEach((f, i) => {
      const t = i * .085, o = actx.createOscillator(), g = actx.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, actx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.14, actx.currentTime + t + .02);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + t + .24);
      o.connect(g); g.connect(actx.destination);
      o.start(actx.currentTime + t); o.stop(actx.currentTime + t + .26);
    });
  } catch (e) {}
}

const cvs = $('#confetti'), ctx = cvs.getContext('2d');
let parts = [], raf = 0;
function confetti(n) {
  const dpr = window.devicePixelRatio || 1;
  cvs.width = innerWidth * dpr; cvs.height = innerHeight * dpr;
  cvs.style.width = innerWidth + 'px'; cvs.style.height = innerHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const colors = ['#FF8FB6', '#FFC93C', '#6ED0A0', '#9B8BE8', '#7EC8F0', '#FF9A62'];
  for (let i = 0; i < (n || 40); i++) parts.push({
    x: innerWidth / 2 + (Math.random() - .5) * 180, y: innerHeight * .3,
    vx: (Math.random() - .5) * 9, vy: -Math.random() * 11 - 3,
    s: 5 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - .5) * .4,
    c: colors[(Math.random() * colors.length) | 0], life: 90 + Math.random() * 40
  });
  if (!raf) raf = requestAnimationFrame(step);
}
function step() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter(p => p.life-- > 0 && p.y < innerHeight + 40);
  parts.forEach(p => {
    p.vy += .38; p.x += p.vx; p.y += p.vy; p.vx *= .995; p.r += p.vr;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
    ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .62); ctx.restore();
  });
  raf = parts.length ? requestAnimationFrame(step) : 0;
  if (!raf) ctx.clearRect(0, 0, innerWidth, innerHeight);
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

/* ---------- dostihová dráha ---------- */
const runnerLeft = p => (1 + 47 * p).toFixed(1);

function runTo(p, finished) {
  const el = $('#runner');
  if (!el) { lastP = p; return; }
  el.classList.add('gallop');
  requestAnimationFrame(() => { el.style.left = runnerLeft(p) + '%'; });
  setTimeout(() => {
    el.classList.remove('gallop');
    lastP = p;
    if (finished) { el.classList.add('cheer'); setTimeout(() => el.classList.remove('cheer'), 1400); }
  }, 1250);
}

function sceneSVG() {
  const s = SCENES[S.eq.scene] || SCENES.louka;
  const u = 'sc' + Math.random().toString(36).slice(2, 7);

  const tree = (x, y, k) => `<g transform="translate(${x},${y}) scale(${k})">
      <ellipse cy="3" rx="17" ry="4" fill="#000" opacity=".16"/>
      <path d="M-3 4 C-4.5 -6 -3.5 -15 -2.5 -21 L3.5 -21 C4.5 -15 4.5 -6 3 4 Z" fill="${s.trunk}"/>
      <path d="M1 -45 C13 -45 23 -37 23 -27 C26 -19 19 -10 9 -9 C3 -5 -7 -6 -11 -11
               C-22 -12 -26 -21 -22 -29 C-21 -39 -11 -45 1 -45 Z" fill="${s.tree[0]}"/>
      <path d="M-11 -11 C-22 -12 -26 -21 -22 -29 C-17 -20 -13 -14 -6 -8 Z" fill="${s.tree[1]}"/>
      <path d="M-2 -9 C-8 -8 -12 -12 -12 -17 C-6 -14 -2 -12 2 -9 Z" fill="${s.tree[1]}" opacity=".75"/>
      <path d="M4 -41 C14 -40 20 -34 21 -28 C15 -34 9 -38 4 -41 Z" fill="#FFF" opacity=".16"/>
    </g>`;

  const cloud = (x, y, k, o) => `<g transform="translate(${x},${y}) scale(${k})" opacity="${o}">
      <ellipse rx="24" ry="9" fill="${s.cloud}"/><ellipse cx="-17" cy="4" rx="15" ry="7" fill="${s.cloud}"/>
      <ellipse cx="18" cy="3" rx="17" ry="8" fill="${s.cloud}"/>
      <ellipse cx="2" cy="-6" rx="14" ry="8" fill="${s.cloud}"/></g>`;

  const tuft = x => `<path d="M${x} 187 C${x - 1} 182 ${x - 3} 179 ${x - 4} 177
      C${x - 1} 179 ${x} 181 ${x + 1} 184 C${x + 1} 180 ${x + 2} 177 ${x + 4} 175
      C${x + 3} 179 ${x + 2} 183 ${x + 2} 187 Z" fill="${s.grass[1]}"/>`;

  let speck = '';
  for (let i = 0; i < 46; i++) {
    const x = (i * 53 % 397) + 2, y = 190 + (i * 29 % 28), r = .8 + (i % 3) * .5;
    speck += `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 2 ? '#000' : '#FFF'}" opacity=".08"/>`;
  }

  return `<svg class="scene" viewBox="0 0 400 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <linearGradient id="sky-${u}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${s.sky[0]}"/><stop offset="1" stop-color="${s.sky[1]}"/></linearGradient>
      <linearGradient id="gr-${u}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${s.grass[0]}"/><stop offset="1" stop-color="${s.grass[1]}"/></linearGradient>
      <linearGradient id="tr-${u}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${s.track[1]}"/><stop offset=".3" stop-color="${s.track[0]}"/>
        <stop offset="1" stop-color="${s.track[1]}"/></linearGradient>
      <linearGradient id="hz-${u}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${s.haze}" stop-opacity="0"/>
        <stop offset="1" stop-color="${s.haze}" stop-opacity=".85"/></linearGradient>
      <radialGradient id="sun-${u}"><stop offset="0" stop-color="${s.sun}" stop-opacity=".95"/>
        <stop offset=".45" stop-color="${s.sun}" stop-opacity=".35"/>
        <stop offset="1" stop-color="${s.sun}" stop-opacity="0"/></radialGradient>
      <filter id="sb-${u}" x="-30%" y="-60%" width="160%" height="260%">
        <feGaussianBlur stdDeviation="4"/></filter>
      <filter id="gn-${u}" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4"/>
        <feColorMatrix type="saturate" values="0"/></filter>
    </defs>

    <rect width="400" height="220" fill="url(#sky-${u})"/>
    ${s.night
      ? `${[[38,28],[92,52],[148,24],[212,46],[268,20],[304,70],[62,78],[186,68],[340,34],[124,86]]
           .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1.2 : 1.8}" fill="#FFF8D8"
             opacity="${i % 2 ? .9 : .55}"/>`).join('')}
         <circle cx="326" cy="42" r="36" fill="url(#sun-${u})"/>
         <circle cx="326" cy="42" r="17" fill="${s.sun}"/>
         <circle cx="317" cy="36" r="15" fill="${s.sky[0]}"/>`
      : `<circle cx="330" cy="40" r="52" fill="url(#sun-${u})"/>
         <circle cx="330" cy="40" r="20" fill="${s.sun}"/>`}
    <g filter="url(#sb-${u})">${cloud(72, 42, 1, .92)}${cloud(238, 30, .8, .8)}${cloud(168, 70, .6, .6)}</g>

    <path d="M0 124 C54 106 104 120 162 110 C226 99 288 114 400 102 L400 150 L0 150 Z" fill="${s.far}"/>
    <path d="M0 122 C22 120 34 112 48 112 C60 112 66 118 78 117 C92 116 100 108 114 109
             C128 110 134 117 148 115 C164 113 172 106 188 107 L188 128 L0 130 Z"
          fill="${s.tree[0]}" opacity=".45"/>
    <rect y="96" width="400" height="58" fill="url(#hz-${u})"/>

    <path d="M0 146 C78 132 150 148 240 139 C318 131 360 143 400 136 L400 176 L0 176 Z" fill="${s.mid}"/>
    ${tree(34, 168, 1)}${tree(300, 164, .82)}${tree(370, 170, 1.08)}${tree(228, 160, .58)}

    <g opacity=".95">
      <g fill="#000" opacity=".14">${[22,88,154,220,286,352].map(x =>
        `<ellipse cx="${x + 3}" cy="173" rx="7" ry="2.4"/>`).join('')}</g>
      <g stroke="${s.night ? '#7A6A56' : '#F3E7D2'}" stroke-linecap="round">
        <path d="M0 155 H400" stroke-width="3.6"/><path d="M0 166 H400" stroke-width="3.6"/>
        ${[22,88,154,220,286,352].map(x => `<path d="M${x} 148 v25" stroke-width="4.6"/>`).join('')}</g>
      <g stroke="#000" opacity=".12" stroke-linecap="round">
        <path d="M0 157 H400" stroke-width="1.4"/><path d="M0 168 H400" stroke-width="1.4"/></g>
    </g>

    <rect y="170" width="400" height="18" fill="url(#gr-${u})"/>
    <g opacity=".55">${[8,26,47,66,88,112,133,158,182,204,228,251,274,296,318,341,364,388].map(tuft).join('')}</g>

    <rect y="186" width="400" height="34" fill="url(#tr-${u})"/>
    <rect y="186" width="400" height="34" filter="url(#gn-${u})" opacity=".16" style="mix-blend-mode:overlay"/>
    <path d="M0 186 H400" stroke="#000" stroke-width="4" opacity=".13"/>
    <g opacity=".28" stroke="${s.track[1]}" stroke-width="2.5" stroke-linecap="round">
      ${[10,52,94,136,178,220,262,304,346,388].map(x => `<path d="M${x} 204 h18"/>`).join('')}</g>
    <path d="M0 197 C90 199 180 196 400 198" stroke="${s.track[1]}" stroke-width="2"
          opacity=".22" fill="none"/>
    ${speck}
  </svg>`;
}

function trackHTML(pr) {
  const st = stageOf(pr.p), win = pr.total && pr.done === pr.total;
  return `<div class="track">
    ${sceneSVG()}
    <div class="finish ${win ? 'won' : ''}">
      <div class="flag"></div><span class="finish-lbl">CÍL</span>
    </div>
    <div class="runner" id="runner" style="left:${runnerLeft(lastP)}%">
      ${Horse.svg({ coat: S.horse.coat, mane: S.horse.mane, head: S.eq.head, body: S.eq.body, stage: st })}
    </div>
  </div>`;
}

function careHTML(pr) {
  const c = careCount(pr.p);
  return `<div class="care">${CARE.map((x, i) => `<div class="care-step ${i < c ? 'on' : ''}">
      <span class="care-ico">${x.ico}</span><span class="care-nm">${x.nm}</span></div>`).join('')}</div>`;
}

function heroHTML() {
  const pr = progress(), win = pr.total && pr.done === pr.total;
  const st = stageOf(pr.p);
  const say = win ? `${S.horse.name} dojela do cíle. Dnešek máš za jedna!`
    : st === 0 ? `${S.horse.name} čeká ve stáji. Prvním úkolem se o ni postaráš.`
    : st <= 2 ? `Jde to! ${S.horse.name} je na dráze a čeká na další úkol.`
    : `Ještě kousek a ${S.horse.name} je v cíli!`;
  return `<div class="hero">
    ${trackHTML(pr)}
    <div class="hero-foot">
      <div class="race-row">
        <div class="race-lbl"><b>🏁 Dnešní dostih</b><span>${pr.done} z ${pr.total}</span></div>
        <div class="race-bar"><i style="width:${(pr.p * 100).toFixed(1)}%"></i></div>
      </div>
      ${careHTML(pr)}
      <div class="hero-say">${say}</div>
    </div>
  </div>`;
}

/* ---------- render ---------- */
function render() {
  $('#levelName').textContent = levelName();
  $('#levelNum').textContent = level() + 1;
  $('#xpFill').style.width = (levelProgress() * 100).toFixed(1) + '%';
  $('#statCoins').querySelector('b').textContent = S.coins;
  $('#statStreak').querySelector('b').textContent = S.streak.n;
  $('#miniHorse').innerHTML = Horse.svg({ coat: S.horse.coat, mane: S.horse.mane, head: S.eq.head, crop: 'head', stage: 5 });
  $('#screen').innerHTML = ({ dnes: viewDnes, tyden: viewTyden, staj: viewStaj, ukoly: viewUkoly })[tab]();
  document.querySelectorAll('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
}

function taskHTML(t, showWhen) {
  const done = isDone(t);
  const when = t.type === 'weekly' ? 'Tento týden'
    : t.type === 'once' ? (t.due ? 'Do ' + (+t.due.slice(8)) + '. ' + (+t.due.slice(5, 7)) + '.' : 'Jednorázově') : '';
  return `<div class="task ${done ? 'done' : ''}" data-task="${t.id}">
    <div class="emo ${catCls(t.cat)}">${t.emo}</div>
    <div class="tx"><div class="tt">${t.title}</div>
      <div class="ts"><span class="pts">+${t.pts} ${HS}</span>${showWhen && when ? `<span>${when}</span>` : ''}</div></div>
    <div class="chk">${done ? '✓' : ''}</div></div>`;
}

function goalHTML() {
  const e = weekEarned(), t = S.goal.target || 200, p = clamp(e / t, 0, 1);
  const ready = e >= t && !S.goal.claimed;
  return `<div class="goal">
    <div class="goal-top"><h3>🎁 Cíl týdne</h3><span class="goal-num">${e} / ${t} ${HS}</span></div>
    <div class="race-bar gold"><i style="width:${p * 100}%"></i></div>
    ${S.goal.reward ? `<div class="rew">Odměna: <b>${S.goal.reward}</b></div>`
      : `<div class="rew">Odměnu vyplní rodiče v nastavení</div>`}
    ${ready ? `<button class="btn gold" style="margin-top:12px" data-act="claim">Vyzvednout odměnu 🎉</button>` : ''}
    ${S.goal.claimed ? `<div class="rew">✅ Splněno — hurá!</div>` : ''}</div>`;
}

function schoolHTML() {
  const d = iso(new Date()), weekend = d > 5;
  const show = weekend ? 1 : d;
  const lessons = SCHEDULE[show];
  return `<div class="card">
    <div class="card-top"><h3>🎒 ${weekend ? 'V pondělí ve škole' : 'Dnes ve škole'}</h3>
      <button class="lnk" data-act="rozvrh">Celý rozvrh</button></div>
    <ol class="lessons">${lessons.map((nm, i) =>
      `<li><span class="ln">${i + 1}.</span><span class="li-ico">${lessonIco(nm)}</span>${nm}</li>`).join('')}</ol>
    <button class="btn lav" style="margin-top:14px" data-act="hw">➕ Přidat domácí úkol</button></div>`;
}

function viewDnes() {
  const list = todaysDaily(), done = list.filter(isDone).length;
  const wk = weeklyOpen().filter(t => !doneThisWeek(t));
  const soon = S.tasks.filter(t => !t.arch && t.type === 'once' && !t.doneAt && t.due && t.due > TODAY())
                      .sort((a, b) => a.due < b.due ? -1 : 1);
  const left = list.length - done;
  return heroHTML() + goalHTML() + schoolHTML() +
    `<div class="section-title">${left === 0 && list.length ? 'Dnešek je hotový 🎉' : 'Dnešní plán'}</div>` +
    (list.length ? list.map(t => taskHTML(t, true)).join('')
      : `<div class="empty"><span class="big">🌈</span>Dneska máš volno! Můžeš si přidat vlastní úkol.</div>`) +
    (wk.length ? `<div class="section-title">Tento týden</div>` + wk.map(t => taskHTML(t)).join('') : '') +
    (soon.length ? `<div class="section-title">Chystá se</div>` + soon.map(t => taskHTML(t, true)).join('') : '') +
    `<button class="btn sec" style="margin-top:6px" data-act="new">➕ Přidat úkol</button>`;
}

function viewTyden() {
  const days = weekDays(), td = TODAY();
  const strip = days.map((k, i) => {
    const full = dayComplete(k), some = S.hist[k] && Object.keys(S.hist[k].done).length;
    return `<div class="day ${k === td ? 'today' : ''} ${full ? 'full' : ''}">
      <b>${DOW[i]}</b><span class="mark">${full ? '🏆' : some ? '🐴' : k > td ? '·' : '—'}</span></div>`;
  }).join('');
  const wk = weeklyOpen();
  return `<div class="card streak-card">
      <div class="streak-ico">🔥</div>
      <div><h2>${S.streak.n} ${plur(S.streak.n, 'den', 'dny', 'dní')} v řadě</h2>
      <p>Nejlepší série ${S.streak.best} · dostihů ${S.stats.races} · tento týden ${weekEarned()} ${HS}</p></div></div>
    <div class="section-title">Tento týden</div>
    <div class="week-strip">${strip}</div>
    <div class="section-title">Týdenní úkoly</div>
    ${wk.length ? wk.map(t => taskHTML(t)).join('') : `<div class="empty">Žádné týdenní úkoly</div>`}
    <div class="section-title">Odznaky (${Object.keys(S.badges).length}/${BADGES.length})</div>
    <div class="badge-grid">${BADGES.map(b => `<div class="badge ${S.badges[b.id] ? '' : 'locked'}">
      <span class="b-ico">${b.ico}</span><span class="b-nm">${b.nm}</span></div>`).join('')}</div>`;
}

function item(id, ico, sw, nm, pr, owned, on) {
  const cant = !owned && S.coins < pr;
  return `<button class="item ${on ? 'equipped' : ''} ${cant ? 'cant' : ''}" data-buy="${id}" data-pr="${pr}">
    ${ico ? `<span class="i-ico">${ico}</span>` : `<span class="i-sw" style="background:${sw}"></span>`}
    <span class="i-nm">${nm}</span>
    <span class="i-pr ${owned ? 'owned' : ''}">${owned ? (on ? '✓ nasazeno' : 'nasadit') : (pr ? pr + ' ' + HS : 'zdarma')}</span>
  </button>`;
}
function shopItems() {
  if (shopTab === 'srst') return Object.keys(Horse.COATS).map(k => {
    const id = 'coat:' + k;
    return item(id, null, Horse.COATS[k].c, Horse.COATS[k].name, COAT_PR[k], S.owned.indexOf(id) >= 0, S.horse.coat === k);
  });
  if (shopTab === 'hriva') return Object.keys(Horse.MANES).map(k => {
    const id = 'mane:' + k, m = Horse.MANES[k];
    return item(id, m.rainbow ? '🌈' : null, m.rainbow ? null : m.c, m.name, MANE_PR[k], S.owned.indexOf(id) >= 0, S.horse.mane === k);
  });
  if (shopTab === 'staj') return Object.keys(SCENES).map(k => {
    const id = 'scene:' + k;
    return item(id, SCENES[k].ico, null, SCENES[k].nm, SCENES[k].pr, S.owned.indexOf(id) >= 0, S.eq.scene === k);
  });
  return GEAR.map(g => item(g.id, g.ico, null, g.nm, g.pr, S.owned.indexOf(g.id) >= 0, S.eq[g.slot] === g.v));
}

function viewStaj() {
  const tabs = [['doplnky', '🎀 Doplňky'], ['srst', '🎨 Srst'], ['hriva', '💇 Hříva'], ['staj', '🏡 Stáj']];
  return `<div class="portrait">
      <div class="portrait-bg">${Horse.svg({ coat: S.horse.coat, mane: S.horse.mane,
        head: S.eq.head, body: S.eq.body, stage: 5 })}</div>
      <div class="portrait-foot">
        <h2>${S.horse.name}</h2>
        <p>Úroveň ${level() + 1} · ${levelName()} · ${S.stats.races} ${plur(S.stats.races, 'dostih', 'dostihy', 'dostihů')}</p>
        <button class="btn sec" style="margin-top:12px" data-act="rename">✏️ Přejmenovat</button>
      </div></div>
    <div class="section-title">Obchod ve stáji</div>
    <div class="shop-tabs">${tabs.map(([k, n]) =>
      `<button data-shop="${k}" class="${shopTab === k ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div class="shop-grid">${shopItems().join('')}</div>`;
}

function viewUkoly() {
  const grp = (nm, arr) => arr.length ? `<div class="section-title">${nm}</div>` + arr.map(t => `
    <div class="task" data-edit="${t.id}">
      <div class="emo ${catCls(t.cat)}">${t.emo}</div>
      <div class="tx"><div class="tt">${t.title}</div>
        <div class="ts"><span class="pts">+${t.pts} ${HS}</span>
        <span>${t.type === 'daily' ? (t.days || []).map(d => DOW[d - 1]).join(' ')
          : t.type === 'weekly' ? '1× týdně' : (t.due || 'jednorázově')}</span></div></div>
      <div class="chev">›</div></div>`).join('') : '';
  const a = S.tasks.filter(t => !t.arch);
  return `<button class="btn" data-act="new">➕ Nový úkol</button>
    ${grp('Každý den', a.filter(t => t.type === 'daily'))}
    ${grp('Každý týden', a.filter(t => t.type === 'weekly'))}
    ${grp('Jednorázové', a.filter(t => t.type === 'once'))}
    <div class="section-title">Další</div>
    <button class="btn sec" data-act="rozvrh">🗓️ Rozvrh hodin</button>
    <div style="height:10px"></div>
    <button class="btn sec" data-act="parents">⚙️ Pro rodiče a nastavení</button>`;
}

/* ---------- editor úkolu ---------- */
function editSheet(t) {
  const nw = !t;
  t = t || { id: uid(), title: '', emo: '✏️', cat: 'domov', pts: 10, type: 'daily', days: [1,2,3,4,5], created: TODAY() };
  const d = JSON.parse(JSON.stringify(t));
  openSheet(nw ? 'Nový úkol' : 'Upravit úkol', `
    <label class="f">Co mám udělat?</label>
    <input type="text" id="fT" value="${d.title.replace(/"/g, '&quot;')}" placeholder="Např. Uklidit si stůl" autocomplete="off">
    <label class="f">Obrázek</label>
    <div class="emo-grid" id="fE">${EMOJIS.map(e => `<button class="emo-pick ${e === d.emo ? 'on' : ''}" data-e="${e}">${e}</button>`).join('')}</div>
    <label class="f">Kam patří</label>
    <div class="chips" id="fC">${CATS.map(c => `<button class="chip ${c.id === d.cat ? 'on' : ''}" data-c="${c.id}">${c.nm}</button>`).join('')}</div>
    <label class="f">Kolik podkov</label>
    <div class="chips" id="fP">${[5,10,15,20,30,40,60].map(p => `<button class="chip ${p === d.pts ? 'on' : ''}" data-p="${p}">${p} ${HS}</button>`).join('')}</div>
    <label class="f">Jak často</label>
    <div class="chips" id="fY">${[['daily','Každý den'],['weekly','1× týdně'],['once','Jen jednou']].map(([k, n]) =>
      `<button class="chip ${k === d.type ? 'on' : ''}" data-y="${k}">${n}</button>`).join('')}</div>
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
    pick('#fP', 'p', v => { d.pts = +v; box.querySelectorAll('#fP .chip').forEach(x => x.classList.toggle('on', +x.dataset.p === d.pts)); });
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
      lastP = progress().p; save(); closeSheet(); render(); toast(nw ? 'Úkol přidán 🎉' : 'Uloženo ✓');
    });
    const del = box.querySelector('#fDel');
    if (del) del.addEventListener('click', () => {
      if (!confirm('Opravdu smazat tento úkol?')) return;
      S.tasks = S.tasks.filter(x => x.id !== d.id);
      lastP = progress().p; save(); closeSheet(); render(); toast('Smazáno');
    });
  });
}

/* ---------- rozvrh (jen ke čtení) a domácí úkol ---------- */
function rozvrhSheet() {
  const d = iso(new Date());
  openSheet('Rozvrh hodin', `<div class="sched">${[1,2,3,4,5].map(i => `
    <div class="sched-day ${i === d ? 'on' : ''}">
      <div class="sched-nm">${DOW[i - 1]}</div>
      <ol class="lessons small">${SCHEDULE[i].map((nm, j) =>
        `<li><span class="ln">${j + 1}.</span><span class="li-ico">${lessonIco(nm)}</span>${nm}</li>`).join('')}</ol>
    </div>`).join('')}</div>
    <p class="note">Rozvrh je pevný na celý rok.</p>`);
}

function homeworkSheet() {
  const d = iso(new Date());
  const todayL = (SCHEDULE[d] || []).join(' ');
  const tomL = (SCHEDULE[d >= 5 ? 1 : d + 1] || []).join(' ');
  const near = HW_SUBJECTS.filter(x => todayL.indexOf(x.nm) >= 0 || tomL.indexOf(x.nm) >= 0);
  const rest = HW_SUBJECTS.filter(x => near.indexOf(x) < 0);
  let when = 'zitra';
  const grid = arr => `<div class="shop-grid">${arr.map(x =>
    `<button class="item" data-hw="${x.nm}"><span class="i-ico">${x.ico}</span>
      <span class="i-nm">${x.nm}</span></button>`).join('')}</div>`;
  openSheet('Domácí úkol', `
    <label class="f">Kdy to musí být hotové</label>
    <div class="chips" id="hwWhen">
      <button class="chip" data-w="dnes">Dnes</button>
      <button class="chip on" data-w="zitra">Zítra</button></div>
    ${near.length ? `<label class="f">Z dnešního a zítřejšího rozvrhu</label>${grid(near)}` : ''}
    ${rest.length ? `<label class="f">Ostatní</label>${grid(rest)}` : ''}
    <div style="height:14px"></div>`, box => {
    box.querySelector('#hwWhen').addEventListener('click', e => {
      const b = e.target.closest('[data-w]'); if (!b) return;
      when = b.dataset.w;
      box.querySelectorAll('#hwWhen .chip').forEach(x => x.classList.toggle('on', x === b));
    });
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-hw]'); if (!b) return;
      const nm = b.dataset.hw, x = HW_SUBJECTS.find(y => y.nm === nm);
      S.tasks.push({ id: uid(), title: 'Úkol – ' + nm, emo: x.ico, cat: 'skola', pts: 15, type: 'once',
        due: when === 'dnes' ? TODAY() : dk(addD(new Date(), 1)), created: TODAY() });
      lastP = progress().p; save(); closeSheet(); render(); toast(`Úkol z ${nm} přidán 📚`);
    });
  });
}

/* ---------- rodiče ---------- */
function parentsSheet() {
  openSheet('Pro rodiče', `
    <p class="note">Tady nastavíte týdenní cíl a odměnu, na kterých se doma domluvíte.</p>
    <label class="f">Týdenní cíl (podkovy)</label>
    <input type="number" id="pG" value="${S.goal.target}" inputmode="numeric">
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
    box.querySelector('#pS').addEventListener('click', e => {
      const b = e.target.closest('[data-s]'); if (!b) return;
      S.sound = b.dataset.s === '1';
      box.querySelectorAll('#pS .chip').forEach(x => x.classList.toggle('on', x === b));
    });
    box.querySelector('#pSave').addEventListener('click', () => {
      S.goal.target = Math.max(10, +box.querySelector('#pG').value || 200);
      S.goal.reward = box.querySelector('#pR').value.trim();
      S.horse.name = box.querySelector('#pH').value.trim() || 'Hvězdička';
      save(); closeSheet(); render(); toast('Uloženo ✓');
    });
    box.querySelector('#pRestore').addEventListener('click', () => {
      try {
        const o = JSON.parse(box.querySelector('#pB').value);
        if (!o || !o.tasks) throw 0;
        S = o; load(); save(); closeSheet(); lastP = progress().p; render(); toast('Obnoveno ✓');
      } catch (e) { toast('Záloha nejde přečíst'); }
    });
    box.querySelector('#pReset').addEventListener('click', () => {
      if (!confirm('Opravdu vymazat všechna data a začít znovu?')) return;
      S = fresh(); save(); closeSheet(); lastP = 0; render();
    });
  });
}

function renameSheet() {
  openSheet('Jméno koně', `<label class="f">Jak se jmenuje?</label>
    <input type="text" id="rN" value="${S.horse.name.replace(/"/g, '&quot;')}" maxlength="18">
    <div style="height:16px"></div><button class="btn" id="rS">Uložit</button>`,
    box => box.querySelector('#rS').addEventListener('click', () => {
      S.horse.name = box.querySelector('#rN').value.trim() || 'Hvězdička';
      save(); closeSheet(); render(); toast('Hotovo ✓');
    }));
}

/* ---------- události ---------- */
document.addEventListener('click', e => {
  const tb = e.target.closest('#tabbar button');
  if (tb) { tab = tb.dataset.tab; render(); window.scrollTo(0, 0); return; }
  const st = e.target.closest('[data-shop]');
  if (st) { shopTab = st.dataset.shop; render(); return; }
  const bi = e.target.closest('[data-buy]');
  if (bi) { buy(bi.dataset.buy, +bi.dataset.pr); return; }
  const tk = e.target.closest('[data-task]');
  if (tk) { const t = S.tasks.find(x => x.id === tk.dataset.task); if (t) toggleTask(t); return; }
  const ed = e.target.closest('[data-edit]');
  if (ed) { editSheet(S.tasks.find(x => x.id === ed.dataset.edit)); return; }
  const ac = e.target.closest('[data-act]');
  if (ac) {
    const a = ac.dataset.act;
    if (a === 'new') editSheet(null);
    else if (a === 'parents') parentsSheet();
    else if (a === 'rename') renameSheet();
    else if (a === 'claim') claimGoal();
    else if (a === 'rozvrh') rozvrhSheet();
    else if (a === 'hw') homeworkSheet();
    return;
  }
  if (e.target.closest('#btnProfile')) { tab = 'staj'; render(); }
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { load(); lastP = progress().p; render(); }
});

/* ---------- start ---------- */
load(); recalcStreak(); lastP = progress().p; render(); save();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
