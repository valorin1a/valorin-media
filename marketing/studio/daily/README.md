# Valorin daily videos studio ("Finance in 30s" and "Myth or Fact")

Studio for the two daily short videos only (Instagram Reel, TikTok, YouTube Shorts). It is a copy of
`../premium` with extra scene types and burned-in captions, approved by the team on 29 Oct 2026 from the
sample `posts/sample-cash-conversion-cycle.json`. The locked frame is unchanged: header with logo and
"Finance with Integrity. Growth with Insight.", navy contact footer, Roboto fonts, palette, George voice.

`../premium` stays as it is for the weekly brand posts. Change this folder, not that one, for the daily series.
Never edit `tools/`, `media/`, `data/` or `CLAUDE.md` (Peppol Pulse).

## Set up and build

    bash marketing/studio/daily/setup.sh
    cd marketing/studio/daily
    D=../../<YYYY-MM-DD>-<am|pm>-<slug>; mkdir -p $D
    node video.js posts/<id>.json $D/video.mp4 $D/captions.srt

Renders run one at a time (they share `_audio/` and `_frames/`), about 8–10 minutes each.
Quick layout check before a full render (screenshots at given seconds, no video):

    PREVIEW=3,12,20,30,40 node video.js posts/<id>.json $D/video.mp4

The script prints a WARNING on overflow; shorten text and rebuild.

## Scene types
All of `../premium` (hook, figure, points, steps, cta, chart, persona), plus:

- `personaAnim` – illustrated figure at a desk (generic, not a real person): blinks, bars rise on the monitor,
  a question mark floats, the speech bubble pops in.
  `{"type":"personaAnim","kicker","bubble","caption","shirt":"gold|navy","say","cap"}`
- `gantt` – day timeline with bars on one axis and a highlighted gap.
  `{"type":"gantt","kicker","head","max":145,"ticks":[0,45,60,135],"rows":[{"label","from","to","color","d"}],"gap":{"from","to","label"},"src","say","cap"}`
- `impact` – horizontal comparison bars, then a counting number.
  `{"type":"impact","kicker","max","bars":[{"label","v","d","color"}],"pre":"AED ","n":1.5,"dec":1,"unit":"M","desc","src","say","cap"}`
- `cta` – now takes an optional `q` (a question shown above the contact box).

Colours: `navy`, `gold`, `teal`, `red`.

## Burned-in captions
On by default (most short videos are watched muted). Each scene's `say` is split into sentences; `cap` gives
the on-screen text for each sentence in the same order (digits instead of spoken numbers; `*word*` is
highlighted). Without `cap`, the spoken sentence is shown. Turn off with `"burnCaptions": false` in `video`.

## Content rules for this series (team, 29 Oct 2026)
- 60–80 spoken words; the approved sample runs about 85 words and 47 s, which is the upper limit.
- Spoken numbers in `say`; digits in `cap`. Write "M.I.S." in `say` so George reads the letters.
- Numbers that are not regulatory facts carry "Illustrative example, not a real company." on screen.
- **Closing line (team, 29 Oct 2026):** the last scene's `say` is NOT the spoken disclaimer. It ends with a
  short, inviting call to action in dialogue form, for example "Want to know your cycle? Send us a WhatsApp,
  and we'll work it out with you." Promise nothing about results. "General information only, not legal or
  tax advice." stays written on screen in the cta `disc`, and in every caption.
- The independence line goes on screen wherever the FTA or MoF appears.

---

# Shorts v2: the 9:16 mobile-first look (6 Nov 2026)

Owner instruction 6 Nov 2026 (Valorin Marketing project, claude/14 decision 11 and claude/20). For every daily video
made **after the owner approves the samples** in `../../samples-2026-11-06-new-look/`. `video.js` above stays as it
is for the videos already scheduled (1–14 Nov) and any re-render of them.

    node shorts.js posts-v2/<id>.json <dir>/video.mp4 <dir>/captions.srt
    SAFE=1 PREVIEW=auto node shorts.js posts-v2/<id>.json <dir>/video.mp4   # screenshots of every line, unsafe zones in red

About 4–6 minutes per 35–45 s video. One render at a time (shared `_audio2/`, `_frames2/`).

