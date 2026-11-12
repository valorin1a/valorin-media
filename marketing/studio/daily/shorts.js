// Valorin 9:16 shorts engine (6 Nov 2026, file 14 decision 11 / claude/20).
// Mobile-first: hook on screen from frame 0, a visual change on every spoken line (2-3 s), word-by-word
// captions, content inside the phone safe zone, rotating formats. Locked frame from video.html.
// Usage: node shorts.js posts-v2/<id>.json <out.mp4> [captions.srt]
//        PREVIEW=auto|1.2,5,9 node shorts.js ...   (screenshots only)   SAFE=1 shows the unsafe zones
// Scene types: hook · strike · founder · dialogue · quiz · split · doc · draw · end  (README, "Shorts v2")
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const { genericSvg } = require('./figures.js');   // generic illustrated people for dialogue only; never the founder

const post = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = path.resolve(process.argv[3] || 'video.mp4');
const srtOut = process.argv[4] ? path.resolve(process.argv[4]) : null;
const FPS = 30, HOLD = 2.0;
const V = post.video;
const VOICES = Object.assign({ n: 'bm_george@0.85' }, V.voices || {});   // n = narrator (George, locked)
const CAST = V.cast || {};
// Founder facts: file 04 Evidenced, file 14 d.11 (6 Nov 2026). Keep identical everywhere.
const FOUNDER = { name: 'Muhammad Imran, ACMA', role: 'FOUNDER & MD · VALORIN', years: '20+', yearsL: 'years in finance & business management' };
const FOUNDER_PHOTO = '../../reference/founder-headshot.jpg';

