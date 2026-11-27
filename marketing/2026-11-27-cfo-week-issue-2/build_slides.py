"""CFO Week issue 2 (calendar theme): 7 carousel slides 1080x1350 and a Pinterest cover 1080x1620.
Run: python3 build_slides.py  (needs playwright + the preinstalled Chromium)."""
import base64, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
LOGO = base64.b64encode((HERE / '../studio/daily/valorin_logo.png').read_bytes()).decode()
NAVY, DEEP, GOLD, LGOLD, IVORY, RED, TEAL, BRONZE = '#13283E', '#0E1F32', '#B29A75', '#D8C49D', '#F5F2EA', '#C0392B', '#1F7A70', '#9A6A12'
TAGC = {'TAX': RED, 'CASH': TEAL, 'E-INVOICING': BRONZE, 'AUDIT': '#46628A'}
COMPLY = ('General information only, not legal or tax advice. Valorin is an independent advisory firm, '
          'not affiliated with the FTA or MoF.')

CSS = f"""
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1080px;height:HPX;background:#fff;font-family:Roboto;color:{NAVY};position:relative;overflow:hidden}}
.c{{font-stretch:75%}}
.hd{{height:150px;display:flex;align-items:center;justify-content:space-between;padding:0 44px;border-bottom:5px solid {GOLD}}}
.hd img{{height:68px}}
.hd .r{{text-align:right}} .hd .t{{font-stretch:75%;font-weight:700;font-size:38px}} .hd .s{{font-size:23px;color:{GOLD};margin-top:6px}}
.main{{position:absolute;top:155px;left:0;right:0;bottom:150px;background:{IVORY};padding:40px 64px 0}}
.kick{{font-stretch:75%;font-weight:700;font-size:32px;color:{BRONZE};letter-spacing:1px;display:flex;align-items:center;gap:16px}}
.tag{{font-stretch:75%;font-weight:700;font-size:26px;color:#fff;border-radius:30px;padding:6px 20px}}
h1{{font-stretch:75%;font-weight:700;font-size:72px;line-height:1.04;margin:18px 0 0}}
h1 em{{font-style:normal;color:{RED}}}
.body{{font-size:34px;line-height:1.32;margin-top:22px}}
.item{{font-size:33px;line-height:1.3;margin-top:22px;padding-left:22px;border-left:6px solid {GOLD}}}
.item b{{font-stretch:75%;font-size:35px}}
.link{{font-size:32px;color:{TEAL};font-weight:500;margin-top:26px}}
.src{{position:absolute;left:64px;right:64px;bottom:22px;font-size:22px;line-height:1.3;color:#5b6470}}
.week{{display:flex;gap:10px;margin-top:26px}}
.d{{flex:1;background:#fff;border:2px solid #e2dccd;border-radius:14px;text-align:center;padding:10px 0 12px;position:relative}}
.d .w{{font-stretch:75%;font-size:24px;color:#7a8290;font-weight:600}} .d .n{{font-stretch:75%;font-size:46px;font-weight:700;line-height:1.1}}
.d .m{{font-size:20px;color:#7a8290}}
.d.red{{border:5px solid {RED};box-shadow:0 0 0 4px #f6d7d3}} .d.red .n{{color:{RED}}}
.d.gold{{border:5px solid {GOLD};box-shadow:0 0 0 4px #efe6d6}} .d.gold .n{{color:{BRONZE}}}
.d.navy{{border:5px solid {NAVY}}}
.d.dim{{opacity:.45}}
.ft{{position:absolute;left:0;right:0;bottom:0;height:150px;background:{DEEP};text-align:center;color:#fff}}
.ft .tl{{color:{LGOLD};font-size:29px;padding-top:16px}} .ft .ct{{font-size:24px;margin-top:12px}}
.dots{{display:flex;gap:18px;justify-content:center;margin-top:14px}} .dots i{{width:14px;height:14px;border-radius:50%;background:#46566a}} .dots i.on{{background:{GOLD}}}
.row{{display:flex;gap:24px;align-items:flex-start;padding:18px 0;border-bottom:2px solid #e2dccd}}
.row .dt{{font-stretch:75%;font-weight:700;font-size:34px;width:300px;flex:none}}
.row .ev{{font-size:31px;line-height:1.25}}
.big{{font-stretch:75%;font-weight:800;font-size:200px;line-height:1;color:{NAVY};margin-top:10px}}
.wa{{background:{GOLD};border-radius:60px;text-align:center;font-stretch:75%;font-weight:700;font-size:60px;padding:22px 0;margin-top:30px;color:{NAVY}}}
.chips{{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:28px}}
.chips div{{text-align:center;font-stretch:75%;font-weight:700;font-size:40px;color:#fff;border-radius:44px;padding:16px 0}}
.legend{{font-size:24px;color:#5b6470;margin-top:14px}} .legend b{{display:inline-block;width:18px;height:18px;border-radius:50%;vertical-align:-2px;margin:0 6px 0 0}}
"""


