#!/usr/bin/env python3
"""Valorin studio: one post spec (posts/*.json) -> feed card PNG, vertical poster PNG, narrated MP4.

Usage:  python3 build.py posts/<id>.json [--card-only]
Needs:  playwright (Chromium), ffmpeg, kokoro-onnx + soundfile, model files given by KOKORO_DIR.
"""
import json, os, sys, html, subprocess, datetime, shutil, wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
KOKORO_DIR = Path(os.environ.get("KOKORO_DIR", "/tmp/kokoro"))
FPS = 30

NAVY, NAVY_D, GOLD, GOLD_T, CREAM = "#13283e", "#0e1f32", "#b29a75", "#d8c49d", "#f5f2ea"
TEAL, RED, BRONZE = "#1f7a70", "#c0392b", "#9a6a12"
TONES = {"teal": TEAL, "red": RED, "bronze": BRONZE}

FONTS = "".join(
    f"@font-face{{font-family:'{fam}';font-weight:{w};src:url('{(ASSETS/'fonts'/f).as_uri()}') format('woff2')}}"
    for fam, w, f in [("RC", 400, "roboto-condensed-latin-400-normal.woff2"), ("RC", 700, "roboto-condensed-latin-700-normal.woff2"),
                      ("RC", 800, "roboto-condensed-latin-800-normal.woff2"), ("RB", 400, "roboto-latin-400-normal.woff2"),
                      ("RB", 500, "roboto-latin-500-normal.woff2"), ("RB", 700, "roboto-latin-700-normal.woff2")])
LOGO = (ASSETS / "logo.png").as_uri()

ICONS = {
    "pin": '<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.6"/>',
    "web": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.8 2.6 15.2 0 18M12 3c-2.6 2.8-2.6 15.2 0 18"/>',
    "mail": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 7 8.5-7"/>',
    "chat": '<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z"/>',
    "search": '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5M8.5 11h5"/>',
    "quote": '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    "check": '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8.5 12.2 2.4 2.4 4.6-5"/>',
    "link": '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    "pulse": '<path d="M2 12h5l2-5 4 10 2-5h7"/>',
}
STEP_ICONS = ["search", "quote", "check", "link"]


def icon(name, size, color, stroke=2):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="{stroke}" '
            f'stroke-linecap="round" stroke-linejoin="round">{ICONS[name]}</svg>')


def esc(s):
    return html.escape(s)


def runs(parts):
    """[[text, 'g'|'w'], ...] -> spans; g = gold highlight."""
    return "".join(f'<span class="{c}">{esc(t)}</span>' for t, c in parts)


def fill(s, ctx):
    for k, v in ctx.items():
        s = s.replace("{" + k + "}", str(v))
    return s


CONTACTS = [("pin", "Dubai, UAE"), ("web", "www.valorin.ae"), ("mail", "advisory@valorin.ae"), ("chat", "058-2754282")]


def header(series, subline, w):
    return f"""<div class="hdr"><img class="logo" src="{LOGO}">
      <div class="hr"><div class="ht">{icon('pulse', 46, GOLD, 2.2)}<span>{esc(series)}</span></div>
      <div class="hs">{esc(subline)}</div></div></div><div class="rule"></div>"""


TAGLINE = "Finance with Integrity. Growth with Insight."


def footer(cols):
    items = "".join(f'<div class="fi">{icon(i, 30, GOLD_T)}<span>{esc(t)}</span></div>' for i, t in CONTACTS)
    return (f'<div class="fwrap"><div class="tag"><span class="tl1"></span>{esc(TAGLINE)}<span class="tl1"></span></div>'
            f'<div class="ftr c{cols}">{items}</div></div>')


BASE_CSS = FONTS + f"""
*{{box-sizing:border-box;margin:0;padding:0}} body{{font-family:RB,Arial,sans-serif;-webkit-font-smoothing:antialiased}}
.g{{color:{GOLD_T}}} .w{{color:#fff}}
.hdr{{background:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 56px}}
.logo{{display:block}} .hr{{text-align:right}}
.ht{{display:flex;align-items:center;justify-content:flex-end;gap:14px;font:800 50px/1 RC;color:{NAVY};text-transform:uppercase}}
.hs{{font:700 23px/1 RC;letter-spacing:3px;color:#8a7350;text-transform:uppercase;margin-top:10px}}
.rule{{height:7px;background:{GOLD}}}
.lab{{font:700 28px/1.2 RC;letter-spacing:4px;color:{GOLD_T};text-transform:uppercase}}
.ftr{{background:{NAVY_D};display:grid;align-items:center;color:#fff;font:500 27px RB}}
.ftr.c4{{grid-template-columns:auto auto auto auto;justify-content:space-between;padding:0 48px}}
.ftr.c2{{grid-template-columns:1fr 1fr;row-gap:22px;padding:30px 64px}}
.fi{{display:flex;align-items:center;gap:14px}}
.fwrap{{background:{NAVY_D}}}
.tag{{display:flex;align-items:center;justify-content:center;gap:22px;font:italic 400 26px RB;letter-spacing:.5px;color:{GOLD_T};padding:16px 0 4px}}
.tl1{{flex:none;width:70px;height:2px;background:{GOLD}}}
"""