// ---- lines ----
const scenes = V.scenes.map(sc => {
  if (!sc.lines) {
    const parts = sc.say.match(/.+?[.!?](?=\s+[A-Z"“']|\s*$)/g) || [sc.say];
    sc.lines = parts.map((p, j) => ({ say: p.trim(), cap: sc.cap && sc.cap[j] }));
  }
  return sc;
});
const LINES = [], FIRST = [];
scenes.forEach((sc, i) => { FIRST.push(LINES.length); sc.lines.forEach(l => LINES.push(Object.assign({ scene: i }, l))); });
const voiceOf = l => { const key = l.voice || (l.who && CAST[l.who] && CAST[l.who].voice) || 'n'; const [name, sp] = (VOICES[key] || key).split('@'); return { voice: name, speed: +(sp || 0.85) }; };

const audioDir = path.join(__dirname, '_audio2');
fs.rmSync(audioDir, { recursive: true, force: true }); fs.mkdirSync(audioDir);
fs.writeFileSync(path.join(audioDir, 'lines.json'), JSON.stringify(LINES.map(l => Object.assign({ text: l.say, pause: l.pause || 0 }, voiceOf(l)))));
execFileSync('python3', [path.join(__dirname, 'voice2.py'), 'voice', path.join(audioDir, 'lines.json'), audioDir], { stdio: 'inherit' });
const TM = JSON.parse(fs.readFileSync(path.join(audioDir, 'timing.json'), 'utf8'));
const LEAD = TM.lead, DUR = TM.durations.slice(), SPEECH = TM.speech;
DUR[DUR.length - 1] += HOLD;
const LS = [0]; DUR.forEach(d => LS.push(LS[LS.length - 1] + d));
const TOTAL = LS[LS.length - 1];
const SS = scenes.map((_, i) => LS[FIRST[i]]); SS.push(TOTAL);
const T = (i, k = 0, dt = 0) => +(LS[FIRST[i] + k] + (i === 0 && k === 0 ? 0 : LEAD) + dt).toFixed(2);
const speechEnd = (i, k) => +(LS[FIRST[i] + k] + LEAD + SPEECH[FIRST[i] + k]).toFixed(2);
const audioWav = path.join(audioDir, 'mix.wav');
execFileSync('python3', [path.join(__dirname, 'voice2.py'), 'mix', audioDir, String(TOTAL), String(FPS), audioWav], { stdio: 'inherit' });
const ENV = JSON.parse(fs.readFileSync(path.join(audioDir, 'env.json'), 'utf8'));

// ---- helpers ----
const em = s => String(s).replace(/\*(.+?)\*/g, '<em>$1</em>');
const el = (cls, t, html, extra = '') => `<div class="el ${cls}" data-in="${t}" ${extra}>${html}</div>`;
const kick = (i, txt) => txt ? el('k', i === 0 ? -1 : T(i, 0), txt) : '';
const cols = { navy: '#13283D', gold: '#B29A74', red: '#B3261E', teal: '#0F6E68', grey: '#9AA3AD' };
const SPEAK = [], CAMS = [];
// Light frame (default from 12 Nov 2026): background per scene; dark scenes get class "dk".
const LIGHT = (V.frame || 'light') === 'light';
const DEFBG = { hook: V.hookBg || 'ivory', strike: 'ivory', founder: 'navy', dialogue: 'sand', quiz: 'ivory', split: 'white', doc: 'white', end: 'navy' };
const bgOf = sc => !LIGHT ? 'none' : (sc.bg || (sc.type === 'draw' ? (sc.style === 'card' ? 'white' : 'sand') : DEFBG[sc.type]) || 'ivory');
const WA = `<svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#D6C29A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.5-4.3A8.5 8.5 0 1 1 20.5 11.6z"/><path d="M8.6 8.4c.2 2.9 2.2 5.4 5.4 6.6l1.2-1.3 1.9.9-.4 1.6c-3.6.4-8.4-3.6-8.7-7.3l1.5-.6.9 1.9z" fill="#D6C29A" stroke="none"/></svg>`;
let rnd = 7; const jit = (a) => { rnd = (rnd * 9301 + 49297) % 233280; return (rnd / 233280 - 0.5) * a; };

function drawSvg(sc, i) {
  const W = 806, H = sc.h || 440, pad = sc.data.length <= 3 ? 170 : 70, padB = 70, padT = 60, board = sc.style !== 'card';
  const ink = board ? '#13283D' : '#F6F2EA', lab = board ? 'HW' : 'RB', fs = board ? 40 : 30;
  const d = sc.data, n = d.length, t0 = T(i, sc.drawAt || 0, 0.3);
  const hi = Math.max(...d.map(x => x.v)), lo = sc.min ?? Math.min(0, ...d.map(x => x.v));
  const y = v => padT + (hi - v) / ((hi - lo) || 1) * (H - padT - padB);
  const x = k => n === 1 ? W / 2 : pad + k * (W - 2 * pad) / (n - 1);
  let g = `<path d="M${pad - 30} ${H - padB + 4} L${W - 10} ${H - padB + 2}" stroke="${board ? '#9AA3AD' : '#3A5470'}" stroke-width="${board ? 4 : 2}" fill="none" stroke-linecap="round"/>`;
  if (sc.kind === 'bars') {
    const bw = Math.min(130, (W - 2 * pad) / n * 0.6);
    d.forEach((p, k) => {
      const tk = (t0 + 0.3 * k).toFixed(2), top = y(p.v), bot = y(Math.max(lo, 0));
      g += `<rect class="grow" data-g="${tk}" style="transform-box:fill-box;transform-origin:center bottom" x="${x(k) - bw / 2}" y="${top}" width="${bw}" height="${bot - top}" rx="${board ? 6 : 4}" fill="${cols[p.color] || (board ? '#13283D' : '#B29A74')}" ${board ? 'stroke="#13283D" stroke-width="3"' : ''}/>`;
      g += `<text class="el nomove" data-in="${(+tk + 0.5).toFixed(2)}" x="${x(k)}" y="${top - 18}" text-anchor="middle" font-family="${lab}" font-weight="600" font-size="${fs + 4}" fill="${ink}">${p.d ?? p.v}</text>`;
    });
  } else {
    const pts = d.map((p, k) => [x(k), y(p.v)]);
    let dp = `M${pts[0][0]} ${pts[0][1]}`;
    for (let k = 1; k < n; k++) { const [ax, ay] = pts[k - 1], [bx, by] = pts[k]; dp += board ? ` Q${((ax + bx) / 2 + jit(10)).toFixed(1)} ${((ay + by) / 2 + jit(14)).toFixed(1)} ${bx} ${by}` : ` L${bx} ${by}`; }
    if (!board) g += `<path class="el nomove" data-in="${(t0 + 1.4).toFixed(2)}" d="${dp} L${pts[n - 1][0]} ${H - padB} L${pts[0][0]} ${H - padB} Z" fill="rgba(178,154,116,.18)"/>`;
    g += `<path class="drw" data-d="${t0}" data-dur="1.6" d="${dp}" fill="none" stroke="${board ? '#13283D' : '#D6C29A'}" stroke-width="${board ? 7 : 6}" stroke-linecap="round" stroke-linejoin="round"/>`;
    pts.forEach((p, k) => {
      const tk = (t0 + 1.6 * (k + 0.5) / n).toFixed(2), c = cols[d[k].color] || (board ? '#B29A74' : '#D6C29A');
      g += `<circle class="pop" data-pop="${tk}" style="transform-box:fill-box;transform-origin:center" cx="${p[0]}" cy="${p[1]}" r="12" fill="${c}"/>`;
      if (d[k].d) g += `<text class="el nomove" data-in="${tk}" x="${p[0]}" y="${p[1] - 26}" text-anchor="middle" font-family="${lab}" font-weight="600" font-size="${fs + 2}" fill="${ink}">${d[k].d}</text>`;
    });
  }
  d.forEach((p, k) => String(p.label).split('|').forEach((ln, j) => {
    g += `<text x="${x(k)}" y="${H - padB + 46 + j * 34}" text-anchor="middle" font-family="${lab}" font-weight="${board ? 600 : 400}" font-size="${board ? 36 : 28}" fill="${board ? '#3E4A57' : '#B8C2CC'}">${ln}</text>`;
  }));
  if (sc.note) {
    const k = sc.note.i ?? n - 1, tn = T(i, sc.note.at ?? 0, sc.note.dt ?? 2.2), tx = sc.note.x ?? 120, ty = sc.note.y ?? 60;
    const [px, py] = sc.kind === 'bars' ? [x(k), y(d[k].v) - 60] : [x(k) - 16, y(d[k].v) - 16];
    g += `<path class="drw" data-d="${tn}" data-dur="0.6" d="M${tx + 150} ${ty + 14} Q${(tx + 150 + px) / 2} ${ty - 30} ${px} ${py} M${px - 22} ${py - 6} L${px} ${py} L${px - 6} ${py - 24}" fill="none" stroke="${cols.red}" stroke-width="5" stroke-linecap="round"/>`;
    g += `<text class="el nomove" data-in="${tn}" x="${tx}" y="${ty}" font-family="HW" font-weight="600" font-size="46" fill="${cols.red}">${sc.note.text}</text>`;
  }
  return `<svg width="${W}" height="${H + 40}" viewBox="0 0 ${W} ${H + 40}" style="overflow:visible">${g}</svg>`;
}

// ---- scenes to HTML ----
const html = scenes.map((sc, i) => {
  let b = '';
  const nl = sc.lines.length;
  if (sc.type === 'hook') {
    if (V.episode) b += el('badge', i === 0 ? -1 : T(i, 0), `${V.episode.label} · ${V.episode.n} OF ${V.episode.of}`);
    b += kick(i, sc.kicker);
    const words = sc.head.split(/\s+/); let inEm = false;
    b += `<div class="h">` + words.map((w, k) => {
      const open = w.startsWith('*'), close = /\*[.,?!:]*$/.test(w); const raw = w.replace(/\*/g, '');
      const isEm = inEm || open; if (open && !close) inEm = true; if (close) inEm = false;
      const tw = i === 0 ? (k === 0 ? -1 : 0.06 + 0.11 * k) : T(i, 0, 0.08 * k);
      return `<span class="wd" data-w="${tw.toFixed(2)}">${isEm ? `<em>${raw}</em>` : raw}</span>`;
    }).join('') + `</div>`;
    if (sc.sub) b += el('sub', T(i, sc.subAt ?? Math.min(1, nl - 1), sc.subAt === undefined && nl === 1 ? 1.0 : 0), em(sc.sub));
  } else if (sc.type === 'strike') {
    b += kick(i, sc.kicker);
    if (sc.head) b += el('hm', T(i, 0, 0.1), em(sc.head));
    sc.items.forEach((it, k) => {
      const ti = T(i, it.at ?? k, it.dt ?? 0), ts = T(i, it.strikeAt ?? (it.at ?? k), it.strikeDt ?? 1.1);
      b += el('chip' + (k % 2 ? ' r' : ''), ti, `${it.t}${it.keep ? '' : `<div class="st" data-st="${ts}"></div>`}`);
    });
    if (sc.after) b += el('hm', T(i, sc.after.at, sc.after.dt || 0), em(sc.after.t), 'style="font-size:64px"');
  } else if (sc.type === 'founder') {
    const ph = sc.stat ? (LIGHT ? 430 : 500) : sc.bubble ? (LIGHT ? 420 : 470) : 560;
    b += kick(i, sc.kicker);
    // Owner, 12 Nov 2026: the founder appears ONLY as the real photo. No illustrated or AI avatar.
    if (sc.mode && sc.mode !== 'photo') throw new Error('founder scene: only mode "photo" is allowed (owner decision 12 Nov 2026)');
    const pic = `<div class="photo" style="height:${ph}px;width:${Math.round(ph * 0.92)}px;margin:0 auto"><img class="kb" data-kb="${T(i, 0)}" src="${FOUNDER_PHOTO}" alt="Muhammad Imran, ACMA, Founder and Managing Director of Valorin"></div>`;
    b += `<div class="el fwrap" data-in="${T(i, 0, 0.05)}" style="width:${Math.round(ph * 0.92)}px">${pic}`
      + `<div class="el plate" data-in="${T(i, 0, 0.5)}"><b>${FOUNDER.name}</b><span>${FOUNDER.role}</span></div></div>`;
    if (sc.stat) b += `<div class="el stat" data-in="${T(i, sc.stat.at ?? 1)}"><div class="n">${FOUNDER.years}</div><div class="l">${FOUNDER.yearsL}</div></div>`;
    if (sc.bubble) b += `<div class="bub pop" data-pop="${T(i, sc.bubble.at ?? 1)}" style="transform-origin:50% 0">${em(sc.bubble.t)}</div>`;
  } else if (sc.type === 'dialogue') {
    const keys = Object.keys(CAST);
    b += el('tag', T(i, 0), sc.tag || 'ILLUSTRATIVE CONVERSATION');
    b += `<div class="el cast" data-in="${T(i, 0)}">` + keys.map(k => `<div class="who">${genericSvg(CAST[k].fig, 210, k)}<div class="nm">${CAST[k].name}</div></div>`).join('') + `</div>`;
    b += `<div class="msgs">` + sc.lines.map((l, k) => {
      SPEAK.push({ s: T(i, k), e: speechEnd(i, k), who: l.who });
      const side = keys.indexOf(l.who) === 0 ? 'a' : 'b';
      const outT = k + 2 < nl ? `data-out="${T(i, k + 2)}"` : '';
      return `<div class="msg ${side} pop" data-pop="${T(i, k)}" style="transform-origin:${side === 'a' ? '0' : '100%'} 100%" ${outT}>${em(l.bubble || l.cap || l.say)}</div>`;
    }).join('') + `</div>`;
  } else if (sc.type === 'quiz') {
    b += kick(i, sc.kicker || 'QUICK QUIZ');
    b += el('q', T(i, 0, 0.1), em(sc.q));
    const rv = T(i, sc.revealAt);
    sc.options.forEach((o, k) => {
      const ok = k === sc.answer;
      b += el('opt', T(i, sc.optsAt ?? 1, 0.25 * k), `<div class="L">${'ABCD'[k]}</div><div>${o}</div>`, ok ? `data-ok="${rv}"` : `data-dim="${rv}"`);
    });
    const pl = sc.pauseAt ?? (sc.revealAt - 1), a = speechEnd(i, pl), z = +(LS[FIRST[i] + pl + 1]).toFixed(2);
    b += `<div class="el timer" data-in="${a}" data-out="${rv}"><svg width="96" height="96" viewBox="0 0 96 96"><circle cx="48" cy="48" r="40" fill="none" stroke="#E6DFD2" stroke-width="8"/><circle class="ring" data-a="${a}" data-b="${z}" cx="48" cy="48" r="40" fill="none" stroke="#B29A74" stroke-width="8" stroke-linecap="round" transform="rotate(-90 48 48)" stroke-dasharray="251.3"/><text class="cd" x="48" y="62" text-anchor="middle" font-family="RC" font-weight="700" font-size="40" fill="#13283D">3</text></svg><div class="t">COMMENT YOUR ANSWER</div></div>`;
    if (sc.explain) b += el('sub', T(i, sc.explain.at, sc.explain.dt || 0), em(sc.explain.t), 'style="font-weight:500;color:var(--navy)"');
  } else if (sc.type === 'split') {
    b += kick(i, sc.kicker);
    const ts = T(i, sc.strikeAt ?? 1);
    b += el('half m', T(i, 0), `<div class="pill" style="background:var(--navy)">${sc.topLabel || 'THE BELIEF'}</div><div class="tx">${em(sc.myth)}${sc.noStrike ? '' : `<div class="st" data-st="${ts}"></div>`}</div>`
      + `<div class="pop" data-pop="${ts}" style="position:absolute;right:40px;top:26px;transform-origin:center"><div style="transform:rotate(-8deg);border:5px solid ${sc.verdictColor === 'teal' ? 'var(--teal)' : 'var(--red)'};color:${sc.verdictColor === 'teal' ? 'var(--teal)' : 'var(--red)'};font-family:RC;font-weight:700;font-size:${(sc.verdict || 'MYTH').length > 6 ? 34 : 50}px;letter-spacing:.12em;padding:4px 20px;border-radius:10px">${sc.verdict || 'MYTH'}</div></div>`, 'style="position:relative"');
    b += el('half f', T(i, sc.factAt ?? 1, 0.3), `<div class="pill" style="background:var(--teal)">${sc.factLabel || "WHAT'S TRUE"}</div><div class="tx">${em(sc.fact)}</div>${sc.src ? `<div class="src">${sc.src}</div>` : ''}`);
  } else if (sc.type === 'doc') {
    b += kick(i, sc.kicker);
    if (sc.head) b += el('hm', T(i, 0, 0.1), em(sc.head), 'style="font-size:62px"');
    const camId = 'cam' + i;
    const docs = sc.docs.map((d, di) => `<div class="doc"><div class="dt">${d.title}</div><div class="ds">${d.sub || ''}</div>` + d.rows.map((r, ri) => {
      const f = (sc.focus || []).find(f => f.doc === di && f.row === ri);
      return `<div class="row" id="r${i}_${di}_${ri}" ${f ? `data-hl="${T(i, f.at, (f.dt || 0) + 0.5)}" data-hlc="${f.cls || 'hit'}"` : ''}><span>${r[0]}</span><b>${r[1]}</b></div>`;
    }).join('') + `</div>`).join('');
    b += `<div class="el view" data-in="${T(i, 0, 0.2)}" style="height:${sc.viewH || 520}px"><div class="cam" id="${camId}">${docs}</div></div>`;
    CAMS.push({ cam: camId, focus: [{ overview: true, at: -1 }].concat((sc.focus || []).map(f => f.overview ? { overview: true, at: T(i, f.at, f.dt || 0) } : { at: T(i, f.at, f.dt || 0), row: `r${i}_${f.doc}_${f.row}`, scale: f.scale, dy: f.dy })) });
    const notes = (sc.focus || []).filter(f => f.note);
    notes.forEach((f, k) => {
      const nx = notes[k + 1]; b += el('note' + (f.cls === 'good' ? ' good' : ''), T(i, f.at, (f.dt || 0) + 0.6), f.note, nx ? `data-out="${T(i, nx.at, (nx.dt || 0) + 0.6)}"` : '');
    });
    if (sc.src) b += el('src', T(i, 0, 1), sc.src);
  } else if (sc.type === 'draw') {
    b += kick(i, sc.kicker);
    if (sc.head) b += el('hm', T(i, 0, 0.1), em(sc.head), 'style="font-size:64px"');
    b += `<div class="el board${sc.style === 'card' ? ' card' : ''}" data-in="${T(i, 0, 0.2)}">${drawSvg(sc, i)}</div>`;
    if (sc.after) b += el('sub', T(i, sc.after.at, sc.after.dt || 0), em(sc.after.t), 'style="font-weight:500;color:var(--navy)"');
    if (sc.src) b += el('src', T(i, 0, 1.2), sc.src);
  } else if (sc.type === 'end') {
    if (LIGHT) b += el('sig', T(i, 0), `<img src="${bgOf(sc) === 'navy' ? 'valorin_logo_light.png' : 'valorin_logo.png'}" alt="Valorin, Finance | Tax | Advisory"><div class="tg">Finance with Integrity. Growth with Insight.</div>`);
    b += kick(i, sc.h);
    b += el('h', T(i, 0, 0.05), em(sc.q), 'style="font-size:88px"');
    b += `<div class="wa pop" data-pop="${T(i, sc.waAt ?? Math.min(1, nl - 1), sc.waAt === undefined && nl === 1 ? 0.8 : 0)}" style="transform-origin:0 50%">${WA}<span>WhatsApp 058-2754282</span></div>`;
    b += el('mail', T(i, 0, 1.1), LIGHT ? 'advisory@valorin.ae · www.valorin.ae · Dubai, UAE' : 'advisory@valorin.ae · www.valorin.ae');
    if (V.episode && V.episode.next) b += el('next', T(i, 0, 1.3), `NEXT · ${V.episode.next}`);
    b += el('src', T(i, 0, 1.4), sc.disc);
  } else throw new Error('unknown scene type ' + sc.type);
  const lines = sc.lines.map((_, k) => T(i, k)).join(',');
  const dk = (bgOf(sc) === 'navy' ? ' dk' : '') + (sc.type === 'end' ? ' endc' : '');
  return `<div class="scene${dk}" data-s="${SS[i].toFixed(2)}" data-e="${SS[i + 1].toFixed(2)}" data-lines="${lines}"${i === scenes.length - 1 ? ' data-last="1"' : ''}>${b}</div>`;
}).join('\n');

// ---- word-by-word captions ----
const WORDS = []; let C = 0;
LINES.forEach((l, k) => {
  const sc = scenes[l.scene];
  if (l.nocap || (sc.type === 'dialogue' && l.nocap !== false) || V.burnCaptions === false) return;
  let inKey = false;
  const toks = String(l.cap || l.say).split(/\s+/).filter(Boolean).map(w => {
    const open = w.startsWith('*'), close = /\*[.,?!:;]*$/.test(w); const key = inKey || open;
    if (open && !close) inKey = true; if (close) inKey = false;
    return { w: w.replace(/\*/g, ''), key };
  });
  const wt = toks.map(x => x.w.length + 2 + (/[,;:]$/.test(x.w) ? 4 : 0) + (/[.?!]$/.test(x.w) ? 6 : 0));
  const tot = wt.reduce((a, b) => a + b, 0), s0 = LS[k] + LEAD, span = SPEECH[k];
  let acc = 0; const timed = toks.map((x, j) => { const s = s0 + span * acc / tot; acc += wt[j]; return Object.assign({ s: +s.toFixed(3) }, x); });
  let chunk = [];
  const flush = (endT) => { if (!chunk.length) return; const c = C++; const ch = chunk.map(x => ({ w: x.w, key: x.key }));
    chunk.forEach((x, j) => WORDS.push({ c, s: x.s, cs: chunk[0].s, ce: +endT.toFixed(3), chunk: ch })); chunk = []; };
  timed.forEach((x, j) => {
    chunk.push(x);
    const len = chunk.reduce((a, y) => a + y.w.length + 1, 0);
    if (j === timed.length - 1) flush(Math.min(s0 + span + 0.25, LS[k + 1]));
    else if (/[.?!,;:]$/.test(x.w) || chunk.length >= 4 || len > 20) flush(timed[j + 1].s);
  });
});

const sb = LIGHT ? 580 : 400, st = LIGHT ? 270 : 250;
const safe = process.env.SAFE ? `<div class="safe" style="left:0;right:0;top:0;height:${st}px"></div><div class="safe" style="left:0;right:0;bottom:0;height:${sb}px"></div><div class="safe" style="right:0;top:${st}px;bottom:${sb}px;width:150px"></div>` : '';
const page = fs.readFileSync(path.join(__dirname, 'shorts.html'), 'utf8')
  .replace('{{SCENES}}', html).replace('{{FRAMECLS}}', LIGHT ? ' light' : '').replace('{{BGS}}', LIGHT ? scenes.map((sc, i) => `<div class="bgl ${bgOf(sc)}" data-s="${SS[i].toFixed(2)}" data-e="${SS[i + 1].toFixed(2)}"></div>`).join('') : '').replace('{{AI}}', V.aiAvatar ? '<div class="ai">AI AVATAR</div>' : '').replace('{{SAFE}}', safe)
  .replace('{{TOTAL}}', TOTAL.toFixed(2)).replace('{{WORDS}}', JSON.stringify(WORDS)).replace('{{ENV}}', JSON.stringify(ENV))
  .replace('{{FPS}}', FPS).replace('{{SPEAK}}', JSON.stringify(SPEAK)).replace('{{CAMS}}', JSON.stringify(CAMS));
const tmp = path.join(__dirname, '_shorts_filled.html');
fs.writeFileSync(tmp, page);

if (srtOut) {
  const ts = x => { const ms = Math.round(x * 1000); return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
  fs.writeFileSync(srtOut, LINES.map((l, k) => `${k + 1}\n${ts(LS[k] + LEAD)} --> ${ts(LS[k] + LEAD + SPEECH[k] + 0.1)}\n${String(l.cap || l.say).replace(/\*/g, '')}\n`).join('\n'));
}

const exe = ['/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', process.env.PW_CHROMIUM].filter(Boolean).find(p => fs.existsSync(p));
const framesDir = path.join(__dirname, '_frames2');
fs.rmSync(framesDir, { recursive: true, force: true }); fs.mkdirSync(framesDir);
(async () => {
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.goto('file://' + tmp);
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(300);
  const over = await pg.evaluate(() => [...document.querySelectorAll('.scene')].map((s, i) => { s.style.visibility = 'visible'; const o = s.scrollHeight > s.clientHeight + 1; return o ? i : -1; }).filter(i => i >= 0));
  if (over.length) console.warn('WARNING: scene overflow in scenes', over.join(','));
  const starts = LS.slice(0, -1).map(x => +x.toFixed(2));
  console.log('total', TOTAL.toFixed(1), 's · line starts', starts.join(' '));
  if (process.env.PREVIEW) {
    const pts = process.env.PREVIEW === 'auto' ? [0, 1.2].concat(LS.slice(1, -1).map((x, k) => +(x + Math.min(1.6, DUR[k + 1] * 0.8)).toFixed(2))) : process.env.PREVIEW.split(',').map(Number);
    for (const x of pts) { await pg.evaluate(t => window.renderAt(t), x); await pg.screenshot({ path: path.join(path.dirname(out), `prev_${x}.jpg`), type: 'jpeg', quality: 80 }); }
    await browser.close(); process.exit(0);
  }
  const n = Math.round(FPS * TOTAL);
  for (let f = 0; f < n; f++) {
    await pg.evaluate(t => window.renderAt(t), f / FPS);
    await pg.screenshot({ path: path.join(framesDir, `f${String(f).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 90 });
  }
  await browser.close();
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(framesDir, 'f%04d.jpg'), '-i', audioWav,
    '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-shortest', '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-crf', '20',
    '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-movflags', '+faststart', out]);
  fs.rmSync(framesDir, { recursive: true, force: true }); fs.rmSync(tmp, { force: true });
  console.log('saved', out, TOTAL.toFixed(1) + 's');
})();