def week(days):
    out = '<div class="week">'
    for w, n, m, cls in days:
        out += f'<div class="d {cls}"><div class="w">{w}</div><div class="n">{n}</div><div class="m">{m}</div></div>'
    return out + '</div>'


NEXT = lambda marks: week([(w, n, m, marks.get(n, '')) for w, n, m in [
    ('FRI', '27', 'Nov'), ('SAT', '28', 'Nov'), ('SUN', '29', 'Nov'), ('MON', '30', 'Nov'),
    ('TUE', '1', 'Dec'), ('WED', '2', 'Dec'), ('THU', '3', 'Dec')]])
LAST = week([(w, n, 'Nov', 'navy' if n == '25' else 'dim') for w, n in [
    ('FRI', '20'), ('SAT', '21'), ('SUN', '22'), ('MON', '23'), ('TUE', '24'), ('WED', '25'), ('THU', '26')]])
LEG = f'<div class="legend"><b style="background:{RED}"></b>deadline &nbsp; <b style="background:{GOLD}"></b>holiday</div>'


def page(i, inner, src='', h=1350, n=7):
    dots = ''.join(f'<i class="{"on" if k == i else ""}"></i>' for k in range(1, n + 1)) if n else ''
    s = f'<div class="src">{src}</div>' if src else ''
    return (f'<html><head><meta charset="utf-8"><style>{CSS.replace("HPX", str(h) + "px")}</style></head><body>'
            f'<div class="hd"><img src="data:image/png;base64,{LOGO}"><div class="r"><div class="t">The CFO Week</div>'
            f'<div class="s">Issue 2 · 27 Nov 2026</div></div></div>'
            f'<div class="main">{inner}{s}</div>'
            f'<div class="ft"><div class="tl">Finance with Integrity. Growth with Insight.</div>'
            f'<div class="ct">Dubai, UAE · www.valorin.ae · advisory@valorin.ae · 058-2754282</div>'
            f'<div class="dots">{dots}</div></div></body></html>')


def tag(t):
    return f'<span class="tag" style="background:{TAGC[t]}">{t}</span>'


S = {}
S[1] = page(1, f"""<div class="kick">YOUR WEEK ON ONE PAGE</div>
<h1>Two deadlines on Monday. <em>A holiday</em> midweek.</h1>
<div class="body">Tax, cash, e-invoicing and the audit: one action each, tied to a day.</div>
{NEXT({'30': 'red', '2': 'gold', '3': 'gold'})}{LEG}
<div style="display:flex;gap:12px;margin-top:30px">{tag('TAX')}{tag('CASH')}{tag('E-INVOICING')}{tag('AUDIT')}</div>
<div class="kick" style="margin-top:34px;font-size:40px;color:{GOLD}">Swipe &gt;</div>""", 'National Day dates: u.ae; confirm against the official 2026 announcement. ' + COMPLY)

S[2] = page(2, f"""<div class="kick">1 · LAST WEEK {tag('E-INVOICING')}</div>{LAST}
<h1>New e-invoicing guidelines: <em>version 2.1</em></h1>
<div class="body">The UAE Ministry of Finance published Version 2.1 of its Electronic Invoicing Guidelines, dated 25 Nov 2026. Make sure your project team and ERP partner work from it.</div>
<div class="link">Not sure what it means for your project? We can walk through it with you.</div>""",
    'Source: UAE Ministry of Finance, UAE Electronic Invoicing Guidelines, Version 2.1, 25 Nov 2026. Valorin is not an ASP. ' + COMPLY)

S[3] = page(3, f"""<div class="kick">2 · DO NEXT WEEK {tag('TAX')}</div>{NEXT({'30': 'red'})}
<h1>File by <em>Monday 30 Nov</em></h1>
<div class="item"><b>VAT.</b> The FTA lists 30 Nov 2026 as the final deadline for filing VAT returns. Check which period yours covers.</div>
<div class="item"><b>Corporate tax.</b> Tax period ended 28 Feb 2026? Nine months points to 30 Nov for the return and payment, unless the FTA sets another date.</div>
<div class="link">We can review the numbers with you before you file.</div>""",
    'Sources: FTA announcements; Federal Decree-Law No. 47 of 2022, Arts. 48 and 53. ' + COMPLY)

