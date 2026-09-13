/* ==========================================================================
   Souhvězdí — plánovač úkolů. Každý splněný úkol rozsvítí hvězdu.
   Dnešní souhvězdí (denní úkoly) a týdenní souhvězdí (úkoly na celý týden).
   Bonusy jsou komety: přičtou se k úlovku, ale nezvedají, co má splnit.
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
const D_ = k => new Date(k + 'T00:00:00');
const monday = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return addD(x, -(iso(x) - 1)); };
const weekKey = d => dk(monday(d));
const uid = () => Math.random().toString(36).slice(2, 9);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const DOW = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
const DOWL = ['pondělí', 'úterý', 'středu', 'čtvrtek', 'pátek', 'sobotu', 'neděli'];
const MONTHS = ['Leden','Únor','Březen','Duben','Květen','Červen',
                'Červenec','Srpen','Září','Říjen','Listopad','Prosinec'];
const plur = (n, a, b, c) => (n === 1 ? a : n >= 2 && n <= 4 ? b : c);

/* ---------- pevný rozvrh 3. třídy ---------- */
const SCHEDULE = {
  1: ['Matematika', 'Tělocvik', 'Tělocvik', 'Čeština', 'Čeština / English'],
  2: ['English / Matematika', 'Matematika / English', 'Prvouka', 'Čeština', 'Čtení'],
  3: ['Čeština', 'Matematika (geometrie)', 'Čtení', 'Workshop (D)', 'Workshop (D)'],
  4: ['Čeština', 'Matematika', 'Čtení / English', 'Prvouka', 'Workshop (M)'],
  5: ['English', 'English', 'Čeština', 'Prvouka', 'Výtvarka']
};
const SUBJ_ICO = [['geometri','📐'],['Matematika','🔢'],['Čeština','📕'],['English','🇬🇧'],
                  ['Prvouka','🌍'],['Čtení','📖'],['Tělocvik','🤸'],['Výtvarka','🎨'],['Workshop','🛠️']];
const lessonIco = nm => (SUBJ_ICO.find(([k]) => nm.indexOf(k) >= 0) || [, '📘'])[1];
const HW = [
  { nm:'Čeština', ico:'📕' }, { nm:'Matematika', ico:'🔢' }, { nm:'English', ico:'🇬🇧' },
  { nm:'Čtení', ico:'📖' }, { nm:'Prvouka', ico:'🌍' }, { nm:'Geometrie', ico:'📐' },
  { nm:'Výtvarka', ico:'🎨' }, { nm:'Workshop', ico:'🛠️' }
];

const EMOJIS = ['🎒','📚','✏️','📒','🔢','🇬🇧','🧹','🧺','👕','🛏️','🍽️','🗑️','🪥','🚿','🌙','⏰',
                '🐴','🎹','⚽','🎨','💖','📖','🐕','💧','🌱','🧸','🎵','🏃'];
const CATS = [
  { id:'skola', nm:'Škola',   cls:'c-skola' }, { id:'domov', nm:'Domov',  cls:'c-domov' },
  { id:'ja',    nm:'Já sama', cls:'c-ja' },    { id:'volno', nm:'Zábava', cls:'c-volno' }
];
const catNm = c => (CATS.find(x => x.id === c) || CATS[1]).nm;
const catCls = c => (CATS.find(x => x.id === c) || CATS[1]).cls;

/* ---------- stav ---------- */
const KEY = 'tiffany.stable.v1';
let S = null, tab = 'obloha', flash = null, period = 'week', pOff = 0;
const lastShape = {};

function fresh() {
  return {
    v: 4, kid: 'Tiffany',
    tasks: [], hist: {}, wsky: {}, gone: {},
    goal: { days: 5, reward: '', week: weekKey(new Date()), claimed: false },
    stats: {}, sound: true
  };
}

