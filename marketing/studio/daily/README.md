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
