"""E-Invoicing Brief: Guidelines V2.1 vs V2.0. 8 carousel slides 1080x1350 + Pinterest cover 1080x1620.
Adapted from marketing/2026-11-27-cfo-week-issue-2/build_slides.py."""
import base64, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
LOGO = base64.b64encode((HERE / '../studio/daily/valorin_logo.png').read_bytes()).decode()
NAVY, DEEP, GOLD, LGOLD, IVORY, RED, TEAL, BRONZE = '#13283E', '#0E1F32', '#B29A75', '#D8C49D', '#F5F2EA', '#C0392B', '#1F7A70', '#9A6A12'
COMPLY = ('General information only, not legal or tax advice. Valorin is an independent advisory firm, '
          'not affiliated with the FTA or MoF. Valorin is not an ASP.')
SRC = 'Source: UAE Ministry of Finance, UAE Electronic Invoicing Guidelines, Version 2.1, 25 Nov 2026'

CSS = f"""
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1080px;height:HPX;background:#fff;font-family:Roboto;color:{NAVY};position:relative;overflow:hidden}}
.hd{{height:150px;display:flex;align-items:center;justify-content:space-between;padding:0 44px;border-bottom:5px solid {GOLD}}}
.hd img{{height:68px}}
.hd .r{{text-align:right}} .hd .t{{font-stretch:75%;font-weight:700;font-size:38px}} .hd .s{{font-size:23px;color:{GOLD};margin-top:6px}}
.main{{position:absolute;top:155px;left:0;right:0;bottom:150px;background:{IVORY};padding:38px 60px 0}}
.kick{{font-stretch:75%;font-weight:700;font-size:30px;color:{BRONZE};letter-spacing:1px;display:flex;align-items:center;gap:16px}}
.tag{{font-stretch:75%;font-weight:700;font-size:24px;color:#fff;border-radius:30px;padding:5px 18px}}
h1{{font-stretch:75%;font-weight:700;font-size:68px;line-height:1.04;margin:16px 0 0}}
h1 em{{font-style:normal;color:{RED}}}
.body{{font-size:32px;line-height:1.32;margin-top:20px}}
.item{{font-size:30px;line-height:1.3;margin-top:20px;padding-left:22px;border-left:6px solid {GOLD}}}
.item b{{font-stretch:75%;font-size:33px}}
.link{{font-size:30px;color:{TEAL};font-weight:500;margin-top:24px}}
.src{{position:absolute;left:60px;right:60px;bottom:20px;font-size:21px;line-height:1.3;color:#5b6470}}
.ft{{position:absolute;left:0;right:0;bottom:0;height:150px;background:{DEEP};text-align:center;color:#fff}}
.ft .tl{{color:{LGOLD};font-size:29px;font-style:italic;padding-top:16px}} .ft .ct{{font-size:24px;margin-top:12px}}
.dots{{display:flex;gap:18px;justify-content:center;margin-top:14px}} .dots i{{width:14px;height:14px;border-radius:50%;background:#46566a}} .dots i.on{{background:{GOLD}}}
table{{width:100%;border-collapse:collapse;margin-top:16px;font-size:22px;line-height:1.25}}
th{{font-stretch:75%;font-size:25px;text-align:left;background:{NAVY};color:#fff;padding:12px 14px}}
td{{padding:8px 12px;border-bottom:2px solid #e2dccd;vertical-align:top;background:#fff}}
td.t{{font-stretch:75%;font-weight:700;font-size:24px;width:250px}}
.st{{display:inline-block;font-stretch:75%;font-weight:700;font-size:19px;color:#fff;border-radius:20px;padding:2px 10px;margin-top:4px}}
.cmp{{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:24px}}
.cmp div{{border-radius:16px;padding:20px 22px;font-size:28px;line-height:1.3}}
.cmp .a{{background:#fff;border:3px solid #cfc6b4}} .cmp .b{{background:{NAVY};color:#fff}}
.cmp .h{{font-stretch:75%;font-weight:700;font-size:26px;letter-spacing:1px;margin-bottom:8px}}
.cmp .a .h{{color:#7a8290}} .cmp .b .h{{color:{LGOLD}}}
.wa{{background:{GOLD};border-radius:60px;text-align:center;font-stretch:75%;font-weight:700;font-size:56px;padding:20px 0;margin-top:26px;color:{NAVY}}}
.chk{{font-size:30px;line-height:1.3;margin-top:16px;display:flex;gap:16px}} .chk i{{flex:none;width:34px;height:34px;border:4px solid {TEAL};border-radius:7px;margin-top:2px}}
"""


