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
.cmp{{margin-top:44px;display:flex;flex-direction:column;gap:22px}}
.card{{border-radius:26px;padding:30px 36px}}
.card .l{{font-stretch:75%;font-weight:700;font-size:26px;letter-spacing:3px}}
.card .v{{font-size:44px;line-height:1.22;margin-top:10px}}
.card.b{{background:#fff;border:3px solid #e2dccd;color:#8a8f98}} .card.b .v{{color:#6f7682}}
.card.n{{background:{NAVY};color:#fff}} .card.n .l{{color:{LGOLD}}}
.tag{{display:inline-block;font-stretch:75%;font-weight:800;font-size:26px;letter-spacing:3px;padding:8px 18px;border-radius:8px;margin-left:14px;vertical-align:middle}}
.t-chg{{background:{RED};color:#fff}} .t-new{{background:{TEAL};color:#fff}} .t-clr{{background:{GOLD};color:{NAVY}}}
.do{{font-size:36px;margin-top:34px;color:{NAVY}}} .do b{{color:{TEAL}}}
.mail{{text-align:center;font-size:36px;color:{LGOLD};margin-top:26px}}
"""
FONTS = ''


def page(i, inner, foot=SRC, dark=False, h=1350, n=8):
    bg = NAVY if dark else IVORY
    css = CSS.replace('HPX', f'{h}px').replace('BG', bg)
    num = f'{i} / {n}' if n else ''
    return (f'<html><head><meta charset="utf-8">{FONTS}<style>{css}</style></head><body class="{"dark" if dark else ""}">'
            f'<div class="hd"><img src="data:image/png;base64,{LOGO}"><div class="n">{num}</div></div>'
            f'<div class="wrap">{inner}</div><div class="foot">{foot}. {DISC}</div>'
            f'<div class="bar"><i>Finance with Integrity. Growth with Insight.</i><span>www.valorin.ae · WhatsApp 058-2754282</span></div>'
            f'</body></html>')



B = 'BEFORE · V2.0, 26 OCT'
N = 'NOW · V2.1, 25 NOV'
def chg(i, tag, cls, title, before, now, do, sec):
    return page(i, f"""<div class="kick">CHANGE {i-1} OF 5<span class="tag {cls}">{tag}</span></div>
<h1 style="font-size:80px">{title}</h1>
<div class="cmp"><div class="card b"><div class="l">{B}</div><div class="v">{before}</div></div>
<div class="card n"><div class="l">{N}</div><div class="v">{now}</div></div></div>
<div class="do"><b>Check:</b> {do}</div>""", SRC + ', ' + sec + '. V2.0 side per secondary sources')

S = {}
S[1] = page(1, """<div class="kick">UAE E-INVOICING · V2.0 → V2.1</div>
<h1 style="font-size:96px">The guidelines changed on <em>25 November.</em></h1>
<div class="sub">5 differences your ERP team should see before go-live. Number 1 affects every exempt-only invoice.</div>
<div class="swipe">Swipe to compare →</div>""", dark=True)
S[2] = chg(2, 'CHANGED', 't-chg', 'Exempt-only <em>invoices</em>', 'Tax invoice, code 380', 'Commercial invoice, <b>code 480</b>', 'the invoice type logic in your ERP', 's.18.3.1')
S[3] = chg(3, 'CLARIFIED', 't-clr', 'Foreign <em>buyers</em>', 'ID rules for overseas buyers not spelled out', 'Any valid ID from the buyer\'s country, in its own field', 'buyer ID fields are kept separate', 's.18.2')
S[4] = chg(4, 'NEW', 't-new', 'Retention <em>credit notes</em>', 'No specific rule', 'Reason code <b>BTAE-03</b> is required', 'your retention release process', 's.18.3.5')
S[5] = chg(5, 'NEW', 't-new', 'Reverse-charge <em>goods</em>', 'No product-code rule', 'Each line carries its <b>GTIN</b>, where the item has one', 'item master data for GTINs', 's.18.4')
S[6] = chg(6, 'NEW', 't-new', 'Summary <em>invoices</em>', 'No specific rule for commercial invoices', 'Not allowed for commercial invoices. A negative total becomes a credit note', 'how monthly summaries are issued', 's.10.4')
S[7] = page(7, """<div class="kick">WHAT HASN'T CHANGED</div>
<h1 style="font-size:84px">Your go-live date <em>stays the same</em></h1>
<div style="margin-top:30px"><div class="date"><span class="w">Revenue AED 50m or more</span><span class="x">1 Jan 2027</span></div>
<div class="date"><span class="w">Revenue below AED 50m</span><span class="x">1 Jul 2027</span></div></div>
<div class="sub" style="font-size:32px">For in-scope businesses.</div>""", SRC + ', s.8.3')
S[8] = page(8, """<div class="kick">WHICH OF THESE AFFECT YOU?</div>
<h1 style="font-size:96px">We'll check it <em>with you.</em></h1>
<div class="sub">Send us your ERP and invoice types. We'll tell you which V2.1 changes apply to your business.</div>
<div class="wa">WhatsApp 058-2754282</div>
<div class="mail">advisory@valorin.ae</div>""", foot='Valorin Finance & Advisory, Dubai', dark=True)

PIN = page(0, """<div class="kick">UAE E-INVOICING · V2.0 → V2.1</div>
<h1 style="font-size:92px">What changed in the guidelines on <em>25 November</em></h1>
<div class="vs"><div class="box old"><div class="l">BEFORE</div><div class="v">380</div></div><div class="arrow">→</div>
<div class="box new"><div class="l">NOW</div><div class="v">480</div></div></div>
<div class="sub">Exempt-only invoices, foreign buyers, retention credit notes, GTINs and summary invoices: five differences compared.</div>""", SRC, dark=False, h=1620, n=0)

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1080, 'height': 1350})
    for i, html in S.items():
        pg.set_content(html); pg.wait_for_timeout(400)
        over = pg.evaluate("() => { const w=document.querySelector('.wrap'); return w.scrollHeight - w.clientHeight }")
        print('slide', i, 'overflow px:', over)
        pg.screenshot(path=str(HERE / f'v3-slide-{i}.png'))
    pg.set_viewport_size({'width': 1080, 'height': 1620})
    pg.set_content(PIN); pg.wait_for_timeout(400)
    pg.screenshot(path=str(HERE / 'v3-card-pinterest.png'))
    b.close()
