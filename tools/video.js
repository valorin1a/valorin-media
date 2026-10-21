// Usage: node video.js data.json out.mp4
// Optional data.json fields: "voiceModel" (path to Piper LibriTTS .onnx), "voiceSpeaker" (id, default 200),
// "silent": true (skip voice and music).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = path.resolve(process.argv[3] || 'pulse.mp4');
const FPS = 30;
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const MONP = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONF = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const d = new Date(data.date + 'T00:00:00Z');
const reg = data.registered, total = data.totalCompanies || 1400000;
const pct = reg / total * 100;

// ---- number to words (for the voiceover) ----
const ONES = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const TENS = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
function words(n) {
  n = Math.round(Math.abs(n));
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  if (n < 1000) return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + words(n % 100) : '');
  if (n < 1e6) return words(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? (n % 1000 < 100 ? ' and ' : ', ') + words(n % 1000) : '');
  return words(Math.floor(n / 1e6)) + ' million' + (n % 1e6 ? ', ' + words(n % 1e6) : '');
}

// ---- deadline ----
const milestones = [
  ['2026-10-30', 'to the Phase 1 ASP appointment deadline (30 Oct 2026)', 'left for Phase 1 businesses to appoint an accredited service provider'],
  ['2027-01-01', 'to Phase 1 mandatory go-live (1 Jan 2027)', 'until mandatory e-invoicing goes live for Phase 1 businesses'],
  ['2027-03-31', 'to the Phase 2 ASP appointment deadline (31 Mar 2027)', 'left for Phase 2 businesses to appoint an accredited service provider'],
  ['2027-07-01', 'to Phase 2 mandatory go-live (1 Jul 2027)', 'until mandatory e-invoicing goes live for Phase 2 businesses'],
];
let days = 0, dlbl = 'All business phases are now live', dsay = null;
for (const [ms, lbl, say] of milestones) {
  const diff = Math.ceil((new Date(ms + 'T00:00:00Z') - d) / 86400000);
  if (diff >= 0) { days = diff; dlbl = lbl; dsay = say; break; }
}

// ---- delta ----
let delta = fmt(reg), deltaLbl = 'UAE entities listed so far: our first Pulse reading', deltaSay = '';
if (data.previousRegistered) {
  const dd = reg - data.previousRegistered;
  const pd = new Date(data.previousDate + 'T00:00:00Z');
  const gap = Math.round((d - pd) / 86400000);
  const chg = `${dd >= 0 ? '+' : '−'}${Math.abs(dd / data.previousRegistered * 100).toFixed(1)}%`;
  delta = (dd >= 0 ? '+' : '−') + fmt(Math.abs(dd));
  deltaLbl = gap <= 0 ? `new listings since our earlier update today (${chg})`
    : `new listings in ${gap} day${gap === 1 ? '' : 's'} (${chg}) since ${pd.getUTCDate()} ${MONP[pd.getUTCMonth()]}`;
  if (dd > 0) deltaSay = `${words(dd)} new listings ${gap <= 0 ? 'since our earlier update today' : gap === 1 ? 'since yesterday' : 'in the last ' + words(gap) + ' days'}. `;
}

const ratioTxt = pct < 1 ? 'Fewer than 1 in 100' : pct < 1.5 ? 'About 1 in 100' : `About 1 in ${Math.round(total / reg)}`;
const ratioSay = pct < 1 ? 'That is fewer than one in a hundred UAE companies.' : pct < 1.5 ? 'That is about one in a hundred UAE companies.' : `That is about one in ${words(Math.round(total / reg))} UAE companies.`;
const segments = [
  'UAE e-invoicing alert. Is your company on Peppol yet?',
  `As of ${d.getUTCDate()} ${MONF[d.getUTCMonth()]}, ${words(reg)} UAE entities are listed in the Peppol Directory. ${ratioSay}`,
  deltaSay + (dsay ? `${words(days)} days ${dsay}. For in-scope businesses, missing it can cost five thousand dirhams a month.` : 'Mandatory e-invoicing is now live. For in-scope businesses, penalties can reach five thousand dirhams a month.'),
  'Valorin can help, from gap assessment to A S P selection and Oracle integration. Message us on WhatsApp, or email advisory at valorin dot A E.',
];

const vals = {
  DATE: `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
  DATEPLAIN: `${d.getUTCDate()} ${MONP[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
  RATIO: ratioTxt, DELTA: delta, DELTALBL: deltaLbl, DAYS: days, DLBL: dlbl,
  TOTAL: 15, REGNUM: reg,
};
let html = fs.readFileSync(path.join(__dirname, 'video.html'), 'utf8');
for (const [k, v] of Object.entries(vals)) html = html.split(`{{${k}}}`).join(String(v));
const tmp = path.join(__dirname, '_video_filled.html');
fs.writeFileSync(tmp, html);

// ---- audio + timing ----
const B = [0, 2.8, 6.6, 10.4, 15];            // scene boundaries in the HTML timeline
let N = B.slice(), realTotal = 15, audioWav = null;
const audioDir = path.join(__dirname, '_audio');
if (!data.silent && data.voiceModel) {
  fs.rmSync(audioDir, { recursive: true, force: true });
  fs.mkdirSync(audioDir);
  fs.writeFileSync(path.join(audioDir, 'segments.json'), JSON.stringify(segments));
  execFileSync('python3', [path.join(__dirname, 'audio.py'), 'voice', data.voiceModel, String(data.voiceSpeaker ?? 200),
    path.join(audioDir, 'segments.json'), audioDir], { stdio: 'inherit' });
  const durs = JSON.parse(fs.readFileSync(path.join(audioDir, 'timing.json'), 'utf8')).durations;
  durs[3] += 1.5;                                // hold the call to action on screen
  N = [0]; for (const x of durs) N.push(N[N.length - 1] + x);
  realTotal = N[4];
  audioWav = path.join(audioDir, 'mix.wav');
  // timing.json durations drive placement; pass the padded total to the mixer
  execFileSync('python3', [path.join(__dirname, 'audio.py'), 'mix', audioDir, String(realTotal), audioWav], { stdio: 'inherit' });
}
function mapTime(T) {                            // real time -> HTML timeline (piecewise linear per scene)
  for (let i = 0; i < 4; i++) if (T <= N[i + 1] || i === 3) return B[i] + (Math.min(T, N[i + 1]) - N[i]) * (B[i + 1] - B[i]) / (N[i + 1] - N[i]);
}

const framesDir = path.join(__dirname, '_frames');
fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir);

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + tmp);
  await page.evaluate(() => document.fonts.ready);
  const n = Math.round(FPS * realTotal);
  for (let i = 0; i < n; i++) {
    await page.evaluate((t) => window.renderAt(t), mapTime(i / FPS));
    await page.screenshot({ path: path.join(framesDir, `f${String(i).padStart(4, '0')}.png`) });
  }
  await browser.close();
  const audioIn = audioWav ? ['-i', audioWav] : ['-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100'];
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(framesDir, 'f%04d.png'),
    ...audioIn, ...(audioWav ? ['-af', 'loudnorm=I=-14:TP=-1.5:LRA=11'] : []), '-shortest', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-crf', '20',
    '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-movflags', '+faststart', out]);
  fs.rmSync(framesDir, { recursive: true, force: true });
  console.log('saved', out, realTotal.toFixed(1) + 's');
  console.log('voice script:\n' + segments.join('\n'));
})();