## Frame (owner, 12 Nov 2026)
`video.frame: "light"` (default): no letterhead during the video. A small Valorin logo sits top-left; the background
changes with the scene (`bg`: ivory, sand, white, navy; defaults: hook `video.hookBg`, founder and end navy, split and
doc white, dialogue and whiteboard sand); the end card carries the full brand block (logo, "Finance with Integrity.
Growth with Insight.", WhatsApp button, contact row, written compliance lines). Vary `hookBg` from video to video.
`video.frame: "letterhead"` gives the 6 Nov version (header and navy footer on every frame).

## What is different
- **Hook from frame 0:** big serif headline (Fraunces), one gold italic word (`*word*`), words land in the first second.
- **A visual change on every spoken line.** Each scene has `lines` (one sentence each, about 2–3 s); elements appear on
  a line (`at` = line index in the scene, `dt` = seconds after it starts). Keep lines short so cuts land every 2–3 s.
- **Word-by-word captions** above the footer (max 4 words at a time, current word highlighted, `*key*` words in gold).
  `cap` = on-screen text (digits), `say` = spoken (numbers in words). `nocap: true` when the words are already the headline.
  Dialogue lines show as chat bubbles instead of captions.
- **Safe zone (light frame):** content between y 350 and 1170, x 72 to 930; captions 1188–1328; nothing important in the
  top ~270 px, the bottom ~580 px or the right ~150 px (approximate; Meta's guide uses 14% top and up to 35% bottom for
  ads; verify per network). Letterhead frame: content 410–1290, captions 1312–1462.
- **Brand elements:** logo, tagline and contact row (on the end card in the light frame), Roboto for body and captions, palette.
  Additions: ivory background (daily look), Fraunces serif for headlines, Caveat for whiteboard handwriting.
- **Voices:** narrator George (`n`, bm_george 0.85, locked). Optional second voice for dialogue (`voices` + `cast`);
  the sample uses bf_emma for the business owner. Only after the team approves a second voice (file 18 s.2).

## Format bank (rotate: no two videos in a row on a network share a main format)
| Scene type | Use | Key fields |
|---|---|---|
| `hook` | Always first | `kicker`, `head` (`*gold italic*`), `sub`, `subAt` |
| `strike` | Pain points struck through | `head`, `items:[{t, at, dt, strikeAt, strikeDt, keep}]`, `after:{t, at}` |
| `founder` | Founder scene: **real photo only** (owner, 12 Nov 2026; no illustrated or AI avatar) | `mode: "photo"` (`../../reference/founder-headshot.jpg`); `stat:{at}` shows "20+ years in finance & business management"; `bubble:{t, at}` |
| `dialogue` | Two illustrated people in chat bubbles | `video.cast:{key:{fig:"owner"|"adviser", name, voice}}`, lines with `who` and `bubble`; tag "ILLUSTRATIVE CONVERSATION" |
| `quiz` | Question, pause with countdown, reveal | `q`, `options`, `answer`, `optsAt`, `revealAt`; put `pause: 2.4` on the line before the reveal; `explain:{t, at}` |
| `split` | Myth vs fact | `myth`, `verdict`, `fact`, `src`, `strikeAt`, `factAt`, `topLabel`, `factLabel` |
| `doc` | Document zoom | `docs:[{title, sub, rows:[[label, value]]}]`, `focus:[{at, doc, row, cls:"hit"|"good", note, dy}]`, `{at, overview:true}` |
| `draw` | Chart that draws itself | `kind: "line"|"bars"`, `style: "board"` (whiteboard) or `"card"` (navy card), `data:[{label, v, d, color}]`, `note:{text, i, at, x, y}`, `min`, `src` |
| `end` | End card, one reason to message | `h` (service), `q`, `disc` (all written compliance lines), WhatsApp button; `video.episode:{label, n, of, next}` adds a series badge and "NEXT ·" line |

Rules carried over: no compliance line in any `say` (file 14 d.9); every non-regulatory number labelled "Illustrative
example, not a real company." on screen; founder facts come only from the `FOUNDER` constant in `shorts.js`
(file 04 Evidenced); never "CFO-led" or "as a CFO" for the founder; avatar says only the general script (file 14 d.11c).
