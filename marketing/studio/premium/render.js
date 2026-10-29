// Brand card in the premium white report style (same frame as the locked Peppol Pulse card).
// Usage: node render.js posts/<id>.json <out.png> [feed|pinterest|landscape|wide]
// Post file: see README.md (fields under "card").
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const post = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = path.resolve(process.argv[3] || 'card.png');
const SIZE = process.argv[4] || 'feed';
const DIM = { feed: [1080, 1350], pinterest: [1080, 1620], landscape: [1440, 1080], wide: [1600, 900] }[SIZE];
if (!DIM) throw new Error('unknown size ' + SIZE);
const c = post.card;

const fig = c.figure
  ? `<div class="fig"><div class="n c">${c.figure.n}${c.figure.unit ? `<small>${c.figure.unit}</small>` : ''}</div><div class="l">${c.figure.label}</div></div>`
  : '';
const tiles = (c.tiles || []).map(t =>
  `<div class="stat"><div class="k c">${t.k}</div><div class="t${t.alert ? ' alert' : ''}">${t.t}</div><div class="l">${t.l}</div></div>`).join('');

const vals = { KICKER: c.kicker, HEAD: c.head, SUB: c.sub || '', FIG: fig, TILES: tiles,
  CTAH: c.cta.h, CTAD: c.cta.d, CTAGO: c.cta.go, SOURCE: c.source };
let html = fs.readFileSync(path.join(__dirname, 'card.html'), 'utf8');
for (const [k, v] of Object.entries(vals)) html = html.split(`{{${k}}}`).join(String(v));
if (SIZE !== 'feed') html = html.replace('<div class="card">', `<div class="card ${SIZE}">`);
const tmp = path.join(__dirname, '_filled.html');
fs.writeFileSync(tmp, html);

(async () => {
  const browser = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell') ? { executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' } : { executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: DIM[0], height: DIM[1] }, deviceScaleFactor: 1 });
  await page.goto('file://' + tmp);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  // overflow guard: content must not run into the source line or footer
  const over = await page.evaluate(() => { const m = document.querySelector('main'); return m.scrollHeight > m.clientHeight + 1; });
  if (over) console.warn('WARNING: content overflows the card at size', process.argv[4] || 'feed');
  await page.locator('.card').screenshot({ path: out });
  await browser.close();
  fs.rmSync(tmp, { force: true });
  console.log('saved', out);
})();