def page(i, inner, src='', h=1350, n=8):
    dots = ''.join(f'<i class="{"on" if k == i else ""}"></i>' for k in range(1, n + 1)) if n else ''
    s = f'<div class="src">{src}</div>' if src else ''
    return (f'<html><head><meta charset="utf-8"><style>{CSS.replace("HPX", str(h) + "px")}</style></head><body>'
            f'<div class="hd"><img src="data:image/png;base64,{LOGO}"><div class="r"><div class="t">E-Invoicing Brief</div>'
            f'<div class="s">Guidelines V2.1 · 27 Nov 2026</div></div></div>'
            f'<div class="main">{inner}{s}</div>'
            f'<div class="ft"><div class="tl">Finance with Integrity. Growth with Insight.</div>'
            f'<div class="ct">Dubai, UAE · www.valorin.ae · advisory@valorin.ae · WhatsApp 058-2754282</div>'
            f'<div class="dots">{dots}</div></div></body></html>')


def st(t, c):
    return f'<span class="st" style="background:{c}">{t}</span>'


CH, CL, AD = st('CHANGED', RED), st('CLARIFIED', TEAL), st('ADDED', BRONZE)
S = {}
S[1] = page(1, f"""<div class="kick">UAE E-INVOICING · WHAT CHANGED</div>
<h1>Guidelines <em>V2.1</em>: what's different from V2.0</h1>
<div class="body">The UAE Ministry of Finance has updated its Electronic Invoicing Guidelines. Version 2.1 is dated 25 November 2026; version 2.0 was dated 26 October 2026.</div>
<div class="cmp"><div class="a"><div class="h">VERSION 2.0</div>26 Oct 2026</div><div class="b"><div class="h">VERSION 2.1</div>25 Nov 2026</div></div>
<div class="body">Seven points for your invoice mapping and ERP set-up, section by section.</div>
<div class="kick" style="margin-top:26px;font-size:38px;color:{GOLD}">Swipe &gt;</div>""", SRC + '. ' + COMPLY)

ROWS = [('Exempt-only invoices', 'Code 480 (commercial invoice) where the whole invoice is exempt and/or outside VAT. s.18.3.1', CH),
        ('Phase 1 ASP date in the s.8.3 table', '30 Oct 2026 (V2.0 table: 31 Oct 2026). Go-live still 1 Jan 2027', CH),
        ('Summary invoices', 'Scenario does not apply to commercial invoices. s.10.4', CL),
        ('Buyer identifiers', 'Foreign buyers: any valid identifier from their own jurisdiction in IBT-047. s.18.2', CL),
        ('Foreign-to-foreign goods', 'An Out-of-Scope Transaction; several BTAE-02 indicators can apply. s.18.3.2', CL),
        ('Retention credit notes', 'BTAE-03 mandatory when a credit note covers retention. s.18.3.5', AD),
        ('GTIN on reverse charge', 'GTIN reported on reverse-charge lines; none? obtain via GS1 UAE. s.18.4', AD)]
rows = ''.join(f'<tr><td class="t">{a}<br>{c}</td><td>{b}</td></tr>' for a, b, c in ROWS)
S[2] = page(2, f"""<div class="kick">V2.1 AT A GLANCE</div>
<h1 style="font-size:58px">Seven changes, <em>one table</em></h1>
<table><tr><th>Topic</th><th>What V2.1 says</th></tr>{rows}</table>""",
    SRC + '; V2.0, 26 Oct 2026. ' + COMPLY)

S[3] = page(3, f"""<div class="kick">1 · INVOICE TYPE CODE {CH}</div>
<h1>Exempt-only invoice? <em>Code 480</em></h1>
<div class="cmp"><div class="a"><div class="h">CODE 380 · TAX INVOICE</div>Taxable supplies where UAE VAT applies</div>
<div class="b"><div class="h">CODE 480 · COMMERCIAL INVOICE</div>Outside VAT, or entirely exempt and/or non-VAT supplies, if still in the e-invoicing framework</div></div>
<div class="item"><b>The test is VAT treatment,</b> not only whether the supplier is VAT registered.</div>
<div class="item"><b>Exempt is not excluded.</b> Only Chapter 7 exclusions need no e-invoice.</div>
<div class="item"><b>Buyer legal ID (IBT-047)</b> is mandatory on code 480 and on its credit note, code 81.</div>""",
    SRC + ', s.18.3.1 and Appendix 6. ' + COMPLY)

S[4] = page(4, f"""<div class="kick">2 · BUYER AND BENEFICIARY IDs {CL}</div>
<h1>Three fields, <em>not one</em></h1>
<div class="item"><b>IBT-046 and IBT-047 are not interchangeable.</b> For UAE buyers, IBT-046 holds the TIN; IBT-046 or IBT-048 is needed where buyer identification is required.</div>
<div class="item"><b>Foreign buyers:</b> any valid identifier issued in the buyer's own jurisdiction can go in IBT-047.</div>
<div class="item"><b>Overseas beneficiary with no UAE TRN or TIN:</b> BTAE-01 takes a legal or business registration number from its home jurisdiction.</div>""",
    SRC + ', s.18.2 and s.18.3.4. ' + COMPLY)