function load() {
  try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
  if (!S) { S = fresh(); return; }
  if (S.v !== 4) {
    const o = S; S = fresh();
    S.sound = o.sound !== false;
    S.goal.reward = (o.goal && o.goal.reward) || '';
    S.goal.days = (o.goal && o.goal.days) || 5;
    if (Array.isArray(o.tasks)) S.tasks = o.tasks.filter(t => t && t.title);
    if (o.hist) S.hist = o.hist;
    if (o.gone) S.gone = o.gone;
  }
  if (!S.wsky) S.wsky = {};
  if (!S.gone) S.gone = {};
  rollGoal();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function rollGoal() {
  const wk = weekKey(new Date());
  if (S.goal.week !== wk) { S.goal.week = wk; S.goal.claimed = false; }
}

/* ---------- úkoly ---------- */
function reqIds(k) {
  const w = iso(D_(k));
  return S.tasks.filter(t => !t.arch && t.type === 'daily' && (t.days || []).includes(w)
    && (!t.created || t.created <= k)).map(t => t.id);
}
const day = k => {
  const h = S.hist[k] || (S.hist[k] = { done: {} });
  if (k === TODAY() || !h.req) h.req = reqIds(k);
  return h;
};
const expectedFor = k => { const h = S.hist[k]; return (h && h.req) ? h.req : reqIds(k); };

/* týdenní úkol si nese vlastní den obnovy: 1 = pondělí … 7 = neděle */
const wstart = t => t.wstart || 1;
function cycleStart(t, ref) {
  const d = D_(ref || TODAY());
  return dk(addD(d, -((iso(d) - wstart(t) + 7) % 7)));
}
const cycleDays = (t, ref) => {
  const s = D_(cycleStart(t, ref));
  return [0,1,2,3,4,5,6].map(i => dk(addD(s, i)));
};
const weeklyDone = (t, ref) => cycleDays(t, ref).some(k => S.hist[k] && S.hist[k].done[t.id]);

const live = () => S.tasks.filter(t => !t.arch);
const dailyToday = () => {
  const w = iso(new Date()), td = TODAY();
  return live().filter(t =>
    (t.type === 'daily' && (t.days || []).includes(w)) ||
    (t.type === 'once' && !t.doneAt && (!t.due || t.due <= td)) ||
    (t.type === 'once' && t.doneAt === td));
};
const weeklyAll = () => live().filter(t => t.type === 'weekly');
const bonusAll = () => live().filter(t => t.type === 'bonus');

function isDone(t) {
  if (t.type === 'weekly') return weeklyDone(t);
  return !!day(TODAY()).done[t.id];
}
const bonusCount = (id, k) => ((S.hist[k || TODAY()] || {}).bonus || {})[id] || 0;
const cometsToday = () => Object.values((S.hist[TODAY()] || {}).bonus || {}).reduce((a, b) => a + b, 0);

function totals() {
  const d = dailyToday(), w = weeklyAll();
  return {
    dTotal: d.length, dDone: d.filter(isDone).length,
    wTotal: w.length, wDone: w.filter(t => weeklyDone(t)).length,
    comets: cometsToday()
  };
}

/* Obrazec se přes den volně přeskládává podle počtu úkolů — domácí úkoly
   přistávají odpoledne a zamknout tvar na první splněný úkol by bylo brzy
   (zuby si vyčistí ráno). Ustálí se až ve zvolenou hodinu; co přibude potom,
   je hvězda navíc. */
const lockHour = () => (S.lockAt == null ? 18 : S.lockAt);
const afterLock = () => new Date().getHours() >= lockHour();

function dayBase(n) {
  const h = S.hist[TODAY()];
  if (h && h.cst) return h.cst;
  if (n > 0 && afterLock()) { day(TODAY()).cst = n; save(); return n; }
  return n;
}
function weekBase(n) {
  const k = weekKey(new Date()), td = TODAY();
  if (S.wsky[k]) return S.wsky[k];
  /* týdenní obrazec se ustálí v neděli večer */
  if (n > 0 && iso(new Date()) === 7 && afterLock()) { S.wsky[k] = n; save(); return n; }
  return n;
}

/* ---------- akce ---------- */
function toggle(t) {
  const k = TODAY(), h = day(k);
  if (t.type === 'bonus') return;
  const was = isDone(t);
  if (was) {
    if (t.type === 'weekly') cycleDays(t).forEach(d => { if (S.hist[d]) delete S.hist[d].done[t.id]; });
    else { delete h.done[t.id]; if (t.type === 'once') delete t.doneAt; }
    save(); render();
    return;
  }
  h.done[t.id] = true;
  if (t.type === 'once') t.doneAt = k;
  const tt = totals();
  flash = { sky: t.type === 'weekly' ? 'w' : 'd',
            i: (t.type === 'weekly' ? tt.wDone : tt.dDone) - 1 };
  const full = t.type === 'weekly' ? tt.wDone === tt.wTotal : tt.dDone === tt.dTotal;
  save(); render(); ding(full);
  toast(full ? `✦ Souhvězdí je celé!` : `Hvězda se rozsvítila`);
}

function addComet(t) {
  const h = day(TODAY());
  h.bonus = h.bonus || {};
  h.bonus[t.id] = (h.bonus[t.id] || 0) + 1;
  flash = { sky: 'c' };
  save(); render(); ding(false);
  toast(`☄︎ Kometa za „${t.title}"`);
}
function dropComet(t) {
  const h = S.hist[TODAY()];
  if (!h || !h.bonus || !h.bonus[t.id]) return;
  if (--h.bonus[t.id] <= 0) delete h.bonus[t.id];
  save(); render();
}
function claimGoal() { S.goal.claimed = true; save(); render(); ding(true); toast('Cíl týdne splněn! 🎉'); }

/* ---------- efekty ---------- */
let toastT;
function toast(msg) {
  const el = $('#toast'); el.innerHTML = msg; el.hidden = false;
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 2200);
}
let actx;
function ding(big) {
  if (!S.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    (big ? [659, 784, 988, 1319] : [880, 1175]).forEach((f, i) => {
      const t = i * .09, o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, actx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.12, actx.currentTime + t + .02);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + t + .5);
      o.connect(g); g.connect(actx.destination);
      o.start(actx.currentTime + t); o.stop(actx.currentTime + t + .52);
    });
  } catch (e) {}
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

