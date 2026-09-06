/* ==========================================================================
   Stáj Tiffany — offline organizér s koňskou gamifikací
   Všechna data zůstávají v localStorage na telefonu. Žádný server.
   ========================================================================== */
(function () {
'use strict';

/* ---------- pomocníci ---------- */
const $  = (s, r) => (r || document).querySelector(s);
const pad = n => String(n).padStart(2, '0');
const dk  = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const TODAY = () => dk(new Date());
const iso = d => (d.getDay() === 0 ? 7 : d.getDay());
const addD = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const monday = d => { const x = new Date(d); x.setHours(0,0,0,0); return addD(x, -(iso(x) - 1)); };
const weekKey = d => dk(monday(d));
const uid = () => Math.random().toString(36).slice(2, 9);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const DOW = ['Po','Út','St','Čt','Pá','So','Ne'];
const HS = '<span class="hs"></span>';   /* podkova jako ikona */
const plur = (n, a, b, c) => (n === 1 ? a : n >= 2 && n <= 4 ? b : c);

/* ---------- obsah hry ---------- */
const LEVELS = [
  { xp:0,    name:'Hříbátko' },      { xp:120,  name:'Poník' },
  { xp:300,  name:'Nováček ve stáji'},{ xp:550, name:'Malá jezdkyně' },
  { xp:900,  name:'Jezdkyně' },      { xp:1400, name:'Skokanka' },
  { xp:2000, name:'Drezurní hvězda'},{ xp:2800, name:'Kovbojka' },
  { xp:3800, name:'Šampionka' },     { xp:5000, name:'Legenda stáje' }
];

const BADGES = [
  { id:'first',  ico:'⭐', nm:'První úkol',        test:s => s.stats.tasks >= 1 },
  { id:'d3',     ico:'🔥', nm:'3 dny v řadě',      test:s => s.streak.best >= 3 },
  { id:'d7',     ico:'🏅', nm:'Celý týden',        test:s => s.streak.best >= 7 },
  { id:'d30',    ico:'👑', nm:'30 dní v řadě',     test:s => s.streak.best >= 30 },
  { id:'c100',   ico:HS,      nm:'100 podkov',        test:s => s.xp >= 100 },
  { id:'c1000',  ico:'💎', nm:'1000 podkov',       test:s => s.xp >= 1000 },
  { id:'week4',  ico:'🧹', nm:'4× týdenní úklid',  test:s => s.stats.weekly >= 4 },
  { id:'school10',ico:'📚',nm:'10 úkolů do školy', test:s => s.stats.school >= 10 },
  { id:'early',  ico:'🌅', nm:'Ranní ptáče',       test:s => s.stats.early },
  { id:'feed10', ico:'🥕', nm:'10× nakrmeno',      test:s => s.stats.feeds >= 10 },
  { id:'shop1',  ico:'🎀', nm:'První nákup',       test:s => s.stats.buys >= 1 },
  { id:'goal1',  ico:'🎁', nm:'Splněný cíl týdne', test:s => s.stats.goals >= 1 }
];

const FOOD = [
  { id:'seno',   ico:'🌾', nm:'Seno',   pr:4,  mood:5  },
  { id:'mrkev',  ico:'🥕', nm:'Mrkev',  pr:6,  mood:8  },
  { id:'cukr',   ico:'🍬', nm:'Cukr',   pr:9,  mood:11 },
  { id:'jablko', ico:'🍎', nm:'Jablko', pr:10, mood:14 }
];

const GEAR = [
  { id:'head:masle',   ico:'🎀', nm:'Mašle do hřívy', pr:50,  slot:'head', v:'masle' },
  { id:'legs:bandaze', ico:'🧦', nm:'Bandáže',        pr:70,  slot:'legs', v:'bandaze' },
  { id:'head:celenka', ico:'💠', nm:'Čelenka',        pr:80,  slot:'head', v:'celenka' },
  { id:'head:kvetiny', ico:'🌸', nm:'Věneček',        pr:90,  slot:'head', v:'kvetiny' },
  { id:'body:deka',    ico:'🟦', nm:'Dečka',          pr:120, slot:'body', v:'deka' },
  { id:'head:klobouk', ico:'🤠', nm:'Klobouk',        pr:150, slot:'head', v:'klobouk' },
  { id:'body:sedlo',   ico:'🐎', nm:'Sedlo',          pr:200, slot:'body', v:'sedlo' },
  { id:'body:plast',   ico:'✨', nm:'Hvězdný plášť',  pr:320, slot:'body', v:'plast' },
  { id:'head:roh',     ico:'🦄', nm:'Jednorožčí roh', pr:450, slot:'head', v:'roh' }
];

const SCENES = [
  { id:'scene:louka',  ico:'🌳', nm:'Louka',        pr:0 },
  { id:'scene:zapad',  ico:'🌇', nm:'Západ slunce', pr:180 },
  { id:'scene:hory',   ico:'🏔️', nm:'Hory',         pr:260 },
  { id:'scene:noc',    ico:'🌙', nm:'Hvězdná noc',  pr:400 }
];

const COAT_PR = { hnedak:0, ryzka:70, plavak:90, belous:110, vranik:130, strakac:160, ruzovy:220, modry:220 };
const MANE_PR = { tmava:0, svetla:50, ohniva:70, ruzova:80, fialova:90, duhova:300 };

const EMOJIS = ['🎒','📚','✏️','📒','🧮','🇬🇧','🧹','🧺','👕','🛏️','🍽️','🗑️','🪥','🚿','🌙','⏰','🐴','🎹','⚽','🎨','💖','📖','🐕','💧','🌱','🧸','🎵','🏃'];
const CATS = [
  { id:'skola', nm:'Škola',    cls:'cat-skola' },
  { id:'domov', nm:'Domov',    cls:'cat-domov' },
  { id:'ja',    nm:'Já sama',  cls:'cat-ja' },
  { id:'volno', nm:'Zábava',   cls:'cat-volno' }
];
const catCls = c => (CATS.find(x => x.id === c) || CATS[1]).cls;

/* ---------- stav ---------- */
const KEY = 'tiffany.stable.v1';
let S = null;
let tab = 'dnes';
let shopTab = 'krmivo';

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
    v: 1, kid: 'Tiffany',
    coins: 40, xp: 0,
    streak: { n: 0, best: 0, last: null },
    horse: { name: 'Hvězdička', coat: 'hnedak', mane: 'tmava', mood: 78, decay: TODAY() },
    owned: ['coat:hnedak', 'mane:tmava', 'scene:louka'],
    eq: { head: null, body: null, legs: null, scene: 'louka' },
    tasks: seedTasks(),
    hist: {},
    badges: {},
    goal: { target: 200, reward: '', week: weekKey(new Date()), claimed: false },
    stats: { tasks: 0, school: 0, weekly: 0, feeds: 0, buys: 0, goals: 0, early: false },
    sound: true
  };
}

