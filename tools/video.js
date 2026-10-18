// Usage: node video.js data.json out.mp4
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = path.resolve(process.argv[3] || 'pulse.mp4');
const FPS = 30, TOTAL = 15;
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const MONP = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const d = new Date(data.date + 'T00:00:00Z');
const reg = data.registered, total = data.totalCompanies || 1400000;
const pct = reg / total * 100;
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
let delta = fmt(reg), deltaLbl = 'UAE entities listed so far: our first Pulse reading';
if (data.previousRegistered) {
  const dd = reg - data.previousRegistered;
  const pd = new Date(data.previousDate + 'T00:00:00Z');
  const gap = Math.round((d - pd) / 86400000);
  const chg = `${dd >= 0 ? '+' : '−'}${Math.abs(dd / data.previousRegistered * 100).toFixed(1)}%`;
  delta = (dd >= 0 ? '+' : '−') + fmt(Math.abs(dd));
  deltaLbl = gap <= 0 ? `new listings since our earlier update today (${chg})`
    : `new listings in ${gap} day${gap === 1 ? '' : 's'} (${chg}) since ${pd.getUTCDate()} ${MONP[pd.getUTCMonth()]}`;
}
const vals = {
  DATE: `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
  DATEPLAIN: `${d.getUTCDate()} ${MONP[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
  RATIO: pct < 1 ? 'Fewer than 1 in 100' : `Only about 1 in ${Math.round(total / reg)}`,
  DELTA: delta, DELTALBL: deltaLbl, DAYS: days, DLBL: dlbl,
  TOTAL: TOTAL, REGNUM: reg,
};
let html = fs.readFileSync(path.join(__dirname, 'video.html'), 'utf8');
for (const [k, v] of Object.entries(vals)) html = html.split(`{{${k}}}`).join(String(v));
const tmp = path.join(__dirname, '_video_filled.html');
fs.writeFileSync(tmp, html);
const framesDir = path.join(__dirname, '_frames');
fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir);

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + tmp);
  await page.evaluate(() => document.fonts.ready);
  const n = FPS * TOTAL;
  for (let i = 0; i < n; i++) {
    await page.evaluate((t) => window.renderAt(t), i / FPS);
    await page.screenshot({ path: path.join(framesDir, `f${String(i).padStart(4, '0')}.png`) });
  }
  await browser.close();
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(framesDir, 'f%04d.png'),
    '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
    '-shortest', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-crf', '20',
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', out]);
  fs.rmSync(framesDir, { recursive: true, force: true });
  console.log('saved', out);
})();