/* ---------- obrazovka Obloha ---------- */
function starRow(t, kind) {
  if (kind === 'bonus') {
    const n = bonusCount(t.id);
    return `<div class="row bonus">
      <span class="mark">☄︎</span>
      <span class="em ${catCls(t.cat)}">${t.emo}</span>
      <span class="nm">${t.title}</span>
      ${n ? `<button class="cnt" data-uncomet="${t.id}">${n}×</button>` : ''}
      <button class="plus" data-comet="${t.id}" aria-label="Přidat kometu">+</button></div>`;
  }
  const on = isDone(t);
  const tag = t.type === 'weekly' ? 'obnova v ' + DOW[wstart(t) - 1]
    : t.type === 'once' && t.due ? dueLabel(t.due) : catNm(t.cat);
  return `<div class="row ${on ? 'on' : ''}" data-task="${t.id}">
    <span class="mark">${on ? '★' : '☆'}</span>
    <span class="em ${catCls(t.cat)}">${t.emo}</span>
    <span class="nm">${t.title}</span>
    <span class="tag">${tag}</span></div>`;
}

function dueLabel(due) {
  const d = Math.round((D_(due) - D_(TODAY())) / 86400000);
  if (d < 0) return d === -1 ? 'včera' : `před ${-d} dny`;
  if (d === 0) return 'dnes';
  if (d === 1) return 'zítra';
  if (d <= 6) return `za ${d} ${d <= 4 ? 'dny' : 'dní'}`;
  if (d === 7) return 'za týden';
  return 'do ' + (+due.slice(8)) + '. ' + (+due.slice(5, 7)) + '.';
}

function skyPane(kind, title, items, tt) {
  const n = kind === 'd' ? tt.dTotal : tt.wTotal;
  const done = kind === 'd' ? tt.dDone : tt.wDone;
  const base = kind === 'd' ? dayBase(n) : weekBase(n);
  const full = n > 0 && done === n;
  const fl = flash && flash.sky === kind ? flash.i : -1;
  const com = kind === 'd' ? tt.comets : 0;
  return `<section class="pane">
    <div class="phead"><h3>${title}</h3><span>${done} z ${n}</span></div>
    <div class="sky ${full ? 'full' : ''}" data-sky="${kind}" data-shape="${base}">
      ${Sky.svg({ n, done, base, h: kind === 'd' ? 196 : 168, flash: fl, comets: com, uid: kind })}
      <span class="cname">${n ? Sky.label(base, n) : ''}</span>
      ${full ? `<span class="cdone">✦ Celé</span>` : ''}
    </div>
    ${kind === 'd' && n > 0 && !afterLock()
      ? `<p class="settle">Obloha se ještě může přeskládat — do ${lockHour()}:00 přidávej,
         co ti dnes přibylo. Potom se obrazec ustálí.</p>` : ''}
    <div class="list">${items.map(t => starRow(t, t.type === 'bonus' ? 'bonus' : kind)).join('')}</div>
  </section>`;
}

function goalCard() {
  const w = weekDays().filter(dayComplete).length, t = S.goal.days || 5, p = clamp(w / t, 0, 1);
  const ready = w >= t && !S.goal.claimed;
  return `<div class="goal">
    <div class="goal-top"><h3>🎁 Cíl týdne</h3><span>${w} z ${t} ${plur(t,'dne','dnů','dnů')}</span></div>
    <div class="bar gold"><i style="width:${p * 100}%"></i></div>
    ${S.goal.reward ? `<p class="rew">Odměna: <b>${S.goal.reward}</b></p>`
      : `<p class="rew">Odměnu vyplní rodiče v nastavení</p>`}
    ${ready ? `<button class="btn gold" data-act="claim">Vyzvednout odměnu 🎉</button>` : ''}
    ${S.goal.claimed ? `<p class="rew">✅ Splněno — hurá!</p>` : ''}</div>`;
}