S[5] = page(5, f"""<div class="kick">3 · CROSS-BORDER AND RETENTION {CL} {AD}</div>
<h1>Outside VAT is <em>not</em> outside e-invoicing</h1>
<div class="item"><b>Foreign-to-foreign goods:</b> goods shipped from outside the UAE to another place outside it, without entering the UAE, are an Out-of-Scope Transaction.</div>
<div class="item"><b>One invoice, several flags:</b> BTAE-02 can carry more than one transaction-type indicator; include each scenario's requirements.</div>
<div class="item"><b>Retention:</b> full certified amount invoiced, retention later credited? BTAE-03 is mandatory; reason DL8.61.1.C may be used.</div>""",
    SRC + ', s.18.3.2, s.18.3.5 and s.10.4. ' + COMPLY)

S[6] = page(6, f"""<div class="kick">4 · SUMMARY INVOICES AND GTINs {CL} {AD}</div>
<h1>Two set-ups <em>to re-test</em></h1>
<div class="item"><b>Summary invoices</b> (several transactions with one customer over a period) do not apply to commercial invoices. A negative total goes on a credit note instead.</div>
<div class="item"><b>Reverse-charge goods:</b> where the item is identified by GTIN, report it on the line. No GTIN? Obtain one through GS1 UAE; the brand owner is generally responsible.</div>""",
    SRC + ', s.10.4 and s.18.4. ' + COMPLY)

DATES = [('Revenue AED 50m or more', '30 Oct 2026', '1 Jan 2027'),
         ('Revenue below AED 50m', '31 Mar 2027', '1 Jul 2027'),
         ('Government entities', '31 Mar 2027', '1 Oct 2027')]
drow = ''.join(f'<tr><td class="t">{a}</td><td>{b}</td><td>{c}</td></tr>' for a, b, c in DATES)
S[7] = page(7, f"""<div class="kick">WHAT STAYS THE SAME</div>
<h1>Go-live dates <em>unchanged</em></h1>
<table><tr><th>In-scope business</th><th>Appoint an ASP by</th><th>Implement by</th></tr>{drow}</table>
<div class="item"><b>Only the table's Phase 1 ASP date moved,</b> from 31 to 30 October 2026, the date already set by Ministerial Resolution No. 66 of 2026.</div>""",
    SRC + ', s.8.3. ' + COMPLY)

CHK = ['Re-map exempt-only invoices to code 480', 'Split buyer IDs into separate customer fields',
       'Test retention credit notes with BTAE-03', 'List reverse-charge items that need a GTIN',
       'Re-run your ASP test cases on the new rules']
chk = ''.join(f'<div class="chk"><i></i><span>{c}</span></div>' for c in CHK)
S[8] = page(8, f"""<div class="kick">YOUR NEXT STEP</div>
<h1 style="font-size:60px">What we'd check <em>this month</em></h1>
{chk}
<div class="wa">WhatsApp 058-2754282</div>""",
    'In our view, for in-scope businesses. ' + COMPLY)

PIN = page(0, f"""<div class="kick">UAE E-INVOICING · NOV 2026</div>
<h1>Guidelines <em>V2.1</em> vs V2.0: seven changes</h1>
<table><tr><th>Topic</th><th>What V2.1 says</th></tr>{rows}</table>
<div class="link">Updating your ERP mapping? WhatsApp 058-2754282</div>""",
    SRC + '. ' + COMPLY, h=1620, n=0)

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1080, 'height': 1350})
    for i, html in S.items():
        pg.set_content(html); pg.wait_for_timeout(300)
        over = pg.evaluate("""() => { const m=document.querySelector('.main'), s=document.querySelector('.src');
          const kids=[...m.children].filter(e=>!e.classList.contains('src'));
          const last=Math.max(...kids.map(e=>e.getBoundingClientRect().bottom));
          return s ? last - s.getBoundingClientRect().top : last - m.getBoundingClientRect().bottom }""")
        print('slide', i, 'gap to source line (negative = ok):', round(over))
        pg.screenshot(path=str(HERE / f'slide-{i}.png'))
    pg.set_viewport_size({'width': 1080, 'height': 1620})
    pg.set_content(PIN); pg.wait_for_timeout(300)
    over = pg.evaluate("""() => { const m=document.querySelector('.main'), s=document.querySelector('.src');
      const kids=[...m.children].filter(e=>!e.classList.contains('src'));
      return Math.max(...kids.map(e=>e.getBoundingClientRect().bottom)) - s.getBoundingClientRect().top }""")
    print('pin gap', round(over))
    pg.screenshot(path=str(HERE / 'card-pinterest.png'))
    b.close()
