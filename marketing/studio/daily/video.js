// Brand video (1080x1920) in the premium white style, George voice, original music bed.
// Usage: node video.js posts/<id>.json <out.mp4> [captions.srt]
// Scenes come from post.video.scenes; each has a "type" and a "say" (voiceover text for that scene).
// Types: hook {kicker, sub?, head} · figure {kicker, n, unit?, desc, src} · points {items:[{k,n,l,color?}]}
//        steps {kicker, items:[{t,small}]} · cta {h, b, a, disc}
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const post = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = path.resolve(process.argv[3] || 'video.mp4');
const srtOut = process.argv[4] ? path.resolve(process.argv[4]) : null;
const FPS = 30;
const V = post.video;
const voiceModel = V.voiceModel || 'kokoro:/tmp/kokoro';
const voiceSpeaker = V.voiceSpeaker || 'bm_george@0.85';
const scenes = V.scenes;

// ---- voice and timing ----
const audioDir = path.join(__dirname, '_audio');
fs.rmSync(audioDir, { recursive: true, force: true });
fs.mkdirSync(audioDir);
fs.writeFileSync(path.join(audioDir, 'segments.json'), JSON.stringify(scenes.map(s => s.say)));
execFileSync('python3', [path.join(__dirname, 'audio.py'), 'voice', voiceModel, voiceSpeaker,
  path.join(audioDir, 'segments.json'), audioDir], { stdio: 'inherit' });
const durs = JSON.parse(fs.readFileSync(path.join(audioDir, 'timing.json'), 'utf8')).durations.slice();
durs[durs.length - 1] += 2.0;                     // hold the call to action
const B = [0]; for (const d of durs) B.push(B[B.length - 1] + d);
const TOTAL = B[B.length - 1];
const audioWav = path.join(audioDir, 'mix.wav');
execFileSync('python3', [path.join(__dirname, 'audio.py'), 'mix', audioDir, String(TOTAL), audioWav], { stdio: 'inherit' });