function schoolCard() {
  const d = iso(new Date()), weekend = d > 5, show = weekend ? 1 : d;
  return `<div class="card">
    <div class="card-top"><h3>🎒 ${weekend ? 'V pondělí ve škole' : 'Dnes ve škole'}</h3>
      <button class="lnk" data-act="rozvrh">Celý rozvrh</button></div>
    <ol class="lessons">${SCHEDULE[show].map((nm, i) =>
      `<li><span class="ln">${i + 1}.</span><span class="li-ico">${lessonIco(nm)}</span>${nm}</li>`).join('')}</ol>
    <button class="btn lav" data-act="hw">➕ Přidat domácí úkol</button></div>`;
}

function viewObloha() {
  const tt = totals();
  if (!live().length) return `<div class="card welcome">
      <h3>✨ Vítej!</h3>
      <p>Každý úkol, který splníš, rozsvítí na obloze jednu hvězdu. Když se rozsvítí všechny,
        souhvězdí je celé.</p>
      <p>Zatím tu žádné úkoly nejsou. Domluv se s rodiči, co budeš plnit, a přidej si je sem.</p>
      <button class="btn" data-act="new">➕ Přidat první úkol</button></div>` + schoolCard();

  const soon = live().filter(t => t.type === 'once' && !t.doneAt && t.due && t.due > TODAY())
                     .sort((a, b) => a.due < b.due ? -1 : 1);
  const bon = bonusAll();
  return skyPane('d', 'Dnešní souhvězdí', dailyToday().concat(bon), tt) +
    (tt.wTotal ? skyPane('w', 'Týdenní souhvězdí', weeklyAll(), tt) : '') +
    goalCard() + schoolCard() +
    (soon.length ? `<div class="card"><div class="card-top"><h3>🕒 Chystá se</h3></div>
       <div class="list">${soon.map(t => starRow(t)).join('')}</div></div>` : '') +
    `<button class="btn sec" data-act="new">➕ Přidat úkol</button>`;
}

/* ---------- obrazovka Přehled ---------- */
function weekDays(d) { const m = monday(d || new Date()); return [0,1,2,3,4,5,6].map(i => dk(addD(m, i))); }
function dayComplete(k) {
  const req = expectedFor(k);
  if (!req.length) return false;
  const h = S.hist[k];
  return !!h && req.every(id => h.done[id]);
}
function firstDay() {
  const ks = Object.keys(S.hist).sort();
  return ks.length ? ks[0] : TODAY();
}
function periodRange() {
  const now = new Date();
  if (period === 'day') {
    const k = dk(addD(now, pOff));
    return { days: [k], label: pOff === 0 ? 'Dnes' : pOff === -1 ? 'Včera'
      : `${D_(k).getDate()}. ${D_(k).getMonth() + 1}.` };
  }
  if (period === 'week') {
    const m = addD(monday(now), pOff * 7), days = [0,1,2,3,4,5,6].map(i => dk(addD(m, i)));
    const b = addD(m, 6);
    return { days, label: `${m.getDate()}. ${m.getMonth() + 1}. – ${b.getDate()}. ${b.getMonth() + 1}.` };
  }
  if (period === 'month') {
    const f = new Date(now.getFullYear(), now.getMonth() + pOff, 1);
    const y = f.getFullYear(), mo = f.getMonth(), n = new Date(y, mo + 1, 0).getDate();
    const days = []; for (let i = 1; i <= n; i++) days.push(dk(new Date(y, mo, i)));
    return { days, label: `${MONTHS[mo]} ${y}` };
  }
  const days = []; let c = D_(firstDay());
  while (dk(c) <= TODAY()) { days.push(dk(c)); c = addD(c, 1); }
  return { days: days.length ? days : [TODAY()], label: 'Od začátku' };
}

function statsFor(days) {
  const td = TODAY(), past = days.filter(k => k <= td);
  let done = 0, exp = 0, full = 0, active = 0, comets = 0;
  const per = {};
  past.forEach(k => {
    comets += Object.values((S.hist[k] || {}).bonus || {}).reduce((a, b) => a + b, 0);
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
    if (d === req.length) full++;
  });
  let wExp = 0, wDone = 0;
  weeklyAll().forEach(t => {
    const seen = {};
    past.forEach(k => {
      const cs = cycleStart(t, k);
      if (seen[cs]) return; seen[cs] = 1;
      const cd = cycleDays(t, k);
      if (t.created && t.created > cd[6]) return;
      wExp++;
      if (cd.some(x => S.hist[x] && S.hist[x].done[t.id])) wDone++;
      per[t.id] = per[t.id] || { exp: 0, done: 0 };
      per[t.id].exp++;
      if (cd.some(x => S.hist[x] && S.hist[x].done[t.id])) per[t.id].done++;
    });
  });
  const tot = exp + wExp, got = done + wDone;
  return { done: got, exp: tot, miss: tot - got, pct: tot ? Math.round(got / tot * 100) : 0,
           full, active, comets, per };
}