function load() {
  try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
  if (!S || S.v !== 1) S = fresh();
  if (!S.stats) S.stats = fresh().stats;
  decayMood();
  rollGoal();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

function decayMood() {
  const last = S.horse.decay || TODAY();
  let d = new Date(last + 'T00:00:00');
  const now = new Date(TODAY() + 'T00:00:00');
  let days = Math.round((now - d) / 86400000);
  if (days > 0) {
    S.horse.mood = clamp(S.horse.mood - Math.min(days, 6) * 7, 35, 100);
    S.horse.decay = TODAY();
  }
}
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
    (t.type === 'once' && t.doneAt === TODAY())
  ));
}
function weeklyOpen() { return S.tasks.filter(t => !t.arch && t.type === 'weekly'); }
function earnedOn(k) { const h = S.hist[k]; if (!h) return 0; return Object.values(h.done).reduce((a, b) => a + b, 0) + (h.bonus ? 15 : 0); }
function weekEarned() { return weekDays().reduce((a, k) => a + earnedOn(k), 0); }
function dayComplete(k) {
  const d = new Date(k + 'T00:00:00'), w = iso(d);
  const req = S.tasks.filter(t => !t.arch && t.type === 'daily' && (t.days || []).includes(w));
  if (!req.length) return false;
  const h = S.hist[k];
  return !!h && req.every(t => h.done[t.id]);
}

