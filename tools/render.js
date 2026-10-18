// Usage: node render.js data.json out.png
// data.json: {"date":"2026-10-18","registered":13805,"previousDate":null,"previousRegistered":null,"totalCompanies":1400000}
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = path.resolve(process.argv[3] || 'card.png');
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const MONP = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const d = new Date(data.date + 'T00:00:00Z');
const reg = data.registered;
const total = data.totalCompanies || 1400000;
const pct = (reg / total) * 100;

const milestones = [
  ['2026-10-30', 'to the Phase 1 ASP appointment deadline (30 Oct 2026)'],
  ['2027-01-01', 'to Phase 1 mandatory go-live (1 Jan 2027)'],
  ['2027-03-31', 'to the Phase 2 ASP appointment deadline (31 Mar 2027)'],
  ['2027-07-01', 'to Phase 2 mandatory go-live (1 Jul 2027)'],
];
let days = 0, dlbl = 'All business phases are now live';
for (const [ms, lbl] of milestones) {
  const diff = Math.ceil((new Date(ms + 'T00:00:00Z') - d) / 86400000);
  if (diff >= 0) { days = diff; dlbl = lbl; break; }
}

let t1tag = 'FIRST READING', t1num = 'BASELINE', t1lbl = 'Change since last update will be tracked from our next Pulse';
if (data.previousRegistered) {
  const delta = reg - data.previousRegistered;
  const pd = new Date(data.previousDate + 'T00:00:00Z');
  const gap = Math.round((d - pd) / 86400000);
  const chg = (delta / data.previousRegistered) * 100;
  t1tag = 'SINCE LAST UPDATE';
  t1num = (delta >= 0 ? '+' : '−') + fmt(Math.abs(delta));
  const chgTxt = `${chg >= 0 ? '+' : '−'}${Math.abs(chg).toFixed(1)}%`;
  t1lbl = gap <= 0
    ? `new listings since our earlier update today (${chgTxt})`
    : `new listings in ${gap} day${gap === 1 ? '' : 's'} (${chgTxt}) since ${pd.getUTCDate()} ${MONP[pd.getUTCMonth()]}`;
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
  PCT: pct < 1 ? 'Under 1%' : pct.toFixed(1) + '%',
  RATIO: pct < 1 ? 'Fewer than 1 in 100' : `Only about 1 in ${Math.round(total / reg)}`,
  DOTS: dots,
  T1TAG: t1tag, T1NUM: t1num, T1LBL: t1lbl,
  DAYS: days, DLBL: dlbl,
};

let html = fs.readFileSync(path.join(__dirname, 'card.html'), 'utf8');
for (const [k, v] of Object.entries(vals)) html = html.split(`{{${k}}}`).join(String(v));
const tmp = path.join(__dirname, '_filled.html');
fs.writeFileSync(tmp, html);

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  await page.goto('file://' + tmp);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.locator('.card').screenshot({ path: out });
  await browser.close();
  console.log('saved', out);
})();