S[4] = page(4, f"""<div class="kick">3 · AVOID NEXT WEEK {tag('CASH')}</div>{NEXT({'30': 'red', '2': 'gold', '3': 'gold'})}
<h1>Two mistakes <em>to avoid next week</em></h1>
<div class="item"><b>Filing on the last day.</b> Leave it to 30 Nov and one error leaves no time to fix it before the deadline.</div>
<div class="item"><b>Paying on the holiday.</b> u.ae lists National Day as 2 and 3 December. Move payroll and supplier runs earlier, and check your bank's cut-off times.</div>
<div class="link">We can map your December cash with you.</div>""",
    'Source: u.ae, public holidays. Confirm against the official 2026 announcement. ' + COMPLY)

ROWS = [('Mon 30 Nov', 'VAT returns: final filing deadline (FTA)', RED),
        ('Mon 30 Nov', 'Corporate tax: return and payment for tax periods ended 28 Feb 2026 (nine-month rule)', RED),
        ('Wed 2 – Thu 3 Dec', 'National Day holiday (u.ae)', BRONZE)]
LATER = [('Tue 8 – Wed 9 Dec', 'US Federal Reserve meeting (federalreserve.gov)', NAVY),
         ('Tue 15 Dec', 'Excise returns: final filing deadline (FTA)', NAVY)]
rows = lambda rr: ''.join(f'<div class="row"><div class="dt" style="color:{c}">{d}</div><div class="ev">{e}</div></div>' for d, e, c in rr)
S[5] = page(5, f"""<div class="kick">4 · COMING UP</div>
<h1>Dates to <em>ring</em></h1>
<div style="margin-top:10px">{rows(ROWS)}</div>
<div class="kick" style="margin-top:26px;font-size:28px;color:#5b6470">FURTHER OUT</div>
{rows(LATER)}""",
    'Scheduled dates only, no forecasts. Sources: FTA announcements; Federal Decree-Law No. 47 of 2022, Arts. 48 and 53; u.ae (confirm against the official 2026 announcement); federalreserve.gov. ' + COMPLY)

S[6] = page(6, f"""<div class="kick">KEY FIGURE {tag('AUDIT')}</div>
<div class="big">AED 50m</div>
<div class="body" style="margin-top:6px">A taxable person (not a Tax Group) with revenue over AED 50m in a tax period must prepare and maintain audited financial statements. So must a Qualifying Free Zone Person.</div>
<div class="item"><b>December year-end?</b> Book the auditor before the close, not after it.</div>
<div class="link">We can help you plan the year-end close.</div>""",
    'Source: Ministerial Decision No. 84 of 2025 (MoF), tax periods starting on or after 1 Jan 2025. Tax Groups prepare audited special purpose financial statements. ' + COMPLY)

S[7] = page(7, f"""<div class="kick">YOUR NEXT STEP</div>
<h1 style="font-size:96px">Which one is yours?</h1>
<div class="body">Message us on WhatsApp and we'll tell you what we'd do first.</div>
<div class="chips"><div style="background:{RED}">TAX</div><div style="background:{TEAL}">CASH</div><div style="background:{BRONZE}">E-INVOICING</div><div style="background:#46628A">AUDIT</div></div>
<div class="wa">WhatsApp 058-2754282</div>
<div class="body" style="text-align:center;color:{BRONZE}">advisory@valorin.ae</div>""",
    'Comes out every Friday. ' + COMPLY + ' Valorin is not an ASP.')

PIN = page(0, f"""<div class="kick">THE CFO WEEK · ISSUE 2</div>
<h1>UAE finance calendar: <em>30 Nov – 15 Dec 2026</em></h1>
{NEXT({'30': 'red', '2': 'gold', '3': 'gold'})}{LEG}
<div style="margin-top:10px">{rows(ROWS + LATER)}</div>
<div class="link">Which one is yours? WhatsApp 058-2754282</div>""",
    'Scheduled dates only. Sources: FTA announcements; Federal Decree-Law No. 47 of 2022, Arts. 48 and 53; u.ae (confirm against the official 2026 announcement); federalreserve.gov. ' + COMPLY,
    h=1620, n=0)

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
    pg.screenshot(path=str(HERE / 'card-pinterest.png'))
    b.close()