function viewPrehled() {
  const { days, label } = periodRange(), st = statsFor(days), td = TODAY();
  const nameOf = id => (S.tasks.find(t => t.id === id) || S.gone[id] || {});
  const rows = Object.keys(st.per).map(id => {
    const t = nameOf(id), p = st.per[id], pc = p.exp ? Math.round(p.done / p.exp * 100) : 0;
    return { emo: t.emo || '•', title: (t.title || 'Smazaný úkol') +
      (S.tasks.some(x => x.id === id) ? '' : ' · smazáno'), ...p, pc };
  }).sort((a, b) => a.pc - b.pc);

  const grid = period === 'day' ? '' : `<div class="section-title">Dny</div>
    <div class="${period === 'week' ? 'week-strip' : 'mgrid'}">${days.map((k, i) => {
      const req = expectedFor(k), h = S.hist[k];
      const d = req.filter(id => h && h.done[id]).length;
      const cls = k > td ? 'fut' : !req.length ? 'none' : d === req.length ? 'full' : d ? 'part' : 'zero';
      return period === 'week'
        ? `<div class="day ${k === td ? 'today' : ''} ${cls}"><b>${DOW[i]}</b>
           <span class="mk">${k > td ? '·' : !req.length ? '–' : d === req.length ? '★' : d + '/' + req.length}</span></div>`
        : `<div class="mday ${k === td ? 'today' : ''} ${cls}">${+k.slice(8)}</div>`;
    }).join('')}</div>`;

  return `<div class="seg" id="seg">${[['day','Den'],['week','Týden'],['month','Měsíc'],['all','Vše']]
      .map(([k, n]) => `<button data-p="${k}" class="${period === k ? 'on' : ''}">${n}</button>`).join('')}</div>
    ${period === 'all' ? `<div class="pernav"><b>Od začátku</b></div>` : `<div class="pernav">
      <button data-off="-1" aria-label="Předchozí">‹</button><b>${label}</b>
      <button data-off="1" ${pOff >= 0 ? 'disabled' : ''} aria-label="Další">›</button></div>`}
    <div class="kpi">
      <div class="k ok"><b>${st.done}</b><span>rozsvíceno</span></div>
      <div class="k no"><b>${st.miss}</b><span>zhaslo</span></div>
      <div class="k pc"><b>${st.pct} %</b><span>úspěšnost</span></div>
    </div>
    <div class="card">
      <div class="srow"><span>✦ Celá souhvězdí</span><b>${st.full} z ${st.active}
        ${plur(st.active,'dne','dnů','dnů')}</b></div>
      <div class="srow"><span>☄︎ Komety za bonusy</span><b>${st.comets}</b></div>
    </div>
    ${grid}
    <div class="section-title">Po jednotlivých úkolech</div>
    ${rows.length ? `<div class="card">${rows.map(r => `<div class="tstat">
      <span class="t-emo">${r.emo}</span>
      <div class="t-mid"><div class="t-nm">${r.title}</div>
        <div class="t-bar"><i class="${r.pc >= 80 ? 'hi' : r.pc >= 50 ? 'mid' : 'lo'}"
          style="width:${r.pc}%"></i></div></div>
      <b class="t-num">${r.done}/${r.exp}</b></div>`).join('')}</div>`
      : `<div class="empty">Za tohle období zatím nejsou data</div>`}`;
}

/* ---------- obrazovka Úkoly ---------- */
function viewUkoly() {
  const stale = dk(addD(new Date(), -14));
  const a = live().filter(t => !(t.type === 'once' && t.doneAt && t.doneAt < stale));
  const grp = (nm, arr, note) => arr.length ? `<div class="section-title">${nm}</div>` +
    (note ? `<p class="note gnote">${note}</p>` : '') + arr.map(t => `
    <div class="row edit" data-edit="${t.id}">
      <span class="em ${catCls(t.cat)}">${t.emo}</span>
      <span class="nm">${t.title}</span>
      <span class="tag">${t.type === 'daily' ? (t.days || []).map(d => DOW[d - 1]).join(' ')
        : t.type === 'weekly' ? DOW[wstart(t) - 1] + '→' + DOW[wstart(t) - 1]
        : t.type === 'bonus' ? 'kdykoliv' : (t.due ? dueLabel(t.due) : 'jednou')}</span>
      <span class="chev">›</span></div>`).join('') : '';
  return `<button class="btn" data-act="new">➕ Nový úkol</button>
    ${grp('Každý den', a.filter(t => t.type === 'daily'))}
    ${grp('Každý týden', a.filter(t => t.type === 'weekly'), 'Šipka ukazuje den, kdy se úkol obnoví.')}
    ${grp('Bonusy — komety', a.filter(t => t.type === 'bonus'), 'Dobrovolné. Nikdy nechybí, jen přidávají.')}
    ${grp('Jen jednou', a.filter(t => t.type === 'once'))}
    <div class="section-title">Další</div>
    <button class="btn sec" data-act="rozvrh">🗓️ Rozvrh hodin</button>
    <button class="btn sec" data-act="parents">⚙️ Pro rodiče a nastavení</button>`;
}