// ---- chart and illustration helpers (added 29 Oct 2026) ----
// chart: {kind:'bar'|'waterfall'|'line', data:[{label, v, d?, color?, total?}], kicker?, head?, note?, src?}
// Bars grow from the baseline; a line draws left to right; value labels fade in after.
function chartSvg(sc, t0) {
  const W = 898, H = sc.h || (sc.head && (sc.note || sc.src) ? 430 : 600), padB = 90, padT = 70, data = sc.data, n = data.length;
  const cols = { navy: '#13283D', gold: '#B29A74', red: '#B3261E', teal: '#0F6E68', grey: '#9AA3AD' };
  let lo = 0, hi = 0, run = 0; const seg = [];
  data.forEach(d => {
    if (sc.kind === 'waterfall') {
      if (d.total) { seg.push([0, d.v]); run = d.v; } else { seg.push([run, run + d.v]); run += d.v; }
    } else seg.push([0, d.v]);
  });
  seg.forEach(([a, b]) => { lo = Math.min(lo, a, b); hi = Math.max(hi, a, b); });
  const y = v => padT + (hi - v) / ((hi - lo) || 1) * (H - padT - padB);
  const slot = W / n, bw = Math.min(150, slot * 0.62);
  let g = `<line x1="0" x2="${W}" y1="${y(0)}" y2="${y(0)}" stroke="#C9C1B2" stroke-width="2"/>`;
  if (sc.kind === 'line') {
    const pts = data.map((d, k) => [slot * k + slot / 2, y(d.v)]);
    const dpath = pts.map((p, k) => (k ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    g += `<path class="gl" data-in="${t0}" d="${dpath}" fill="none" stroke="${cols[sc.color] || cols.navy}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>`;
    pts.forEach((p, k) => {
      const tk = (t0 + 1.0 * (k + 1) / n).toFixed(2), d = data[k];
      g += `<circle class="gf" data-in="${tk}" cx="${p[0]}" cy="${p[1]}" r="13" fill="${cols[d.color] || cols.gold}"/>`
        + `<text class="gf" data-in="${tk}" x="${p[0]}" y="${p[1] - 30}" text-anchor="middle" font-family="RB" font-weight="500" font-size="38" fill="#13283D">${d.d ?? d.v}</text>`;
    });
  } else {
    seg.forEach(([a, b], k) => {
      const d = data[k], x = slot * k + (slot - bw) / 2, top = y(Math.max(a, b)), bot = y(Math.min(a, b));
      const color = cols[d.color] || (sc.kind === 'waterfall' ? (d.total ? cols.navy : (d.v < 0 ? cols.red : cols.teal)) : cols.navy);
      const grows = sc.kind === 'waterfall' && !d.total && d.v < 0 ? 'top' : 'bottom';
      const tk = (t0 + 0.35 * k).toFixed(2);
      g += `<rect class="gb" data-in="${tk}" style="transform-box:fill-box;transform-origin:center ${grows}" x="${x}" y="${top}" width="${bw}" height="${Math.max(2, bot - top)}" rx="4" fill="${color}"/>`;
      if (sc.kind === 'waterfall' && k < n - 1) {
        const lvl = y(b);
        g += `<line class="gf" data-in="${(+tk + 0.5).toFixed(2)}" x1="${x + bw}" x2="${x + slot}" y1="${lvl}" y2="${lvl}" stroke="#9AA3AD" stroke-width="2" stroke-dasharray="6 6"/>`;
      }
      g += `<text class="gf" data-in="${(+tk + 0.55).toFixed(2)}" x="${x + bw / 2}" y="${top - 18}" text-anchor="middle" font-family="RB" font-weight="500" font-size="38" fill="#13283D">${d.d ?? d.v}</text>`;
    });
  }
  data.forEach((d, k) => {
    const lines = String(d.label).split('|');
    lines.forEach((ln, j) => {
      g += `<text x="${slot * k + slot / 2}" y="${H - padB + 44 + j * 34}" text-anchor="middle" font-family="RB" font-size="30" fill="#3E4A57">${ln}</text>`;
    });
  });
  return `<svg width="${W}" height="${H + 30}" viewBox="0 0 ${W} ${H + 30}" style="overflow:visible">${g}</svg>`;
}

// persona: a flat illustrated figure at a desk (generic, not a real person), optional speech bubble
function personaSvg(sc) {
  const skin = '#C99B7A', hair = '#2B2420', shirt = sc.shirt === 'gold' ? '#B29A74' : '#13283D';
  return `<svg width="760" height="398" viewBox="0 0 898 470">
    <rect x="40" y="380" width="818" height="18" rx="6" fill="#13283D"/>
    <rect x="110" y="398" width="16" height="72" fill="#13283D"/><rect x="772" y="398" width="16" height="72" fill="#13283D"/>
    <circle cx="300" cy="150" r="62" fill="${skin}"/>
    <path d="M238 140 q8-78 62-80 q60 2 64 76 q-14-36-64-38 q-46 2-62 42z" fill="${hair}"/>
    <path d="M190 380 q0-150 110-158 q110 8 110 158z" fill="${shirt}"/>
    <path d="M282 222 l18 34 l18-34z" fill="#fff"/>
    <rect x="420" y="250" width="250" height="130" rx="10" fill="#E6DFD2" stroke="#13283D" stroke-width="5"/>
    <rect x="400" y="372" width="290" height="14" rx="5" fill="#13283D"/>
    <rect x="450" y="320" width="26" height="40" fill="#0F6E68"/><rect x="488" y="300" width="26" height="60" fill="#B29A74"/>
    <rect x="526" y="285" width="26" height="75" fill="#13283D"/><rect x="564" y="305" width="26" height="55" fill="#B3261E"/>
    <rect x="602" y="275" width="26" height="85" fill="#0F6E68"/>
    <rect x="700" y="330" width="56" height="50" rx="6" fill="#fff" stroke="#B29A74" stroke-width="5"/>
    <path d="M756 342 q22 0 22 16 q0 16-22 16" fill="none" stroke="#B29A74" stroke-width="5"/>
  </svg>`;
}


// ---- showcase helpers (sample, 29 Oct 2026) ----
// gantt: {rows:[{label, from, to, color, d}], gap:{from,to,label}, max, ticks:[...]} days on a shared axis
function ganttSvg(sc, t0) {
  const W = 898, max = sc.max || 140, x = v => 10 + v / max * (W - 20);
  const cols = { navy: '#13283D', gold: '#B29A74', red: '#B3261E', teal: '#0F6E68' };
  let g = '', yy = 20;
  sc.rows.forEach((r, k) => {
    const tk = (t0 + 0.9 * k).toFixed(2);
    g += `<text class="gf" data-in="${tk}" x="${x(r.from)}" y="${yy + 30}" font-family="RB" font-weight="500" font-size="34" fill="#3E4A57">${r.label}</text>`;
    g += `<rect class="gx" data-in="${tk}" style="transform-box:fill-box;transform-origin:left center" x="${x(r.from)}" y="${yy + 48}" width="${x(r.to) - x(r.from)}" height="58" rx="8" fill="${cols[r.color] || cols.navy}"/>`;
    g += `<text class="gf" data-in="${(+tk + 0.6).toFixed(2)}" x="${x(r.to) - 18}" y="${yy + 89}" text-anchor="end" font-family="RB" font-weight="500" font-size="34" fill="#fff">${r.d}</text>`;
    yy += 122;
  });
  // axis
  const ay = yy + 10;
  g += `<line x1="${x(0)}" x2="${x(max)}" y1="${ay}" y2="${ay}" stroke="#C9C1B2" stroke-width="2"/>`;
  (sc.ticks || []).forEach(v => {
    g += `<line x1="${x(v)}" x2="${x(v)}" y1="${ay - 8}" y2="${ay + 8}" stroke="#9AA3AD" stroke-width="2"/>`
      + `<text x="${x(v)}" y="${ay + 40}" text-anchor="middle" font-family="RB" font-size="26" fill="#6A6F76">${v}</text>`;
  });
  if (sc.gap) {
    const tg = (t0 + 0.9 * sc.rows.length + 0.3).toFixed(2), gy = ay + 80;
    g += `<rect class="gf" data-in="${tg}" x="${x(sc.gap.from)}" y="0" width="${x(sc.gap.to) - x(sc.gap.from)}" height="${ay}" fill="#B3261E" fill-opacity="0.07"/>`;
    g += `<path class="gx" data-in="${tg}" style="transform-box:fill-box;transform-origin:left center" d="M${x(sc.gap.from)} ${gy} v-18 M${x(sc.gap.from)} ${gy} H${x(sc.gap.to)} v-18" fill="none" stroke="#B3261E" stroke-width="5"/>`;
    g += `<text class="gf" data-in="${(+tg + 0.5).toFixed(2)}" x="${(x(sc.gap.from) + x(sc.gap.to)) / 2}" y="${gy + 52}" text-anchor="middle" font-family="RB" font-weight="500" font-size="40" fill="#B3261E">${sc.gap.label}</text>`;
    yy = gy + 70;
  }
  return `<svg width="${W}" height="${yy}" viewBox="0 0 ${W} ${yy}" style="overflow:visible">${g}</svg>`;
}

// compare: horizontal bars {bars:[{label, v, d, color}], max}
function compareSvg(sc, t0) {
  const W = 898, max = sc.max || Math.max(...sc.bars.map(b => b.v));
  const cols = { navy: '#13283D', gold: '#B29A74', red: '#B3261E', teal: '#0F6E68' };
  let g = '', yy = 0;
  sc.bars.forEach((b, k) => {
    const tk = (t0 + 0.7 * k).toFixed(2), w = b.v / max * (W - 170);
    g += `<text x="0" y="${yy + 34}" font-family="RB" font-size="32" fill="#3E4A57">${b.label}</text>`;
    g += `<rect class="gx" data-in="${tk}" style="transform-box:fill-box;transform-origin:left center" x="0" y="${yy + 50}" width="${w}" height="64" rx="8" fill="${cols[b.color] || cols.navy}"/>`;
    g += `<text class="gf" data-in="${(+tk + 0.6).toFixed(2)}" x="${w + 20}" y="${yy + 96}" font-family="RB" font-weight="500" font-size="44" fill="#13283D">${b.d}</text>`;
    yy += 150;
  });
  return `<svg width="${W}" height="${yy}" viewBox="0 0 ${W} ${yy}" style="overflow:visible">${g}</svg>`;
}

// animated persona: generic illustrated figure (not a real person), blinking, monitor bars rise
function personaAnimSvg(sc, t0) {
  const skin = '#C99B7A', hair = '#2B2420', shirt = sc.shirt === 'gold' ? '#B29A74' : '#13283D';
  const bars = [[450, 40, '#0F6E68'], [488, 60, '#B29A74'], [526, 75, '#13283D'], [564, 55, '#B3261E'], [602, 85, '#0F6E68']];
  const b = bars.map(([x, h, c], k) => `<rect class="gb" data-in="${(t0 + 0.25 * k).toFixed(2)}" style="transform-box:fill-box;transform-origin:center bottom" x="${x}" y="${360 - h}" width="26" height="${h}" fill="${c}"/>`).join('');
  return `<svg width="760" height="398" viewBox="0 0 898 470">
    <rect x="40" y="380" width="818" height="18" rx="6" fill="#13283D"/>
    <rect x="110" y="398" width="16" height="72" fill="#13283D"/><rect x="772" y="398" width="16" height="72" fill="#13283D"/>
    <g class="bob">
    <circle cx="300" cy="150" r="62" fill="${skin}"/>
    <path d="M238 140 q8-78 62-80 q60 2 64 76 q-14-36-64-38 q-46 2-62 42z" fill="${hair}"/>
    <g class="eyes" style="transform-box:fill-box;transform-origin:center"><ellipse cx="280" cy="158" rx="6" ry="8" fill="#2B2420"/><ellipse cx="322" cy="158" rx="6" ry="8" fill="#2B2420"/></g>
    <path d="M286 186 q15 8 30 0" fill="none" stroke="#7A4E38" stroke-width="4" stroke-linecap="round"/>
    <path d="M190 380 q0-150 110-158 q110 8 110 158z" fill="${shirt}"/>
    <path d="M282 222 l18 34 l18-34z" fill="#fff"/>
    </g>
    <rect x="420" y="250" width="250" height="130" rx="10" fill="#E6DFD2" stroke="#13283D" stroke-width="5"/>
    <rect x="400" y="372" width="290" height="14" rx="5" fill="#13283D"/>
    ${b}
    <rect x="700" y="330" width="56" height="50" rx="6" fill="#fff" stroke="#B29A74" stroke-width="5"/>
    <path d="M756 342 q22 0 22 16 q0 16-22 16" fill="none" stroke="#B29A74" stroke-width="5"/>
    <text class="qm" data-in="${(t0 + 1.6).toFixed(2)}" x="392" y="96" font-family="RB" font-weight="500" font-size="96" fill="#B29A74">?</text>
  </svg>`;
}

// ---- scenes to HTML ----
const counters = [];
const at = (s, k) => (B[s] + 0.2 + k * 0.45).toFixed(2);
const colors = ['var(--teal)', 'var(--gold)', 'var(--navy)', 'var(--red)'];
const html = scenes.map((sc, i) => {
  const last = i === scenes.length - 1 ? ' data-last="1"' : '';
  let body = '';
  if (sc.type === 'hook') {
    body = `<div class="el k c" data-in="${at(i, 0)}">${sc.kicker}</div><div class="el rl" data-in="${at(i, 0)}"></div>`
      + `<div class="el h1" data-in="${at(i, 1)}">${sc.head}</div>`
      + (sc.sub ? `<div class="el sub" data-in="${at(i, 2)}">${sc.sub}</div>` : '');
  } else if (sc.type === 'figure') {
    const numeric = /^[0-9,]+$/.test(String(sc.n));
    const id = 'cnt' + i;
    if (numeric) counters.push({ id, target: +String(sc.n).replace(/,/g, ''), at: +at(i, 1) });
    body = `<div class="el k c" data-in="${at(i, 0)}">${sc.kicker}</div>`
      + `<div class="el num c" data-in="${at(i, 1)}" ${numeric ? `id="${id}"` : ''}>${numeric ? '0' : sc.n}${sc.unit ? `<small>${sc.unit}</small>` : ''}</div>`
      + `<div class="el desc" data-in="${at(i, 3)}">${sc.desc}</div>`
      + (sc.src ? `<div class="el disc" data-in="${at(i, 4)}">${sc.src}</div>` : '');
  } else if (sc.type === 'points') {
    body = sc.items.map((p, k) => `<div class="el stat c" style="--cc:${p.color || colors[k % 3]}" data-in="${at(i, k * 1.6)}"><div class="k2">${p.k}</div><div class="n">${p.n}</div>${p.l ? `<div class="l">${p.l}</div>` : ''}</div>`).join('');
  } else if (sc.type === 'steps') {
    body = `<div class="el k c" data-in="${at(i, 0)}">${sc.kicker}</div>`
      + sc.items.map((p, k) => `<div class="el svc c" data-in="${at(i, 1 + k)}"><div class="i">${k + 1}</div><div class="t">${p.t}<small>${p.small}</small></div></div>`).join('');
  } else if (sc.type === 'cta') {
    body = (sc.q ? `<div class="el ch" data-in="${at(i, 0)}">${sc.q}</div>` : '') + `<div class="el cta c" data-in="${at(i, sc.q ? 0.6 : 0)}"><div class="h">${sc.h}</div><div class="b">${sc.b}</div><div class="a">${sc.a}</div></div>`
      + `<div class="el disc" data-in="${at(i, 1)}">${sc.disc}</div>`;
  } else if (sc.type === 'chart') {
    body = (sc.kicker ? `<div class="el k c" data-in="${at(i, 0)}">${sc.kicker}</div>` : '')
      + (sc.head ? `<div class="el ch" data-in="${at(i, 0.5)}">${sc.head}</div>` : '')
      + `<div class="el" data-in="${at(i, 1)}" data-still="1">${chartSvg(sc, +at(i, 1.4))}</div>`
      + (sc.note ? `<div class="el cn" data-in="${at(i, 4)}">${sc.note}</div>` : '')
      + (sc.src ? `<div class="el disc" data-in="${at(i, 4.5)}">${sc.src}</div>` : '');
  } else if (sc.type === 'persona') {
    body = (sc.kicker ? `<div class="el k c" data-in="${at(i, 0)}">${sc.kicker}</div>` : '')
      + `<div class="el" data-in="${at(i, 0.5)}" data-still="1">${personaSvg(sc)}</div>`
      + (sc.bubble ? `<div class="el bub" data-in="${at(i, 1.5)}">${sc.bubble}</div>` : '')
      + (sc.caption ? `<div class="el sub" data-in="${at(i, 2.5)}">${sc.caption}</div>` : '');
  } else if (sc.type === 'gantt') {
    body = (sc.kicker ? `<div class="el k c" data-in="${at(i, 0)}">${sc.kicker}</div>` : '')
      + (sc.head ? `<div class="el ch" data-in="${at(i, 0.4)}">${sc.head}</div>` : '')
      + `<div class="el" data-in="${at(i, 0.8)}" data-still="1">${ganttSvg(sc, +at(i, 1.1))}</div>`
      + (sc.src ? `<div class="el disc" data-in="${at(i, 1)}">${sc.src}</div>` : '');
  } else if (sc.type === 'impact') {
    const id = 'imp' + i;
    counters.push({ id, target: sc.n, at: +at(i, 3.2), dec: sc.dec || 0 });
    body = (sc.kicker ? `<div class="el k c" data-in="${at(i, 0)}">${sc.kicker}</div>` : '')
      + `<div class="el" data-in="${at(i, 0.4)}" data-still="1">${compareSvg(sc, +at(i, 0.8))}</div>`
      + `<div class="el num c" data-in="${at(i, 3.2)}" style="font-size:200px">${sc.pre || ''}<span id="${id}">0</span><small>${sc.unit || ''}</small></div>`
      + `<div class="el desc" data-in="${at(i, 3.8)}" style="font-size:44px">${sc.desc}</div>`
      + (sc.src ? `<div class="el disc" data-in="${at(i, 4.2)}">${sc.src}</div>` : '');
  } else if (sc.type === 'personaAnim') {
    body = (sc.kicker ? `<div class="el k c" data-in="${at(i, 0)}">${sc.kicker}</div>` : '')
      + `<div class="el" data-in="${at(i, 0.3)}" data-still="1">${personaAnimSvg(sc, +at(i, 0.6))}</div>`
      + (sc.bubble ? `<div class="el bub pop" data-in="${at(i, 1.4)}">${sc.bubble}</div>` : '')
      + (sc.caption ? `<div class="el sub" data-in="${at(i, 2.4)}">${sc.caption}</div>` : '');
  } else throw new Error('unknown scene type ' + sc.type);
  return `<div class="scene" data-s="${B[i].toFixed(2)}" data-e="${B[i + 1].toFixed(2)}"${last}>${body}</div>`;
}).join('\n');

const realD = JSON.parse(fs.readFileSync(path.join(audioDir, 'timing.json'), 'utf8')).durations;
const CUES = [];
scenes.forEach((sc, i) => {
  const parts = sc.say.match(/.+?[.!?](?=\s+[A-Z]|\s*$)/g) || [sc.say];
  const start = B[i] + 0.15, span = realD[i] - 0.3, tot = parts.reduce((a, p) => a + p.length, 0);
  let t = start;
  parts.forEach((p, j) => { const d = span * p.length / tot; CUES.push({ s: +t.toFixed(2), e: +(t + d).toFixed(2), t: (sc.cap && sc.cap[j]) || p.trim() }); t += d; });
});
let page = fs.readFileSync(path.join(__dirname, 'video.html'), 'utf8')
  .replace('{{SCENES}}', html).replace('{{TOTAL}}', TOTAL.toFixed(2)).replace('{{COUNTERS}}', JSON.stringify(counters)).replace('{{CUES}}', JSON.stringify(V.burnCaptions === false ? [] : CUES));
const tmp = path.join(__dirname, '_video_filled.html');
fs.writeFileSync(tmp, page);

// ---- captions file (.srt): each scene's sentences spread over its spoken time ----
if (srtOut) {
  const ts = (x) => { const ms = Math.round(x * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
  const lines = []; let n = 1;
  const real = JSON.parse(fs.readFileSync(path.join(audioDir, 'timing.json'), 'utf8')).durations;
  scenes.forEach((sc, i) => {
    const text = sc.caption || sc.say;
    const parts = text.match(/[^.!?]+[.!?]+/g) || [text];
    const start = B[i] + 0.25, span = real[i] - 0.7;
    const tot = parts.reduce((a, p) => a + p.length, 0);
    let t = start;
    for (const p of parts) { const d = span * p.length / tot; lines.push(`${n++}\n${ts(t)} --> ${ts(t + d)}\n${p.trim()}\n`); t += d; }
  });
  fs.writeFileSync(srtOut, lines.join('\n'));
}

const framesDir = path.join(__dirname, '_frames');
fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir);
(async () => {
  const browser = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell') ? { executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' } : { executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.goto('file://' + tmp);
  await pg.evaluate(() => document.fonts.ready);
  const over = await pg.evaluate(() => [...document.querySelectorAll('.scene')].map((s, i) => s.scrollHeight > s.clientHeight + 1 ? i : -1).filter(i => i >= 0));
  if (over.length) console.warn('WARNING: scene overflow in scenes', over.join(','));
  if (process.env.PREVIEW) {
    for (const x of process.env.PREVIEW.split(',')) { await pg.evaluate((t) => window.renderAt(t), +x); await pg.screenshot({ path: path.join(path.dirname(out), `prev_${x}.png`) }); }
    console.log('scene starts (s):', B.map(x => x.toFixed(1)).join(' ')); console.log('cues', JSON.stringify(CUES)); await browser.close(); process.exit(0);
  }
  const nFrames = Math.round(FPS * TOTAL);
  for (let i = 0; i < nFrames; i++) {
    await pg.evaluate((t) => window.renderAt(t), i / FPS);
    await pg.screenshot({ path: path.join(framesDir, `f${String(i).padStart(4, '0')}.png`) });
  }
  await browser.close();
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(framesDir, 'f%04d.png'),
    '-i', audioWav, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-shortest', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-crf', '20',
    '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-movflags', '+faststart', out]);
  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.rmSync(tmp, { force: true });
  console.log('saved', out, TOTAL.toFixed(1) + 's');
  console.log('scene starts (s):', B.map(x => x.toFixed(1)).join(' '));
})();