/* ---------- akce ---------- */
function toggleTask(t) {
  const k = TODAY(), h = day(k);
  if (isDone(t)) {                                   /* zpět */
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
    recalcStreak();
    save(); render();
    return;
  }
  const bonus = S.horse.mood >= 85 ? Math.round(t.pts * 0.2) : 0;
  const gain = t.pts + bonus;
  h.done[t.id] = gain;
  if (t.type === 'once') t.doneAt = k;
  S.coins += gain; S.xp += gain;
  S.horse.mood = clamp(S.horse.mood + 4, 0, 100);
  S.stats.tasks++;
  if (t.cat === 'skola') S.stats.school++;
  if (t.type === 'weekly') S.stats.weekly++;
  if (new Date().getHours() < 8) S.stats.early = true;

  let msg = `+${t.pts} ${HS}` + (bonus ? ` (+${bonus} bonus 💕)` : '');
  if (!h.bonus && dayComplete(k)) { h.bonus = true; S.coins += 15; S.xp += 15; S.horse.mood = clamp(S.horse.mood + 15, 0, 100); msg = `Všechno hotovo! +15 ${HS} navíc 🎉`; }
  recalcStreak();
  checkBadges();
  save(); render();
  confetti(); ding(); toast(msg);
  bump('statCoins');
}

function recalcStreak() {
  let k = TODAY(), n = 0;
  if (!dayComplete(k)) k = dk(addD(new Date(), -1));
  while (dayComplete(k) && n < 400) { n++; k = dk(addD(new Date(k + 'T00:00:00'), -1)); }
  S.streak.n = n;
  S.streak.best = Math.max(S.streak.best || 0, n);
  S.streak.last = TODAY();
}

function checkBadges() {
  BADGES.forEach(b => {
    if (!S.badges[b.id] && b.test(S)) { S.badges[b.id] = TODAY(); setTimeout(() => toast(`Nový odznak: ${b.ico} ${b.nm}`), 900); }
  });
}

function feed(f) {
  if (S.coins < f.pr) { toast('Ještě nemáš dost podkov 🙂'); return; }
  S.coins -= f.pr;
  S.horse.mood = clamp(S.horse.mood + f.mood, 0, 100);
  S.stats.feeds++;
  checkBadges(); save(); render(); ding(); confetti(14);
  toast(`${S.horse.name} mlask! ${f.ico}`);
}

function buy(id, pr) {
  if (S.owned.includes(id)) return equip(id);
  if (S.coins < pr) { toast('Ještě si musíš vydělat víc podkov 💪'); return; }
  S.coins -= pr; S.owned.push(id); S.stats.buys++;
  equip(id, true); checkBadges(); save(); render(); confetti(); ding();
  toast('Máš to! 🎉');
}

function equip(id, silent) {
  const [kind, val] = id.split(':');
  if (kind === 'coat') S.horse.coat = val;
  else if (kind === 'mane') S.horse.mane = val;
  else if (kind === 'scene') S.eq.scene = val;
  else S.eq[kind] = (S.eq[kind] === val ? null : val);
  save(); if (!silent) render();
}

function claimGoal() {
  S.goal.claimed = true; S.coins += 50; S.stats.goals++;
  checkBadges(); save(); render(); confetti(80); ding();
  toast(`Cíl týdne splněn! +50 ${HS}`);
}

