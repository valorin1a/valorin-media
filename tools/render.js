// Usage: node render.js data.json out.png
// data.json: {"date":"2026-10-18","registered":13805,"previousDate":null,"previousRegistered":null,"totalCompanies":1400000}
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = path.resolve(process.argv[3] || 'card.png');
const SIZE = process.argv[4] || 'feed';   // feed 1080x1350 | pinterest 1080x1620 | square 1080x1080 | landscape 1440x1080 | wide 1600x900
const DIM = { feed: [1080, 1350], pinterest: [1080, 1620], square: [1080, 1080], landscape: [1440, 1080], wide: [1600, 900] }[SIZE];
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const MONP = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const d = new Date(data.date + 'T00:00:00Z');
const reg = data.registered;
const total = data.totalCompanies || 1400000;
const pct = (reg / total) * 100;

const milestones = [
  ['2026-10-30', 'to appoint an ASP (Phase&nbsp;1), 30&nbsp;Oct&nbsp;2026'],
  ['2027-01-01', 'to Phase 1 go-live, 1 Jan 2027'],
  ['2027-03-31', 'to appoint an ASP, Phase 2, 31 Mar 2027'],
  ['2027-07-01', 'to Phase 2 go-live, 1 Jul 2027'],
];
let days = 0, dlbl = 'All business phases are now live', dkey = 'LIVE';
for (const [ms, lbl] of milestones) {
  const diff = Math.ceil((new Date(ms + 'T00:00:00Z') - d) / 86400000);
  if (diff >= 0) { days = diff; dlbl = lbl; dkey = lbl.includes('go-live') ? 'GO-LIVE' : 'ASP DEADLINE'; break; }
}

let t1tag = 'FIRST READING', t1num = 'BASELINE', t1lbl = 'Change since last update will be tracked from our next Pulse';
if (data.previousRegistered) {
  const delta = reg - data.previousRegistered;
  const pd = new Date(data.previousDate + 'T00:00:00Z');
  const gap = Math.round((d - pd) / 86400000);
  const chg = (delta / data.previousRegistered) * 100;
  t1tag = gap <= 0 ? 'SINCE THIS MORNING' : `SINCE ${pd.getUTCDate()} ${MON[pd.getUTCMonth()]}`;
  t1num = (delta >= 0 ? '+' : '−') + fmt(Math.abs(delta));
  const chgTxt = `${chg >= 0 ? '+' : '−'}${Math.abs(chg).toFixed(1)}%`;
  t1lbl = gap <= 0
    ? `new listings since our earlier update today (${chgTxt})`
    : `new listings in ${gap} day${gap === 1 ? '' : 's'} (${chgTxt})`;
}

const blocks = 50;
// each block = 2%; light whole blocks, then a half block for any remainder of 1% or less
const full = Math.floor(pct / 2);
const rem = pct - full * 2;
const dots = Array.from({ length: blocks }, (_, i) => {
  if (i < full) return '<i class="on"></i>';
  if (i === full && rem > 0) return `<i class="${rem > 1 ? 'on' : 'half'}"></i>`;
  return '<i></i>';
}).join('');

const vals = {
  DATE: `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
  DATEPLAIN: `${d.getUTCDate()} ${MONP[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
  KICKER: 'UAE ENTITIES LISTED IN THE PEPPOL DIRECTORY SO FAR',
  REG: fmt(reg),
  PCT: pct < 1 ? 'Under 1%' : pct < 1.5 ? 'About 1%' : 'About ' + pct.toFixed(1) + '%',
  RATIO: pct < 1 ? "Fewer than <b>1 in 100</b> of the UAE's 1.4M+ companies"
       : pct < 1.5 ? "About <b>1 in 100</b> of the UAE's 1.4M+ companies"
       : `Fewer than <b>1 in ${Math.floor(total / reg)}</b> of the UAE's 1.4M+ companies`,
  BARW: Math.max(pct, 0.5).toFixed(2) + '%',
  DOTS: dots,
  T1TAG: t1tag, T1NUM: t1num, T1LBL: t1lbl,
  DAYS: days === 0 ? 'TODAY' : days, DAYSW: days === 0 ? '' : days === 1 ? 'DAY' : 'DAYS', DLBL: days === 0 ? dlbl.replace(/^to appoint/, 'last day to appoint') : dlbl, DKEY: dkey,
};

let html = fs.readFileSync(path.join(__dirname, 'card.html'), 'utf8');
for (const [k, v] of Object.entries(vals)) html = html.split(`{{${k}}}`).join(String(v));
if (SIZE !== 'feed') html = html.replace('<div class="card">', `<div class="card ${SIZE}">`);
const tmp = path.join(__dirname, '_filled.html');
fs.writeFileSync(tmp, html);

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell' });
  const page = await browser.newPage({ viewport: { width: DIM[0], height: DIM[1] }, deviceScaleFactor: 1 });
  await page.goto('file://' + tmp);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.locator('.card').screenshot({ path: out });
  await browser.close();
  console.log('saved', out);
})();
