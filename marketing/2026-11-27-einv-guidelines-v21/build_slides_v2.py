"""E-Invoicing Brief V2.1 – redesigned carousel (owner feedback 27 Nov 2026: clear hook, one idea per slide,
less text, clear CTA). 7 slides 1080x1350 + Pinterest cover 1080x1620."""
import base64, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
LOGO = base64.b64encode((HERE / '../studio/daily/valorin_logo.png').read_bytes()).decode()
NAVY, DEEP, GOLD, LGOLD, IVORY, RED, TEAL = '#13283E', '#0E1F32', '#B29A75', '#D8C49D', '#F5F2EA', '#C0392B', '#1F7A70'
SRC = 'Source: UAE Ministry of Finance, Electronic Invoicing Guidelines V2.1, 25 Nov 2026'
DISC = 'General information only, not legal or tax advice. Valorin is an independent advisory firm, not affiliated with the FTA or MoF. Valorin is not an ASP.'

CSS = f"""
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1080px;height:HPX;font-family:Roboto;color:{NAVY};position:relative;overflow:hidden;background:BG}}
.hd{{position:absolute;top:0;left:0;right:0;height:120px;display:flex;align-items:center;justify-content:space-between;padding:0 64px}}
.hd img{{height:58px}} .dark .hd img{{filter:brightness(0) invert(1)}} .hd .n{{font-stretch:75%;font-weight:700;font-size:30px;color:{GOLD};letter-spacing:2px}}
.wrap{{position:absolute;top:150px;left:80px;right:80px;bottom:230px;display:flex;flex-direction:column;justify-content:center}}
.kick{{font-stretch:75%;font-weight:700;font-size:32px;letter-spacing:4px;color:{GOLD}}}
h1{{font-family:Fraunces,Lora,serif;font-weight:600;font-size:104px;line-height:1.02;margin-top:22px;letter-spacing:-1px}}
h1 em{{font-style:italic;color:{GOLD}}}
.sub{{font-size:40px;line-height:1.35;margin-top:34px;color:#3b4a5c}}
.dark .sub{{color:#c9d3de}} .dark h1{{color:#fff}}
.swipe{{font-stretch:75%;font-weight:700;font-size:36px;color:{GOLD};margin-top:60px}}
.foot{{position:absolute;left:80px;right:80px;bottom:110px;font-size:21px;line-height:1.35;color:#7a8290}}
.dark .foot{{color:#8ea0b4}}
.bar{{position:absolute;left:0;right:0;bottom:0;height:84px;background:{DEEP};display:flex;align-items:center;justify-content:center;gap:34px;color:#fff;font-size:24px}}
.bar i{{font-style:italic;color:{LGOLD}}}
.vs{{display:flex;align-items:center;gap:36px;margin-top:50px}}
.box{{flex:1;border-radius:28px;padding:34px 30px;text-align:center}}
.box .l{{font-stretch:75%;font-weight:700;font-size:28px;letter-spacing:3px}}
.box .v{{font-stretch:75%;font-weight:800;font-size:150px;line-height:1;margin-top:12px}}
.box .d{{font-size:30px;margin-top:10px}}
.old{{background:#fff;border:4px solid #d9d1c1;color:#8a8f98}} .old .v{{text-decoration:line-through;text-decoration-color:{RED};text-decoration-thickness:10px}}
.new{{background:{NAVY};color:#fff}} .new .l{{color:{LGOLD}}} .new .v{{color:{LGOLD}}}
.arrow{{font-size:80px;color:{GOLD};font-weight:700}}
.row{{display:flex;gap:30px;align-items:center;margin-top:40px}}
.num{{flex:none;width:96px;height:96px;border-radius:50%;background:{GOLD};color:{NAVY};font-stretch:75%;font-weight:800;font-size:54px;display:flex;align-items:center;justify-content:center}}
.row .t{{font-stretch:75%;font-weight:700;font-size:46px;line-height:1.05}} .row .s{{font-size:32px;color:#4a5869;margin-top:6px}}
.date{{display:flex;justify-content:space-between;align-items:baseline;border-bottom:3px solid #e2dccd;padding:26px 0}}
.date .w{{font-size:36px}} .date .x{{font-stretch:75%;font-weight:800;font-size:64px;color:{NAVY}}}
.chk{{display:flex;gap:26px;align-items:center;font-size:42px;margin-top:34px}}
.chk i{{flex:none;width:52px;height:52px;border:5px solid {TEAL};border-radius:10px}}
.wa{{background:#25D366;color:#fff;border-radius:80px;text-align:center;font-stretch:75%;font-weight:700;font-size:62px;padding:30px 0;margin-top:56px}}
.mail{{text-align:center;font-size:36px;color:{LGOLD};margin-top:26px}}
"""
FONTS = '<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;1,600&display=swap" rel="stylesheet">'


