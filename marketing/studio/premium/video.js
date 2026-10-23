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
    body = `<div class="el cta c" data-in="${at(i, 0)}"><div class="h">${sc.h}</div><div class="b">${sc.b}</div><div class="a">${sc.a}</div></div>`
      + `<div class="el disc" data-in="${at(i, 1)}">${sc.disc}</div>`;
  } else throw new Error('unknown scene type ' + sc.type);
  return `<div class="scene" data-s="${B[i].toFixed(2)}" data-e="${B[i + 1].toFixed(2)}"${last}>${body}</div>`;
}).join('\n');

let page = fs.readFileSync(path.join(__dirname, 'video.html'), 'utf8')
  .replace('{{SCENES}}', html).replace('{{TOTAL}}', TOTAL.toFixed(2)).replace('{{COUNTERS}}', JSON.stringify(counters));
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
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.goto('file://' + tmp);
  await pg.evaluate(() => document.fonts.ready);
  const over = await pg.evaluate(() => [...document.querySelectorAll('.scene')].map((s, i) => s.scrollHeight > s.clientHeight + 1 ? i : -1).filter(i => i >= 0));
  if (over.length) console.warn('WARNING: scene overflow in scenes', over.join(','));
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