# ---------------------------------------------------------------- feed card 1080x1350
def card_html(p, ctx):
    c = p["card"]
    tiles = "".join(f"""<div class="tile" style="border-top-color:{TONES[t['tone']]}">
        <div class="tl" style="color:{TONES[t['tone']]}">{esc(t['label'])}</div>
        <div class="tb" style="color:{TONES[t['tone']]}">{esc(fill(t['big'], ctx))}</div>
        <div class="ts">{esc(fill(t['small'], ctx))}</div></div>""" for t in c["tiles"])
    steps = "".join(f"""<div class="st"><div class="si">{icon(STEP_ICONS[i], 34, '#fff')}</div>
        <div class="sh">{i+1}. {esc(a)}</div><div class="sd">{esc(b)}</div></div>""" for i, (a, b) in enumerate(p["steps"]))
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{BASE_CSS}
    body{{width:1080px;height:1350px;background:{CREAM};display:flex;flex-direction:column}} body>*{{flex-shrink:0}}
    .hdr{{height:140px}} .logo{{height:80px}} .ht{{font-size:44px}} .hs{{font-size:21px}}
    .hero{{background:{NAVY};padding:30px 56px 32px;display:flex;gap:36px;align-items:center}}
    .hero .l{{flex:1}} .kick{{font:700 24px/1.3 RC;letter-spacing:3px;color:{GOLD_T};text-transform:uppercase}}
    h1{{font:800 74px/1.0 RC;text-transform:uppercase;margin-top:16px;color:#fff}} h1 .g{{white-space:nowrap}}
    .box{{border:2px solid #3d5470;border-radius:18px;padding:26px 30px;min-width:300px}}
    .bl{{font:700 24px RC;letter-spacing:3px;color:#9fb0c4;text-transform:uppercase}}
    .bv{{font:800 64px/1.05 RC;color:#fff;margin-top:8px}} .bn{{font:400 24px RB;color:#c4cfdb;margin-top:8px}}
    .tiles{{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;padding:24px 56px 2px}}
    .tile{{background:#fff;border-radius:14px;border-top:9px solid;padding:18px 20px 20px;box-shadow:0 2px 10px rgba(19,40,62,.07)}}
    .tl{{font:700 23px RC;letter-spacing:2.5px;text-transform:uppercase}} .tb{{font:800 46px/1.05 RC;margin-top:8px}}
    .ts{{font:400 20px/1.3 RB;color:#3c4654;margin-top:8px}}
    .how{{padding:18px 56px 20px}} .how h2{{font:800 36px RC;color:{NAVY};text-transform:uppercase}}
    .steps{{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:16px}}
    .si{{width:54px;height:54px;border-radius:12px;background:{NAVY};display:flex;align-items:center;justify-content:center}}
    .sh{{font:800 25px/1.08 RC;color:{NAVY};text-transform:uppercase;margin-top:12px}} .sd{{font:400 19px/1.3 RB;color:#3c4654;margin-top:6px}}
    .cta{{background:{GOLD};padding:18px 56px;display:flex;align-items:center;justify-content:space-between;gap:24px}}
    .cta .t{{font:800 36px/1.05 RC;color:{NAVY};text-transform:uppercase}} .cta .s{{font:500 23px RB;color:{NAVY};margin-top:8px}}
    .pill{{background:{NAVY};color:#fff;border-radius:40px;padding:18px 30px;display:flex;gap:12px;align-items:center;font:700 32px RC;white-space:nowrap}}
    .disc{{background:#fff;flex:1 0 auto !important;padding:14px 56px;font:400 15px/1.4 RB;color:#4a5260}}
    .fwrap{{margin-top:auto}} .ftr{{height:72px;font-size:25px}} .tag{{font-size:23px;padding:12px 0 0}}
    </style></head><body>
    {header(p['series'], fill(p['subline'] + ' · {as_of}', ctx), 1080)}
    <div class="hero"><div class="l"><div class="kick">{esc(c['kicker'])}</div><h1>{runs(c['headline'])}</h1></div>
      <div class="box"><div class="bl">{esc(c['box_label'])}</div><div class="bv">{esc(c['box_value'])}</div><div class="bn">{esc(c['box_note'])}</div></div></div>
    <div class="tiles">{tiles}</div>
    <div class="how"><h2>How Valorin gets you ready</h2><div class="steps">{steps}</div></div>
    <div class="cta"><div><div class="t">{esc(c['cta_title'])}</div><div class="s">{esc(c['cta_sub'])}</div></div>
      <div class="pill">{icon('chat', 32, '#fff')}058-2754282</div></div>
    <div class="disc">{esc(fill(p['source'], ctx))} {esc(p['disclaimer'])}</div>
    {footer(4)}</body></html>"""


# ---------------------------------------------------------------- video 1080x1920
def scene_html(s, p, ctx, idx):
    t = s["type"]
    A = lambda line, extra="": f'data-line="{line}" {extra}'
    if t == "hook":
        lines = "".join(f'<div class="hl a" {A(0, f"data-d={0.15*i:.2f}")}>{runs(l)}</div>' for i, l in enumerate(s["lines"]))
        body = f'<div class="lab a" {A(0)}>{esc(s["label"])}</div><div class="hook">{lines}</div>'
    elif t == "fact":
        chips = "".join(f"""<div class="chip a" {A(1, f"data-d={0.25*i:.2f}")} style="border-left-color:{TONES[tone]}">
            <div class="cl" style="color:{TONES[tone] if tone!='teal' else '#4fc3b4'}">{esc(l)}</div><div class="cv">{esc(fill(v, ctx))}</div></div>"""
                        for i, (tone, l, v) in enumerate(s["chips"]))
        body = f"""<div class="lab a" {A(0)}>{esc(s['label'])}</div>
          <div class="big a" {A(0, 'data-d=0.5 data-fx=zoom')}>{esc(s['big'])}</div>
          <div class="chips">{chips}</div>
          <div class="src a" {A(1, 'data-d=0.9')}>{esc(fill(p['source'], ctx))}</div>"""
    elif t == "insight":
        items = "".join(f'<div class="it a" {A(1, f"data-d={0.9+0.55*i:.2f}")}>{icon("check", 44, GOLD_T, 2.2)}<span>{esc(x)}</span></div>'
                        for i, x in enumerate(s["items"]))
        body = f"""<div class="lab a" {A(0)}>{esc(s['label'])}</div><div class="ih a" {A(0, 'data-d=0.6')}>{runs(s['head'])}</div>
          <div class="its">{items}</div>"""
    elif t == "steps":
        st = "".join(f"""<div class="stp a" {A(0, f"data-d={0.5+1.2*i:.2f}")}><div class="n">{i+1}</div>
            <div><div class="sh">{esc(a)}</div><div class="sd">{esc(b)}</div></div></div>""" for i, (a, b) in enumerate(p["steps"]))
        body = f'<div class="lab a" {A(0)}>{esc(s["label"])}</div><div class="stps">{st}</div>'
    elif t == "cta":
        body = f"""<div class="ctab a" {A(0, 'data-fx=zoom')}><div class="ct">{esc(s['title'])}</div>
            <div class="cw">{icon('chat', 64, NAVY, 2.4)}WhatsApp 058-2754282</div>
            <div class="ce">advisory@valorin.ae · www.valorin.ae</div></div>
          <div class="disc2 a" {A(1)}>{esc(p['disclaimer'])}</div>"""
    return f'<div class="scene" id="s{idx}">{body}</div>'


def video_html(p, ctx):
    scenes = "".join(scene_html(s, p, ctx, i) for i, s in enumerate(p["video"]["scenes"]))
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{BASE_CSS}
    body{{width:1080px;height:1920px;background:{NAVY};overflow:hidden;position:relative}}
    .top{{position:absolute;top:0;left:0;right:0;z-index:5}} .hdr{{height:200px}} .logo{{height:104px}}
    .stage{{position:absolute;top:207px;left:0;right:0;height:1225px;overflow:hidden}}
    .wm{{position:absolute;right:-180px;top:180px;width:900px;height:900px;opacity:.05}}
    .scene{{position:absolute;inset:0;padding:120px 80px 60px;display:flex;flex-direction:column;justify-content:center}}
    .a{{opacity:0}}
    .hook .hl{{font:800 132px/0.98 RC;text-transform:uppercase}} .hook{{margin-top:34px}}
    .big{{font:800 186px/1 RC;color:{GOLD_T};margin-top:26px;letter-spacing:-2px;white-space:nowrap;transform-origin:left center}}
    .chips{{display:flex;flex-direction:column;gap:26px;margin-top:56px}}
    .chip{{border-left:10px solid;padding:6px 0 6px 30px}} .cl{{font:700 32px RC;letter-spacing:3px;text-transform:uppercase}}
    .cv{{font:800 72px/1.05 RC;color:#fff;margin-top:6px}}
    .src{{font:400 26px/1.45 RB;color:#9fb0c4;margin-top:56px}}
    .ih{{font:800 104px/1.02 RC;text-transform:uppercase;color:#fff;margin-top:30px}}
    .its{{margin-top:56px;display:flex;flex-direction:column;gap:24px}}
    .it{{display:flex;align-items:center;gap:22px;font:500 40px RB;color:#fff}}
    .stps{{display:flex;flex-direction:column;gap:46px;margin-top:56px}}
    .stp{{display:flex;gap:34px;align-items:center}}
    .n{{flex:none;width:118px;height:118px;border-radius:20px;background:{GOLD};color:{NAVY};font:800 74px RC;display:flex;align-items:center;justify-content:center}}
    .sh{{font:800 66px/1 RC;color:#fff;text-transform:uppercase}} .sd{{font:400 32px/1.35 RB;color:#c4cfdb;margin-top:10px}}
    .ctab{{background:{GOLD};border-radius:30px;padding:70px 60px;transform-origin:center}}
    .ct{{font:800 88px/1.02 RC;color:{NAVY};text-transform:uppercase}}
    .cw{{display:flex;align-items:center;gap:20px;font:800 64px RC;white-space:nowrap;color:{NAVY};margin-top:46px}}
    .ce{{font:500 36px RB;color:{NAVY};margin-top:22px}}
    .disc2{{font:400 27px/1.5 RB;color:#9fb0c4;margin-top:50px}}
    .capz{{position:absolute;left:56px;right:56px;top:1440px;height:170px;display:flex;align-items:center;justify-content:center}}
    .cap{{position:absolute;max-width:968px;text-align:center;font:500 40px/1.32 RB;color:#fff;background:rgba(14,31,50,.92);
          border:1px solid #2b4360;border-radius:16px;padding:20px 30px;opacity:0}}
    .prog{{position:absolute;left:56px;right:56px;top:1628px;height:8px;background:#24405f;border-radius:4px;overflow:hidden}}
    .bar{{height:100%;width:0;background:{GOLD}}}
    .fwrap{{position:absolute;left:0;right:0;bottom:0}} .ftr.c2{{padding:22px 64px 30px;row-gap:18px}} .tag{{font-size:30px;padding:24px 0 4px}}
    </style></head><body>
    <div class="top">{header(p['series'], p['subline'], 1080)}</div>
    <div class="stage"><svg class="wm" viewBox="0 0 100 100"><path d="M8 12h22l20 52 20-52h22L58 92H42z" fill="{GOLD}"/></svg>{scenes}</div>
    <div class="capz" id="capz"></div><div class="prog"><div class="bar" id="bar"></div></div>
    {footer(2)}
    <script>
    const ease=x=>1-Math.pow(1-x,3);
    let T=null;
    function init(timing){{
      T=timing; const cz=document.getElementById('capz');
      T.caps.forEach((c,i)=>{{const d=document.createElement('div');d.className='cap';d.id='c'+i;d.textContent=c.text;cz.appendChild(d);}});
    }}
    function setTime(t){{
      document.querySelector('.wm').style.transform=`translate(${{-t*3}}px,${{t*1.5}}px) rotate(${{t*0.15}}deg)`;
      T.scenes.forEach((sc,i)=>{{
        const el=document.getElementById('s'+i);
        let o=1; if(t<sc.start-0.05||t>sc.end+0.4) o=0; else if(t>sc.end) o=1-(t-sc.end)/0.4;
        el.style.opacity=o; el.style.visibility=o<=0?'hidden':'visible';
        el.querySelectorAll('.a').forEach(a=>{{
          const ln=+(a.dataset.line||0), d=+(a.dataset.d||0);
          const t0=(sc.lines[ln]??sc.start)+d; const k=Math.max(0,Math.min(1,(t-t0)/0.55)); const e=ease(k);
          a.style.opacity=e;
          a.style.transform=a.dataset.fx==='zoom'?`scale(${{0.92+0.08*e}})`:`translateY(${{(1-e)*46}}px)`;
        }});
      }});
      T.caps.forEach((c,i)=>{{const d=document.getElementById('c'+i);
        let o=0; if(t>=c.start-0.1&&t<=c.end+0.15) o=Math.min(1,(t-c.start+0.1)/0.2,(c.end+0.15-t)/0.2);
        d.style.opacity=Math.max(0,o);}});
      document.getElementById('bar').style.width=(100*Math.min(1,t/T.total))+'%';
    }}
    </script></body></html>"""


# ---------------------------------------------------------------- audio
def tts_lines(p, work):
    from kokoro_onnx import Kokoro
    import soundfile as sf, numpy as np
    k = Kokoro(str(KOKORO_DIR / "kokoro.onnx"), str(KOKORO_DIR / "voices.bin"))
    sr = 24000
    lead, gap_line, gap_scene, tail = 0.6, 0.35, 0.7, 1.6
    chunks = [np.zeros(int(lead * sr), dtype="float32")]
    t = lead
    scenes, caps = [], []
    for s in p["video"]["scenes"]:
        sc = {"start": t, "lines": []}
        for vo, cap in zip(s["vo"], s["cap"]):
            audio, sr = k.create(vo, voice=p.get("voice", "bm_george"), speed=p.get("speed", 0.85), lang="en-gb")
            audio = audio.astype("float32")
            d = len(audio) / sr
            sc["lines"].append(t)
            caps.append({"start": t, "end": t + d, "text": cap})
            chunks += [audio, np.zeros(int(gap_line * sr), dtype="float32")]
            t += d + gap_line
        sc["end"] = t
        scenes.append(sc)
        chunks.append(np.zeros(int(gap_scene * sr), dtype="float32"))
        t += gap_scene
    scenes[-1]["end"] = t + tail  # hold the end card
    chunks.append(np.zeros(int(tail * sr), dtype="float32"))
    total = t + tail
    sf.write(work / "vo_raw.wav", np.concatenate(chunks), sr)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(work / "vo_raw.wav"),
                    "-af", "highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", str(work / "vo.wav")], check=True)
    return {"scenes": scenes, "caps": caps, "total": total}


# ---------------------------------------------------------------- main
def main():
    spec = Path(sys.argv[1]).resolve()
    p = json.loads(spec.read_text())
    as_of = datetime.date.fromisoformat(p["as_of_iso"])
    ctx = {"as_of": p["as_of"], "days": (datetime.date(2027, 3, 31) - as_of).days}
    out = ROOT / "out" / p["id"]
    work = out / "_work"
    work.mkdir(parents=True, exist_ok=True)
    (work / "card.html").write_text(card_html(p, ctx))
    (work / "video.html").write_text(video_html(p, ctx))

    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={"width": 1080, "height": 1350})
        pg.goto((work / "card.html").as_uri()); pg.wait_for_timeout(300)
        pg.screenshot(path=str(out / f"{p['id']}_feed_1080x1350.png"))
        if "--card-only" in sys.argv:
            b.close(); return
        timing = tts_lines(p, work)
        (work / "timing.json").write_text(json.dumps(timing, indent=1))
        pg = b.new_page(viewport={"width": 1080, "height": 1920})
        pg.goto((work / "video.html").as_uri()); pg.wait_for_timeout(300)
        pg.evaluate("t=>init(t)", timing)
        frames = work / "frames"
        shutil.rmtree(frames, ignore_errors=True); frames.mkdir()
        n = int(timing["total"] * FPS) + 1
        for i in range(n):
            pg.evaluate(f"setTime({i / FPS:.4f})")
            pg.screenshot(path=str(frames / f"{i:05d}.jpg"), type="jpeg", quality=93)
        # poster / thumbnail: hook scene fully revealed
        pg.evaluate(f"setTime({timing['scenes'][0]['end'] - 0.2:.3f})")
        pg.screenshot(path=str(out / f"{p['id']}_vertical_1080x1920.png"))
        b.close()
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-framerate", str(FPS), "-i", str(frames / "%05d.jpg"),
                    "-i", str(work / "vo.wav"), "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
                    "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest",
                    str(out / f"{p['id']}_video_1080x1920.mp4")], check=True)
    srt = []
    f = lambda s: f"{int(s//3600):02d}:{int(s%3600//60):02d}:{int(s%60):02d},{int(s%1*1000):03d}"
    for i, c in enumerate(timing["caps"], 1):
        srt.append(f"{i}\n{f(c['start'])} --> {f(c['end'])}\n{c['text']}\n")
    (out / f"{p['id']}_captions.srt").write_text("\n".join(srt))
    print("done", out, f"{timing['total']:.1f}s")


if __name__ == "__main__":
    main()