/* ---------- render ---------- */
function render() {
  const tt = totals();
  const got = tt.dDone + tt.wDone, all = tt.dTotal + tt.wTotal;
  $('#tally').innerHTML = all
    ? `<div class="tw"><b>${got}<i> z ${all}</i></b><span>hvězdiček</span></div>${
        tt.comets ? `<u>+${tt.comets} ☄︎</u>` : ''}`
    : `<div class="tw"><b class="q">✦</b><span>hvězdiček</span></div>`;
  $('#screen').innerHTML = ({ obloha: viewObloha, prehled: viewPrehled, ukoly: viewUkoly })[tab]();
  document.querySelectorAll('[data-sky]').forEach(el => {
    const k = el.dataset.sky, sh = el.dataset.shape;
    if (lastShape[k] != null && lastShape[k] !== sh) el.classList.add('reshuffle');
    lastShape[k] = sh;
  });
  document.querySelectorAll('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  flash = null;
}

/* ---------- editor úkolu ---------- */
function editSheet(t) {
  const nw = !t;
  t = t || { id: uid(), title: '', emo: '⭐', cat: 'domov', type: 'daily',
             days: [1,2,3,4,5,6,7], wstart: 1, created: TODAY() };
  const d = JSON.parse(JSON.stringify(t));
  const show = () => {
    $('#wDays').hidden = d.type !== 'daily';
    $('#wStart').hidden = d.type !== 'weekly';
    $('#wDue').hidden = d.type !== 'once';
    $('#wBon').hidden = d.type !== 'bonus';
  };
  openSheet(nw ? 'Nový úkol' : 'Upravit úkol', `
    <label class="f">Co mám udělat?</label>
    <input type="text" id="fT" value="${d.title.replace(/"/g, '&quot;')}"
      placeholder="Např. Uklidit si stůl" autocomplete="off">
    <label class="f">Obrázek</label>
    <div class="emo-grid" id="fE">${EMOJIS.map(e =>
      `<button class="emo-pick ${e === d.emo ? 'on' : ''}" data-e="${e}">${e}</button>`).join('')}</div>
    <label class="f">Kam patří</label>
    <div class="chips" id="fC">${CATS.map(c =>
      `<button class="chip ${c.id === d.cat ? 'on' : ''}" data-c="${c.id}">${c.nm}</button>`).join('')}</div>
    <label class="f">Jak často</label>
    <div class="chips" id="fY">${[['daily','Každý den'],['weekly','Každý týden'],
      ['once','Jen jednou'],['bonus','Bonus']].map(([k, n]) =>
      `<button class="chip ${k === d.type ? 'on' : ''}" data-y="${k}">${n}</button>`).join('')}</div>
    <div id="wDays"><label class="f">Ve které dny</label>
      <div class="days" id="fD">${DOW.map((n, i) =>
        `<button class="${(d.days || []).includes(i + 1) ? 'on' : ''}" data-d="${i + 1}">${n}</button>`).join('')}</div></div>
    <div id="wStart"><label class="f">Kdy se týden obnovuje</label>
      <div class="days" id="fW">${DOW.map((n, i) =>
        `<button class="${wstart(d) === i + 1 ? 'on' : ''}" data-w="${i + 1}">${n}</button>`).join('')}</div>
      <p class="note">Úkol se obnoví vždy v <b id="wsName">${DOWL[wstart(d) - 1]}</b>
        a do dalšího musí být hotový.</p></div>
    <div id="wDue"><label class="f">Do kdy (nepovinné)</label>
      <input type="date" id="fDue" value="${d.due || ''}"></div>
    <div id="wBon"><p class="note">Bonus je dobrovolný. Splnit ho jde i víckrát za den a pokaždé
      přidá jednu kometu. Nikdy nechybí — nezvedá počet hvězd, které musíš splnit.</p></div>
    <div style="height:16px"></div>
    <button class="btn" id="fSave">Uložit</button>
    ${nw ? '' : `<button class="btn ghost" id="fDel">Smazat úkol</button>`}`, box => {
    const pick = (sel, attr, fn) => box.querySelector(sel).addEventListener('click', e => {
      const b = e.target.closest('[data-' + attr + ']'); if (!b) return; fn(b.dataset[attr], b);
    });
    pick('#fE', 'e', v => { d.emo = v;
      box.querySelectorAll('#fE .emo-pick').forEach(x => x.classList.toggle('on', x.dataset.e === v)); });
    pick('#fC', 'c', v => { d.cat = v;
      box.querySelectorAll('#fC .chip').forEach(x => x.classList.toggle('on', x.dataset.c === v)); });
    pick('#fY', 'y', v => { d.type = v;
      box.querySelectorAll('#fY .chip').forEach(x => x.classList.toggle('on', x.dataset.y === v)); show(); });
    pick('#fD', 'd', (v, b) => {
      const n = +v; d.days = d.days || [];
      d.days = d.days.includes(n) ? d.days.filter(x => x !== n) : d.days.concat(n);
      b.classList.toggle('on', d.days.includes(n));
    });
    pick('#fW', 'w', (v, b) => { d.wstart = +v;
      box.querySelectorAll('#fW button').forEach(x => x.classList.toggle('on', x === b));
      box.querySelector('#wsName').textContent = DOWL[d.wstart - 1]; });
    show();
    box.querySelector('#fSave').addEventListener('click', () => {
      d.title = box.querySelector('#fT').value.trim();
      if (!d.title) { toast('Napiš, co máš udělat 🙂'); return; }
      if (d.type === 'once') d.due = box.querySelector('#fDue').value || '';
      if (d.type === 'daily' && !(d.days || []).length) d.days = [1,2,3,4,5,6,7];
      const i = S.tasks.findIndex(x => x.id === d.id);
      if (i >= 0) S.tasks[i] = d; else S.tasks.push(d);
      save(); closeSheet(); render(); toast(nw ? 'Úkol přidán ✨' : 'Uloženo ✓');
    });
    const del = box.querySelector('#fDel');
    if (del) del.addEventListener('click', () => {
      if (!confirm(`Smazat úkol „${d.title}"?\n\nZmizí nadobro. V přehledu minulých dnů zůstane, ` +
                   `aby čísla za odehrané dny seděla.`)) return;
      const cur = S.tasks.find(x => x.id === d.id);
      if (cur) S.gone[cur.id] = { title: cur.title, emo: cur.emo };
      S.tasks = S.tasks.filter(x => x.id !== d.id);
      save(); closeSheet(); render(); toast('Úkol smazán');
    });
  });
}

/* ---------- další sheety ---------- */
function rozvrhSheet() {
  const d = iso(new Date());
  openSheet('Rozvrh hodin', `<div class="sched">${[1,2,3,4,5].map(i => `
    <div class="sched-day ${i === d ? 'on' : ''}"><div class="sched-nm">${DOW[i - 1]}</div>
      <ol class="lessons small">${SCHEDULE[i].map((nm, j) =>
        `<li><span class="ln">${j + 1}.</span><span class="li-ico">${lessonIco(nm)}</span>${nm}</li>`).join('')}</ol>
    </div>`).join('')}</div><p class="note">Rozvrh je pevný na celý rok.</p>`);
}

function homeworkSheet() {
  const d = iso(new Date());
  const tl = (SCHEDULE[d] || []).join(' '), ml = (SCHEDULE[d >= 5 ? 1 : d + 1] || []).join(' ');
  const near = HW.filter(x => tl.indexOf(x.nm) >= 0 || ml.indexOf(x.nm) >= 0);
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
    <p class="note">Hvězda se rozsvítí v dnešním souhvězdí v den termínu. Do té doby úkol čeká
      v sekci <b>Chystá se</b>.</p>
    ${near.length ? `<label class="f">Z dnešního a zítřejšího rozvrhu</label>${grid(near)}` : ''}
    ${rest.length ? `<label class="f">Ostatní</label>${grid(rest)}` : ''}
    <div style="height:12px"></div>`, box => {
    box.querySelector('#hwWhen').addEventListener('click', e => {
      const b = e.target.closest('[data-w]'); if (!b) return;
      when = b.dataset.w;
      box.querySelectorAll('#hwWhen .chip').forEach(x => x.classList.toggle('on', x === b));
      box.querySelector('#hwDate').hidden = when !== 'jine';
    });
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-hw]'); if (!b) return;
      const nm = b.dataset.hw, x = HW.find(y => y.nm === nm);
      const due = when === 'dnes' ? TODAY() : when === 'zitra' ? dk(addD(new Date(), 1))
        : when === 'tyden' ? dk(addD(new Date(), 7))
        : (box.querySelector('#hwD').value || dk(addD(new Date(), 7)));
      S.tasks.push({ id: uid(), title: 'Úkol – ' + nm, emo: x.ico, cat: 'skola', type: 'once',
        due, created: TODAY() });
      save(); closeSheet(); render(); toast(`Úkol z ${nm}: ${dueLabel(due)} 📚`);
    });
  });
}

function parentsSheet() {
  openSheet('Pro rodiče', `
    <p class="note">Cíl týdne je počet dnů, kdy se rozsvítí celé dnešní souhvězdí.</p>
    <label class="f">Kolik dnů v týdnu</label>
    <div class="chips" id="pD">${[3,4,5,6,7].map(n =>
      `<button class="chip ${n === S.goal.days ? 'on' : ''}" data-d="${n}">${n}</button>`).join('')}</div>
    <label class="f">Odměna za splněný cíl</label>
    <input type="text" id="pR" value="${(S.goal.reward || '').replace(/"/g, '&quot;')}"
      placeholder="Např. výlet do stáje">
    <label class="f">Kdy se obloha ustálí</label>
    <div class="chips" id="pL">${[16,17,18,19,20].map(n =>
      `<button class="chip ${n === lockHour() ? 'on' : ''}" data-l="${n}">${n}:00</button>`).join('')}</div>
    <p class="note">Do té doby se souhvězdí přeskládává podle počtu úkolů — aby se dalo počkat,
      než se zadá všechno, co ten den přibylo. Co přibude potom, je hvězda navíc.</p>
    <label class="f">Zvuky</label>
    <div class="chips" id="pS">
      <button class="chip ${S.sound ? 'on' : ''}" data-s="1">Zapnuté</button>
      <button class="chip ${!S.sound ? 'on' : ''}" data-s="0">Vypnuté</button></div>
    <div style="height:14px"></div>
    <button class="btn" id="pSave">Uložit</button>
    <div class="section-title">Záloha</div>
    <p class="note">Data jsou jen v tomto telefonu. Zkopírujte si text níže jako zálohu,
      nebo sem vložte starší zálohu a dejte Obnovit.</p>
    <textarea id="pB" spellcheck="false">${JSON.stringify(S)}</textarea>
    <div class="btn-row">
      <button class="btn sec" id="pRestore">Obnovit ze zálohy</button>
      <button class="btn sec danger" id="pReset">Vymazat vše</button></div>
    <div style="height:8px"></div>`, box => {
    box.querySelector('#pD').addEventListener('click', e => {
      const b = e.target.closest('[data-d]'); if (!b) return;
      S.goal.days = +b.dataset.d;
      box.querySelectorAll('#pD .chip').forEach(x => x.classList.toggle('on', x === b));
    });
    box.querySelector('#pL').addEventListener('click', e => {
      const b = e.target.closest('[data-l]'); if (!b) return;
      S.lockAt = +b.dataset.l;
      box.querySelectorAll('#pL .chip').forEach(x => x.classList.toggle('on', x === b));
    });
    box.querySelector('#pS').addEventListener('click', e => {
      const b = e.target.closest('[data-s]'); if (!b) return;
      S.sound = b.dataset.s === '1';
      box.querySelectorAll('#pS .chip').forEach(x => x.classList.toggle('on', x === b));
    });
    box.querySelector('#pSave').addEventListener('click', () => {
      S.goal.reward = box.querySelector('#pR').value.trim();
      save(); closeSheet(); render(); toast('Uloženo ✓');
    });
    box.querySelector('#pRestore').addEventListener('click', () => {
      try {
        const o = JSON.parse(box.querySelector('#pB').value);
        if (!o || !o.tasks) throw 0;
        localStorage.setItem(KEY, JSON.stringify(o));
        load(); save(); closeSheet(); render(); toast('Obnoveno ✓');
      } catch (e) { toast('Záloha nejde přečíst'); }
    });
    box.querySelector('#pReset').addEventListener('click', () => {
      if (!confirm('Opravdu vymazat všechna data a začít znovu?')) return;
      S = fresh(); save(); closeSheet(); render();
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
  const cp = e.target.closest('[data-comet]');
  if (cp) { const t = S.tasks.find(x => x.id === cp.dataset.comet); if (t) addComet(t); return; }
  const cu = e.target.closest('[data-uncomet]');
  if (cu) { const t = S.tasks.find(x => x.id === cu.dataset.uncomet); if (t) dropComet(t); return; }
  const tk = e.target.closest('[data-task]');
  if (tk) { const t = S.tasks.find(x => x.id === tk.dataset.task); if (t) toggle(t); return; }
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
document.addEventListener('visibilitychange', () => { if (!document.hidden) { load(); render(); } });

/* ---------- start ---------- */
load(); render(); save();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