/* ---------- efekty ---------- */
let toastT;
function toast(msg) {
  const el = $('#toast'); el.innerHTML = msg; el.hidden = false;
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 2200);
}
function bump(id) { const el = $('#' + id); if (!el) return; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

let audioCtx;
function ding() {
  if (!S.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    [0, .09, .18].forEach((t, i) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'sine'; o.frequency.value = [660, 880, 1170][i];
      g.gain.setValueAtTime(0.0001, audioCtx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.16, audioCtx.currentTime + t + .02);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + t + .22);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + .25);
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
  for (let i = 0; i < (n || 46); i++) parts.push({
    x: innerWidth / 2 + (Math.random() - .5) * 160, y: innerHeight * .34,
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

/* ---------- render ---------- */
function horseOpts(extra) {
  return Object.assign({ coat: S.horse.coat, mane: S.horse.mane, head: S.eq.head, body: S.eq.body, legs: S.eq.legs, mood: S.horse.mood }, extra || {});
}

function render() {
  const i = level();
  $('#levelName').textContent = levelName();
  $('#levelNum').textContent = i + 1;
  $('#xpFill').style.width = (levelProgress() * 100).toFixed(1) + '%';
  $('#statCoins').querySelector('b').textContent = S.coins;
  $('#statStreak').querySelector('b').textContent = S.streak.n;
  $('#miniHorse').innerHTML = Horse.svg(horseOpts({ crop: 'head', bob: false }));
  $('#screen').innerHTML = ({ dnes: viewDnes, tyden: viewTyden, staj: viewStaj, ukoly: viewUkoly })[tab]();
  document.querySelectorAll('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  $('#screen').scrollTop = 0;
}

function moodWord() {
  const m = S.horse.mood;
  if (m >= 88) return ['Jsem nejšťastnější kůň na světě!', '💖'];
  if (m >= 70) return ['Mám se skvěle, díky!', '😊'];
  if (m >= 50) return ['Dneska by mi bodla mrkev 🥕', '🙂'];
  return ['Zvládneme to spolu, jdeme na to!', '🐴'];
}

function heroHTML() {
  const [say] = moodWord();
  return `<div class="hero">
    <div class="hero-scene scene-${S.eq.scene || 'louka'}">
      ${Horse.svg(horseOpts())}
    </div>
    <div class="hero-foot">
      <div class="hero-say">💬 <b>${S.horse.name}:</b> ${say}</div>
      <div class="hero-row">
        <div class="mood">
          <div class="mood-lbl"><span>Nálada koně</span><span>${Math.round(S.horse.mood)}%</span></div>
          <div class="mood-bar"><i style="width:${S.horse.mood}%"></i></div>
        </div>
        <button class="btn peach" style="width:auto;padding:11px 16px" data-act="feed">🥕 Nakrmit</button>
      </div>
    </div>
  </div>`;
}

function taskHTML(t, showWhen) {
  const done = isDone(t);
  const when = t.type === 'weekly' ? 'Tento týden' : t.type === 'once' ? (t.due ? 'Do ' + t.due.slice(8) + '.' + t.due.slice(5, 7) + '.' : 'Jednorázově') : '';
  return `<div class="task ${done ? 'done' : ''}" data-task="${t.id}">
    <div class="emo ${catCls(t.cat)}">${t.emo}</div>
    <div class="tx"><div class="tt">${t.title}</div>
      <div class="ts"><span class="pts">+${t.pts} ${HS}</span>${showWhen && when ? `<span>${when}</span>` : ''}</div></div>
    <div class="chk">${done ? '✓' : ''}</div>
  </div>`;
}

function ringHTML(done, total) {
  const p = total ? done / total : 0, R = 26, C = 2 * Math.PI * R;
  return `<svg class="ring" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="${R}" fill="none" stroke="#F1E4D6" stroke-width="8"/>
    <circle cx="32" cy="32" r="${R}" fill="none" stroke="#5FAE63" stroke-width="8" stroke-linecap="round"
      stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - p)}" transform="rotate(-90 32 32)"/>
    <text x="32" y="37" text-anchor="middle">${done}/${total}</text></svg>`;
}

function goalHTML() {
  const e = weekEarned(), t = S.goal.target || 200, p = clamp(e / t, 0, 1);
  const ready = e >= t && !S.goal.claimed;
  return `<div class="goal">
    <h3>🎁 Cíl týdne</h3>
    <div class="mood-lbl" style="margin-top:8px"><span>${e} z ${t} ${HS}</span><span>${Math.round(p * 100)}%</span></div>
    <div class="mood-bar"><i style="width:${p * 100}%"></i></div>
    ${S.goal.reward ? `<div class="rew">Odměna: ${S.goal.reward}</div>` : `<div class="rew">Odměnu vyplní rodiče v nastavení ⚙️</div>`}
    ${ready ? `<button class="btn gold" style="margin-top:12px" data-act="claim">Vyzvednout odměnu 🎉</button>` : ''}
    ${S.goal.claimed ? `<div class="rew">✅ Splněno — hurá!</div>` : ''}
  </div>`;
}

function viewDnes() {
  const list = todaysDaily(), done = list.filter(isDone).length;
  const wk = weeklyOpen().filter(t => !doneThisWeek(t));
  return heroHTML() + goalHTML() +
    `<div class="card"><div class="today-head">${ringHTML(done, list.length)}
      <div><h2>${done === list.length && list.length ? 'Hotovo, super! 🎉' : 'Dnešní plán'}</h2>
      <p>${list.length ? `${(list.length - done) === 0 ? 'Všechno splněno' : plur(list.length - done, 'Zbývá 1 úkol', 'Zbývají ' + (list.length - done) + ' úkoly', 'Zbývá ' + (list.length - done) + ' úkolů')} · dnes máš ${earnedOn(TODAY())} ${HS}` : 'Dnes nemáš žádný úkol'}</p></div></div></div>` +
    (list.length ? list.map(t => taskHTML(t, true)).join('') :
      `<div class="empty"><span class="big">🌈</span>Dneska máš volno! Můžeš si přidat vlastní úkol.</div>`) +
    (wk.length ? `<div class="section-title">Tento týden</div>` + wk.map(t => taskHTML(t)).join('') : '') +
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
  return `<div class="card" style="display:flex;align-items:center;gap:14px">
      <div style="font-size:42px">🔥</div>
      <div><h2 style="font-size:20px;font-weight:800">${S.streak.n} ${S.streak.n === 1 ? 'den' : S.streak.n >= 2 && S.streak.n <= 4 ? 'dny' : 'dní'} v řadě</h2>
      <p style="font-size:13px;color:var(--ink-soft)">Nejlepší série: ${S.streak.best} · tento týden ${weekEarned()} ${HS}</p></div></div>
    <div class="section-title">Tento týden</div>
    <div class="week-strip">${strip}</div>
    <div class="section-title">Týdenní úkoly</div>
    ${wk.length ? wk.map(t => taskHTML(t)).join('') : `<div class="empty">Žádné týdenní úkoly</div>`}
    <div class="section-title">Odznaky (${Object.keys(S.badges).length}/${BADGES.length})</div>
    <div class="badge-grid">${BADGES.map(b => `<div class="badge ${S.badges[b.id] ? '' : 'locked'}">
      <span class="b-ico">${b.ico}</span><span class="b-nm">${b.nm}</span></div>`).join('')}</div>`;
}

function shopItems() {
  if (shopTab === 'krmivo') return FOOD.map(f => item(f.id, f.ico, null, f.nm, f.pr, false, false, `+${f.mood} nálady`));
  if (shopTab === 'srst') return Object.keys(Horse.COATS).map(k => {
    const id = 'coat:' + k, c = Horse.COATS[k];
    return item(id, null, c.c, c.name, COAT_PR[k], S.owned.includes(id), S.horse.coat === k);
  });
  if (shopTab === 'hriva') return Object.keys(Horse.MANES).map(k => {
    const id = 'mane:' + k, m = Horse.MANES[k];
    return item(id, m.rainbow ? '🌈' : null, m.rainbow ? null : m.c, m.name, MANE_PR[k], S.owned.includes(id), S.horse.mane === k);
  });
  if (shopTab === 'staj') return SCENES.map(s => item(s.id, s.ico, null, s.nm, s.pr, S.owned.includes(s.id), S.eq.scene === s.id.split(':')[1]));
  return GEAR.map(g => item(g.id, g.ico, null, g.nm, g.pr, S.owned.includes(g.id), S.eq[g.slot] === g.v));
}
function item(id, ico, sw, nm, pr, owned, on, sub) {
  const cant = !owned && S.coins < pr;
  return `<button class="item ${on ? 'equipped' : ''} ${cant ? 'cant' : ''}" data-buy="${id}" data-pr="${pr}">
    ${ico ? `<span class="i-ico">${ico}</span>` : `<span class="i-sw" style="background:${sw}"></span>`}
    <span class="i-nm">${nm}</span>
    <span class="i-pr ${owned ? 'owned' : ''}">${owned ? (on ? '✓ nasazeno' : 'nasadit') : (pr ? pr + ' ' + HS : 'zdarma')}</span>
    ${sub ? `<span class="i-pr" style="color:var(--ink-soft)">${sub}</span>` : ''}
  </button>`;
}

function viewStaj() {
  const tabs = [['krmivo','🥕 Krmení'],['doplnky','🎀 Doplňky'],['srst','🎨 Srst'],['hriva','💇 Hříva'],['staj','🏡 Stáj']];
  return heroHTML() +
    `<div class="card" style="text-align:center">
      <h2 style="font-size:19px;font-weight:800">${S.horse.name}</h2>
      <p style="font-size:13px;color:var(--ink-soft);margin-top:3px">Úroveň ${level() + 1} · ${levelName()}</p>
      <button class="btn sec" style="margin-top:12px" data-act="rename">✏️ Přejmenovat koně</button>
    </div>
    <div class="section-title">Obchod ve stáji</div>
    <div class="shop-tabs">${tabs.map(([k, n]) => `<button data-shop="${k}" class="${shopTab === k ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div class="shop-grid">${shopItems().join('')}</div>`;
}

function viewUkoly() {
  const grp = (nm, arr) => arr.length ? `<div class="section-title">${nm}</div>` + arr.map(t => `
    <div class="task" data-edit="${t.id}">
      <div class="emo ${catCls(t.cat)}">${t.emo}</div>
      <div class="tx"><div class="tt">${t.title}</div>
        <div class="ts"><span class="pts">+${t.pts} ${HS}</span>
        <span>${t.type === 'daily' ? (t.days || []).map(d => DOW[d - 1]).join(' ') : t.type === 'weekly' ? '1× týdně' : (t.due || 'jednorázově')}</span></div></div>
      <div style="color:var(--ink-soft);font-size:20px">›</div></div>`).join('') : '';
  const a = S.tasks.filter(t => !t.arch);
  return `<button class="btn" data-act="new">➕ Nový úkol</button>
    ${grp('Každý den', a.filter(t => t.type === 'daily'))}
    ${grp('Každý týden', a.filter(t => t.type === 'weekly'))}
    ${grp('Jednorázové', a.filter(t => t.type === 'once'))}
    <div class="section-title">Nastavení</div>
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
      <label class="f">Do kdy (nepovinné)</label>
      <input type="date" id="fDue" value="${d.due || ''}">
    </div>
    <div style="height:18px"></div>
    <button class="btn" id="fSave">Uložit</button>
    ${nw ? '' : `<button class="btn ghost" style="margin-top:8px" id="fDel">Smazat úkol</button>`}
  `, box => {
    const pick = (sel, attr, fn) => box.querySelector(sel).addEventListener('click', e => {
      const b = e.target.closest('[data-' + attr + ']'); if (!b) return;
      fn(b.dataset[attr], b);
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
      if (d.days.includes(n)) d.days = d.days.filter(x => x !== n); else d.days.push(n);
      b.classList.toggle('on', d.days.includes(n));
    });
    box.querySelector('#fSave').addEventListener('click', () => {
      d.title = box.querySelector('#fT').value.trim();
      if (!d.title) { toast('Napiš, co máš udělat 🙂'); return; }
      if (d.type === 'once') d.due = box.querySelector('#fDue').value || '';
      if (d.type === 'daily' && !(d.days || []).length) d.days = [1,2,3,4,5,6,7];
      const i = S.tasks.findIndex(x => x.id === d.id);
      if (i >= 0) S.tasks[i] = d; else S.tasks.push(d);
      save(); closeSheet(); render(); toast(nw ? 'Úkol přidán 🎉' : 'Uloženo ✓');
    });
    const del = box.querySelector('#fDel');
    if (del) del.addEventListener('click', () => {
      if (!confirm('Opravdu smazat tento úkol?')) return;
      S.tasks = S.tasks.filter(x => x.id !== d.id);
      save(); closeSheet(); render(); toast('Smazáno');
    });
  });
}

/* ---------- rodiče / nastavení ---------- */
function parentsSheet() {
  openSheet('Pro rodiče', `
    <p style="font-size:14px;color:var(--ink-soft)">Tady nastavíte týdenní cíl a odměnu, na které se doma domluvíte.</p>
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
    <p style="font-size:13px;color:var(--ink-soft)">Data jsou jen v tomto telefonu. Zkopírujte si text níže jako zálohu, nebo sem vložte starší zálohu a dejte Obnovit.</p>
    <textarea id="pB" spellcheck="false">${JSON.stringify(S)}</textarea>
    <div class="btn-row" style="margin-top:10px">
      <button class="btn sec" id="pRestore">Obnovit ze zálohy</button>
      <button class="btn sec" id="pReset" style="color:#C0392B">Vymazat vše</button>
    </div>
    <div style="height:10px"></div>
  `, box => {
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
        if (!o || o.v !== 1) throw 0;
        S = o; save(); closeSheet(); render(); toast('Obnoveno ✓');
      } catch (e) { toast('Záloha nejde přečíst'); }
    });
    box.querySelector('#pReset').addEventListener('click', () => {
      if (!confirm('Opravdu vymazat všechna data a začít znovu?')) return;
      S = fresh(); save(); closeSheet(); render();
    });
  });
}

function feedSheet() {
  openSheet('Krmení', `<div class="shop-grid">${FOOD.map(f =>
    `<button class="item ${S.coins < f.pr ? 'cant' : ''}" data-feed="${f.id}">
      <span class="i-ico">${f.ico}</span><span class="i-nm">${f.nm}</span>
      <span class="i-pr">${f.pr} ${HS}</span><span class="i-pr" style="color:var(--ink-soft)">+${f.mood} nálady</span></button>`).join('')}</div>`,
    box => box.addEventListener('click', e => {
      const b = e.target.closest('[data-feed]'); if (!b) return;
      const f = FOOD.find(x => x.id === b.dataset.feed);
      if (S.coins < f.pr) { toast('Ještě nemáš dost podkov 🙂'); return; }
      feed(f); closeSheet();
    }));
}

function renameSheet() {
  openSheet('Jméno koně', `
    <label class="f">Jak se jmenuje?</label>
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
  if (tb) { tab = tb.dataset.tab; render(); return; }

  const st = e.target.closest('[data-shop]');
  if (st) { shopTab = st.dataset.shop; render(); return; }

  const bi = e.target.closest('[data-buy]');
  if (bi) {
    const id = bi.dataset.buy;
    if (shopTab === 'krmivo') { const f = FOOD.find(x => x.id === id); feed(f); return; }
    buy(id, +bi.dataset.pr); return;
  }

  const tk = e.target.closest('[data-task]');
  if (tk) { const t = S.tasks.find(x => x.id === tk.dataset.task); if (t) toggleTask(t); return; }

  const ed = e.target.closest('[data-edit]');
  if (ed) { editSheet(S.tasks.find(x => x.id === ed.dataset.edit)); return; }

  const ac = e.target.closest('[data-act]');
  if (ac) {
    const a = ac.dataset.act;
    if (a === 'new') editSheet(null);
    else if (a === 'feed') feedSheet();
    else if (a === 'parents') parentsSheet();
    else if (a === 'rename') renameSheet();
    else if (a === 'claim') claimGoal();
    return;
  }
  if (e.target.closest('#btnProfile')) { tab = 'staj'; render(); }
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { const before = TODAY(); load(); render(); }
});

/* ---------- start ---------- */
load(); recalcStreak(); render(); save();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