def page(i, inner, foot=SRC, dark=False, h=1350, n=7):
    bg = NAVY if dark else IVORY
    css = CSS.replace('HPX', f'{h}px').replace('BG', bg)
    num = f'{i} / {n}' if n else ''
    return (f'<html><head><meta charset="utf-8">{FONTS}<style>{css}</style></head><body class="{"dark" if dark else ""}">'
            f'<div class="hd"><img src="data:image/png;base64,{LOGO}"><div class="n">{num}</div></div>'
            f'<div class="wrap">{inner}</div><div class="foot">{foot}. {DISC}</div>'
            f'<div class="bar"><i>Finance with Integrity. Growth with Insight.</i><span>www.valorin.ae · WhatsApp 058-2754282</span></div>'
            f'</body></html>')


S = {}
S[1] = page(1, """<div class="kick">UAE E-INVOICING · NEW GUIDELINES</div>
<h1>Exempt invoices just got a <em>new code.</em></h1>
<div class="sub">What changed in the Ministry of Finance guidelines on 25 November, and what to check in your ERP.</div>
<div class="swipe">Swipe →</div>""", dark=True)

S[2] = page(2, """<div class="kick">THE BIG CHANGE</div>
<h1 style="font-size:84px">An invoice with <em>only exempt</em> supplies</h1>
<div class="vs"><div class="box old"><div class="l">BEFORE</div><div class="v">380</div><div class="d">Tax invoice</div></div>
<div class="arrow">→</div>
<div class="box new"><div class="l">VERSION 2.1</div><div class="v">480</div><div class="d">Commercial invoice</div></div></div>""",
    SRC + ', s.18.3.1')

S[3] = page(3, """<div class="kick">WHY IT MATTERS</div>
<h1 style="font-size:92px">Exempt does <em>not</em> mean excluded.</h1>
<div class="sub">In-scope exempt-only invoices still go through e-invoicing. Only the invoice type changes, so your ERP logic has to know the difference.</div>""",
    SRC + ', s.18.3.1')

S[4] = page(4, """<div class="kick">ALSO IN VERSION 2.1</div>
<h1 style="font-size:84px">Three more set-ups <em>to re-test</em></h1>
<div class="row"><div class="num">1</div><div><div class="t">Foreign buyers</div><div class="s">An ID from their own country is accepted</div></div></div>
<div class="row"><div class="num">2</div><div><div class="t">Retention credit notes</div><div class="s">A reason code (BTAE-03) is required</div></div></div>
<div class="row"><div class="num">3</div><div><div class="t">Reverse-charge goods</div><div class="s">Each line carries its product code (GTIN)</div></div></div>""",
    SRC + ', s.18.2, 18.3.5, 18.4')

S[5] = page(5, """<div class="kick">WHAT HASN'T CHANGED</div>
<h1 style="font-size:84px">Your go-live date <em>stays the same</em></h1>
<div style="margin-top:30px"><div class="date"><span class="w">Revenue AED 50m or more</span><span class="x">1 Jan 2027</span></div>
<div class="date"><span class="w">Revenue below AED 50m</span><span class="x">1 Jul 2027</span></div></div>
<div class="sub" style="font-size:32px">For in-scope businesses.</div>""",
    SRC + ', s.8.3')

S[6] = page(6, """<div class="kick">YOUR CHECKLIST THIS MONTH</div>
<h1 style="font-size:84px">Four things to <em>check</em></h1>
<div class="chk"><i></i>Exempt-only invoices on code 480</div>
<div class="chk"><i></i>Buyer IDs in separate fields</div>
<div class="chk"><i></i>Retention credit note flow</div>
<div class="chk"><i></i>GTINs on reverse-charge items</div>""",
    'In our view. ' + SRC)

S[7] = page(7, """<div class="kick">NOT SURE YOUR ERP IS READY?</div>
<h1 style="font-size:96px">Let's check it <em>together.</em></h1>
<div class="sub">Send us your ERP and invoice types. We'll go through version 2.1 with you.</div>
<div class="wa">WhatsApp 058-2754282</div>
<div class="mail">advisory@valorin.ae</div>""", foot='Valorin Finance & Advisory, Dubai', dark=True)

PIN = page(0, """<div class="kick">UAE E-INVOICING · GUIDELINES V2.1</div>
<h1 style="font-size:96px">Exempt invoices just got a <em>new code.</em></h1>
<div class="vs"><div class="box old"><div class="l">BEFORE</div><div class="v">380</div></div><div class="arrow">→</div>
<div class="box new"><div class="l">V2.1</div><div class="v">480</div></div></div>
<div class="sub">Plus three set-ups to re-test. Go-live dates unchanged.</div>""", SRC, dark=False, h=1620, n=0)

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1080, 'height': 1350})
    for i, html in S.items():
        pg.set_content(html); pg.wait_for_load_state('networkidle'); pg.wait_for_timeout(500)
        over = pg.evaluate("() => { const w=document.querySelector('.wrap'); return w.scrollHeight - w.clientHeight }")
        print('slide', i, 'overflow px:', over)
        pg.screenshot(path=str(HERE / f'v2-slide-{i}.png'))
    pg.set_viewport_size({'width': 1080, 'height': 1620})
    pg.set_content(PIN); pg.wait_for_load_state('networkidle'); pg.wait_for_timeout(500)
    pg.screenshot(path=str(HERE / 'v2-card-pinterest.png'))
    b.close()
