"""
Builds the buyer workbook from docs/CANDLE_CALCULATOR_IMPLEMENTATION_SPEC.md.

The .xlsx is a BUILD VEHICLE ONLY: it is uploaded to Google Drive and converted
to a Google Sheet, which is the product. No .xlsx is shipped and Excel
compatibility is never claimed.

add_case() takes a sheet-name suffix so many pre-filled cases can share one
workbook, letting every acceptance test recalculate inside Google Sheets itself.
"""

import sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation

INPUT_FILL = PatternFill("solid", fgColor="FFF8E1")
CALC_FILL = PatternFill("solid", fgColor="F1F3F4")
ASSUM_FILL = PatternFill("solid", fgColor="E3F2FD")
HEAD_FILL = PatternFill("solid", fgColor="263238")
WHITE = PatternFill("solid", fgColor="FFFFFF")

H1 = Font(bold=True, size=16, color="263238")
H2 = Font(bold=True, size=12, color="FFFFFF")
BOLD = Font(bold=True)
BIG = Font(bold=True, size=13)
NOTE = Font(size=9, italic=True, color="546E7A")
WARN = Font(bold=True, size=10, color="C62828")
THIN = Border(left=Side("thin", color="B0BEC5"), right=Side("thin", color="B0BEC5"),
              top=Side("thin", color="B0BEC5"), bottom=Side("thin", color="B0BEC5"))

LOAD_OPT = "Fragrance load (% of wax)"
CONTENT_OPT = "Fragrance content (% of wax + fragrance)"
BASIS_PRICE = "Item price only"
BASIS_SHIP = "Item price + shipping"

MASS, PCT, MONEY = "0.0", "0.0%", "0.00"


def section(ws, row, text, width=4):
    ws.cell(row=row, column=1, value=text).font = H2
    for c in range(1, width + 1):
        ws.cell(row=row, column=c).fill = HEAD_FILL


def lbl(ws, row, text, note=None):
    ws.cell(row=row, column=1, value=text)
    if note:
        ws.cell(row=row, column=4, value=note).font = NOTE


def inp(ws, row, value, fmt=None, fill=INPUT_FILL, col=2):
    c = ws.cell(row=row, column=col, value=value)
    c.fill, c.border = fill, THIN
    if fmt:
        c.number_format = fmt
    return c


def calc(ws, row, formula, fmt=None, font=None):
    c = ws.cell(row=row, column=2, value=formula)
    c.fill, c.border = CALC_FILL, THIN
    if fmt:
        c.number_format = fmt
    if font:
        c.font = font
    return c


def warnbox(ws, row, formula, span="B{r}:D{r}"):
    c = calc(ws, row, formula)
    c.font, c.fill, c.border = WARN, WHITE, Border()
    ws.merge_cells(span.format(r=row))


def listdv(ws, cell, options):
    d = DataValidation(type="list", formula1='"%s"' % options, allow_blank=True)
    ws.add_data_validation(d)
    d.add(ws[cell])


def add_case(wb, o=None, suffix="", brief=False):
    o = o or {}
    g = lambda k, d=None: o.get(k, d)
    SH, YC, CP = f"Start Here{suffix}", f"Your Candle{suffix}", f"Costs & Price{suffix}"
    qSH, qYC = f"'{SH}'", f"'{YC}'"

    # ------------------------------------------------------------- Start Here
    s = wb.create_sheet(SH)
    for col, w in (("A", 46), ("B", 30), ("C", 6), ("D", 62)):
        s.column_dimensions[col].width = w
    s["A1"] = "Candle Batch & Pricing Calculator"
    s["A1"].font = H1
    s["A2"] = ("Work out exactly how much wax and fragrance to melt, what each candle "
               "costs you, and what to charge.")
    s["A2"].font = NOTE

    section(s, 4, "First, two quick settings")
    lbl(s, 5, "I weigh things in", "Everything below switches to match.")
    inp(s, 5, g("unit_system", "grams"))
    lbl(s, 6, "Currency symbol", "Just for labels. Nothing is converted.")
    inp(s, 6, g("currency", "$"))
    s["A7"] = "Short unit label"
    s["B7"] = '=IF($B$5="grams","g","oz")'
    s["B7"].fill = CALC_FILL
    s["A8"] = "Grams in one of your units"
    s["B8"] = '=IF($B$5="grams",1,28.349523125)'
    s["B8"].fill = CALC_FILL
    s["B8"].number_format = "0.000000"
    s["D7"] = "These two lines do the unit switching. Leave them as they are."
    s["D7"].font = NOTE
    listdv(s, "B5", "grams,ounces")

    if not brief:
        section(s, 10, "The one thing that trips people up")
        s["A11"] = "Fragrance load and fragrance content are different numbers."
        s["A11"].font = BOLD
        s["A12"] = "Fragrance LOAD is a percentage of the wax on its own."
        s["A13"] = "Fragrance CONTENT is a percentage of the wax and fragrance added together."
        s["A14"] = ("Put 20 g of fragrance into 200 g of wax and you have a 10% load — "
                    "but 9.09% content (20 out of 220 g).")
        s["A15"] = ("Same candle. Two numbers. Use whichever your recipe or your wax sheet "
                    "uses — this sheet always shows you both.")
        s["A15"].font = BOLD

        section(s, 17, "How to measure your jar")
        for i, t in enumerate([
            "1. Put your empty jar on the scale and zero it.",
            "2. Fill it with water to the height you want the wax to reach, leaving room for the lid.",
            "3. Write that water weight down. That is the number this sheet starts from.",
        ]):
            s.cell(row=18 + i, column=1, value=t)

        section(s, 22, "Colour key")
        for i, (t, f) in enumerate([("Type in these", INPUT_FILL),
                                    ("These work themselves out — don't type over them", CALC_FILL),
                                    ("Starting assumptions you can change", ASSUM_FILL)]):
            s.cell(row=23 + i, column=1, value=t)
            cell = s.cell(row=23 + i, column=2)
            cell.fill, cell.border = f, THIN

    # ------------------------------------------------------------ Your Candle
    c = wb.create_sheet(YC)
    for col, w in (("A", 46), ("B", 18), ("C", 8), ("D", 62)):
        c.column_dimensions[col].width = w
    c["A1"] = "Your Candle"
    c["A1"].font = H1

    section(c, 3, "Your jar")
    lbl(c, 4, "Water weight of your jar, filled to your line")
    inp(c, 4, g("water_weight", 300), MASS)
    c["C4"] = f"={qSH}!$B$7"
    lbl(c, 5, "Water-to-wax factor",
        "A planning assumption, not a physical constant. Waxes differ — measure your own and change this.")
    inp(c, 5, g("wax_factor", 0.86), "0.00", ASSUM_FILL)
    lbl(c, 6, "Fill weight — how much wax + fragrance fits")
    calc(c, 6, '=IF(OR($B$4="",$B$5=""),"",$B$4*$B$5)', MASS, BOLD)
    c["C6"] = f"={qSH}!$B$7"

    section(c, 8, "Your fragrance")
    lbl(c, 9, "How you measure fragrance", "This sheet shows you both numbers either way.")
    inp(c, 9, g("convention", LOAD_OPT))
    lbl(c, 10, "Fragrance percentage")
    inp(c, 10, g("fragrance_pct", 0.10), PCT)
    lbl(c, 11, "Maximum your wax can hold",
        "Optional. From your wax's spec sheet — enter it the same way you are measuring above.")
    inp(c, 11, g("wax_max_pct"), PCT)
    listdv(c, "B9", f"{LOAD_OPT},{CONTENT_OPT}")

    ready = 'OR($B$6="",$B$10="",$B$10>=1)'
    isload = f'$B$9="{LOAD_OPT}"'
    warnbox(c, 12, f'=IF({ready},"",IF(AND($B$11<>"",$B$10>$B$11),'
                   f'"Above the maximum you entered for this wax ("&TEXT($B$11,"0.0%")&'
                   f'"). Your wax may not hold it.",""))')

    section(c, 14, "One candle")
    lbl(c, 15, "Wax")
    calc(c, 15, f'=IF({ready},"",IF({isload},$B$6/(1+$B$10),$B$6*(1-$B$10)))', MASS, BIG)
    c["C15"] = f"={qSH}!$B$7"
    lbl(c, 16, "Fragrance oil")
    calc(c, 16, f'=IF({ready},"",IF({isload},$B$6*$B$10/(1+$B$10),$B$6*$B$10))', MASS, BIG)
    c["C16"] = f"={qSH}!$B$7"
    lbl(c, 17, "Total fill weight")
    calc(c, 17, '=IF($B$6="","",$B$6)', MASS)
    c["C17"] = f"={qSH}!$B$7"
    lbl(c, 18, "Fragrance load (% of wax)")
    calc(c, 18, f'=IF({ready},"",IF({isload},$B$10,$B$10/(1-$B$10)))', PCT, BOLD)
    lbl(c, 19, "Fragrance content (% of wax + fragrance)")
    calc(c, 19, f'=IF({ready},"",IF({isload},$B$10/(1+$B$10),$B$10))', PCT, BOLD)
    c["D18"] = "Both are shown on purpose. They describe the same candle."
    c["D18"].font = NOTE

    section(c, 21, "Your batch")
    lbl(c, 22, "How many candles in this batch")
    inp(c, 22, g("batch_qty", 12), "0")
    lbl(c, 23, "Extra wax for what stays in the pitcher",
        "Starts at 0%. Raise it if you know how much you normally lose.")
    inp(c, 23, g("melt_loss_pct", 0.0), PCT, ASSUM_FILL)
    lbl(c, 24, "Wax for the whole batch")
    calc(c, 24, '=IF(OR($B$15="",$B$22=""),"",$B$15*$B$22*(1+$B$23))', MASS, BIG)
    c["C24"] = f"={qSH}!$B$7"
    lbl(c, 25, "Fragrance oil for the whole batch")
    calc(c, 25, '=IF(OR($B$16="",$B$22=""),"",$B$16*$B$22*(1+$B$23))', MASS, BIG)
    c["C25"] = f"={qSH}!$B$7"

    # ----------------------------------------------------------- Costs & Price
    p = wb.create_sheet(CP)
    for col, w in (("A", 46), ("B", 18), ("C", 20), ("D", 58)):
        p.column_dimensions[col].width = w
    p["A1"] = "Costs & Price"
    p["A1"].font = H1

    section(p, 3, "What your materials cost")
    for col, txt in (("B", "What you paid"), ("C", "How much that bought"), ("D", "Sold in")):
        p[f"{col}4"] = txt
        p[f"{col}4"].font = BOLD
    lbl(p, 5, "Wax")
    inp(p, 5, g("wax_pack_price", 30.0), MONEY)
    inp(p, 5, g("wax_pack_size", 5), col=3)
    inp(p, 5, g("wax_pack_unit", "kg"), col=4)
    lbl(p, 6, "Fragrance oil")
    inp(p, 6, g("fo_pack_price", 18.0), MONEY)
    inp(p, 6, g("fo_pack_size", 500), col=3)
    inp(p, 6, g("fo_pack_unit", "g"), col=4)
    listdv(p, "D5", "g,kg,oz,lb")
    listdv(p, "D6", "g,kg,oz,lb")

    def gpu(ref):
        return (f'IF({ref}="g",1,IF({ref}="kg",1000,'
                f'IF({ref}="oz",28.349523125,453.59237)))')

    lbl(p, 7, "Cost of wax, per unit you weigh in")
    calc(p, 7, f'=IF(OR($B$5="",$C$5="",$C$5=0),"",$B$5/($C$5*{gpu("$D$5")}/{qSH}!$B$8))', "0.0000")
    lbl(p, 8, "Cost of fragrance oil, per unit you weigh in")
    calc(p, 8, f'=IF(OR($B$6="",$C$6="",$C$6=0),"",$B$6/($C$6*{gpu("$D$6")}/{qSH}!$B$8))', "0.0000")

    section(p, 10, "Parts for one candle")
    for i, (label, key, dflt) in enumerate([
            ("Vessel", "vessel", 1.80), ("Wick", "wick", 0.12), ("Lid", "lid", 0.60),
            ("Label", "label", 0.15), ("Box or packaging", "box", 0.45),
            ("Anything else", "other", 0.0)]):
        lbl(p, 11 + i, label)
        inp(p, 11 + i, g(key, dflt), MONEY)

    section(p, 18, "Your time (optional)")
    lbl(p, 19, "Pay myself for my time",
        "Your time is a real cost. If you skip this, your price only covers materials.")
    inp(p, 19, g("labour_on", "No"))
    lbl(p, 20, "Minutes to make one candle")
    inp(p, 20, g("minutes_per_candle"), "0")
    lbl(p, 21, "What I pay myself per hour")
    inp(p, 21, g("hourly_rate"), MONEY)
    listdv(p, "B19", "Yes,No")

    section(p, 23, "Your running costs (optional)")
    lbl(p, 24, "Include my monthly running costs",
        "Rent, insurance, subscriptions — costs you pay whether or not you make a candle this month.")
    inp(p, 24, g("overhead_on", "No"))
    lbl(p, 25, "My monthly running costs")
    inp(p, 25, g("monthly_overhead"), MONEY)
    lbl(p, 26, "Candles I make in a month")
    inp(p, 26, g("monthly_volume"), "0")
    listdv(p, "B24", "Yes,No")
    warnbox(p, 27, '=IF(AND($B$24="Yes",OR($B$26="",$B$26=0)),'
                   '"Enter how many candles you make in a month, or switch running costs off.","")')

    section(p, 29, "What one candle costs you")
    lbl(p, 30, "Wax + fragrance")
    calc(p, 30, f'=IF(OR({qYC}!$B$24="",$B$7="",$B$8="",{qYC}!$B$22=""),"",'
                f'({qYC}!$B$24*$B$7+{qYC}!$B$25*$B$8)/{qYC}!$B$22)', MONEY)
    lbl(p, 31, "Other parts")
    calc(p, 31, "=SUM($B$11:$B$16)", MONEY)
    lbl(p, 32, "Your time")
    calc(p, 32, '=IF($B$19<>"Yes",0,IF(OR($B$20="",$B$21=""),"",$B$20/60*$B$21))', MONEY)
    lbl(p, 33, "Share of running costs")
    calc(p, 33, '=IF($B$24<>"Yes",0,IF(OR($B$25="",$B$26="",$B$26=0),"",$B$25/$B$26))', MONEY)
    lbl(p, 34, "TOTAL cost per candle")
    calc(p, 34, '=IF(OR($B$30="",$B$32="",$B$33=""),"",$B$30+$B$31+$B$32+$B$33)', MONEY, BIG)

    section(p, 36, "Where you're selling")
    lbl(p, 37, "Where am I selling this",
        "Fees change. Look up your marketplace's current fees and type them in — "
        "this sheet does not guess them for you.")
    inp(p, 37, g("channel_name"))
    for i, (label, key) in enumerate([("Selling fee %", "fee_pct_1"),
                                      ("Payment processing %", "fee_pct_2"),
                                      ("Any other % fee", "fee_pct_3")]):
        lbl(p, 38 + i, label)
        inp(p, 38 + i, g(key), PCT)
    lbl(p, 41, "Fixed fee per order")
    inp(p, 41, g("fee_fixed"), MONEY)
    lbl(p, 42, "Percentage fees apply to")
    inp(p, 42, g("fee_basis", BASIS_PRICE))
    listdv(p, "B42", f"{BASIS_PRICE},{BASIS_SHIP}")
    lbl(p, 43, "Shipping I charge the buyer")
    inp(p, 43, g("shipping_charged", 0), MONEY)
    lbl(p, 44, "What shipping actually costs me")
    inp(p, 44, g("shipping_cost", 0), MONEY)

    F = "SUM($B$38:$B$40)"
    FIX = 'IF($B$41="",0,$B$41)'
    SC = 'IF($B$43="",0,$B$43)'
    SK = 'IF($B$44="",0,$B$44)'
    DEN = f"(1-{F}-$B$47)"
    NUM = f'({FIX}+$B$34+{SK}-IF($B$42="{BASIS_SHIP}",{SC}*(1-{F}),{SC}))'

    section(p, 46, "Your price")
    lbl(p, 47, "Profit margin I want", "As a share of the price you charge.")
    inp(p, 47, g("target_margin", 0.40), PCT)
    lbl(p, 48, "Price to charge")
    calc(p, 48, f'=IF(OR($B$34="",$B$47=""),"",IF({DEN}<=0,"",{NUM}/{DEN}))', MONEY, BIG)
    warnbox(p, 49, f'=IF(OR($B$34="",$B$47=""),"",IF({DEN}<=0,'
                   f'"A "&TEXT($B$47,"0%")&" margin isn\'t reachable with fees of "&'
                   f'TEXT({F},"0.0%")&". Lower the margin or the fees — there is no price that works.",'
                   f'IF($B$48<=0,"Check your shipping and fee figures — this comes out at or below zero.","")))')
    lbl(p, 50, "Fees on that sale")
    calc(p, 50, f'=IF($B$48="","",{F}*IF($B$42="{BASIS_SHIP}",$B$48+{SC},$B$48)+{FIX})', MONEY)
    lbl(p, 51, "You receive")
    calc(p, 51, f'=IF($B$48="","",$B$48+{SC}-$B$50)', MONEY)
    lbl(p, 52, "Your profit")
    calc(p, 52, f'=IF($B$48="","",$B$51-$B$34-{SK})', MONEY, BOLD)
    lbl(p, 53, "Margin you actually get")
    calc(p, 53, '=IF(OR($B$48="",$B$48=0),"",$B$52/$B$48)', PCT, BOLD)
    lbl(p, 54, "Markup on your cost")
    calc(p, 54, '=IF(OR($B$34="",$B$34=0,$B$48=""),"",$B$52/$B$34)', PCT, BOLD)
    p["D53"] = ("Margin is profit as a share of your price. Markup is profit as a share of "
                "your cost. They are not the same number.")
    p["D53"].font = NOTE

    section(p, 56, "Wholesale")
    lbl(p, 57, "Wholesale multiplier", "A common starting point is 2 — twice what the candle costs you.")
    inp(p, 57, g("wholesale_multiplier", 2.0), "0.00", ASSUM_FILL)
    lbl(p, 58, "Wholesale price")
    calc(p, 58, '=IF(OR($B$34="",$B$57=""),"",$B$34*$B$57)', MONEY, BIG)
    lbl(p, 59, "A shop reselling at twice that would charge")
    calc(p, 59, '=IF($B$58="","",$B$58*2)', MONEY)
    warnbox(p, 60, '=IF($B$58="","",IF($B$58<$B$34,'
                   '"This wholesale price is below what the candle costs you.",""))')


def add_reference(wb):
    r = wb.create_sheet("Reference")
    for col, w in (("A", 44), ("B", 18), ("C", 76)):
        r.column_dimensions[col].width = w
    r["A1"] = "Reference"
    r["A1"].font = H1

    section(r, 3, "What this sheet does not do", 3)
    r["A4"] = "This workbook does not choose your wick."
    r["A4"].font = Font(bold=True, size=12, color="C62828")
    r["A5"] = ("Wick size cannot be calculated. It depends on your wax, fragrance load, dye, and the "
               "diameter and shape of your vessel — the only way to know is to burn a test candle and "
               "watch the melt pool.")
    r["A6"] = "Use the burn test log that came with this sheet for that."
    r["A6"].font = BOLD

    section(r, 8, "Starting assumptions — all of them, and where to change them", 3)
    for col, txt in (("A", "Assumption"), ("B", "Starts at"), ("C", "Why, and where to change it")):
        r[f"{col}9"] = txt
        r[f"{col}9"].font = BOLD
    for i, (a, b, cc) in enumerate([
        ("Water-to-wax factor", "0.86",
         "Wax is lighter than water — around 86% of its density. A planning assumption, not a constant. "
         "Waxes differ. Change it on Your Candle."),
        ("Extra wax for the pitcher", "0%",
         "Starts at zero, because how much you lose depends on your pitcher and how you pour. "
         "Change it on Your Candle."),
        ("Wholesale multiplier", "2.00",
         "A common starting point is twice what the candle costs you. Change it on Costs & Price."),
        ("Selling fees", "blank",
         "Left empty on purpose. Fees change, and they differ by marketplace and country. "
         "Look up yours and type them in on Costs & Price."),
        ("Your time and running costs", "off",
         "Both optional. Switch them on when you want your price to cover them."),
    ]):
        r.cell(row=10 + i, column=1, value=a)
        r.cell(row=10 + i, column=2, value=b)
        r.cell(row=10 + i, column=3, value=cc)

    section(r, 17, "Fragrance load and fragrance content", 3)
    for i, (a, cc) in enumerate([
        ("Fragrance load", "The fragrance as a percentage of the wax on its own."),
        ("Fragrance content", "The fragrance as a percentage of the wax and fragrance added together."),
        ("The worked example",
         "20 g of fragrance in 200 g of wax is a 10% load, and 9.09% content (20 out of 220 g). Same candle."),
        ("A handy reference point", "1 oz of fragrance per 1 lb of wax is a 6.25% load."),
    ]):
        r.cell(row=18 + i, column=1, value=a).font = BOLD
        r.cell(row=18 + i, column=3, value=cc)

    section(r, 23, "Selling fees — what the boxes mean", 3)
    for i, (a, cc) in enumerate([
        ("Selling fee %", "What the marketplace charges you for making the sale."),
        ("Payment processing %", "What the payment provider charges for taking the money."),
        ("Any other % fee", "Anything else charged as a percentage — advertising, for example."),
        ("Fixed fee per order", "A flat amount per order rather than a percentage."),
        ("Percentage fees apply to",
         "Some places charge their percentage on the item price plus the shipping you charge. "
         "Others only on the item price. Check yours."),
    ]):
        r.cell(row=24 + i, column=1, value=a).font = BOLD
        r.cell(row=24 + i, column=3, value=cc)

    section(r, 31, "Margin and markup", 3)
    for i, (a, cc) in enumerate([
        ("Margin", "Your profit as a share of the price you charge."),
        ("Markup", "Your profit as a share of what the candle cost you."),
        ("Why it matters",
         "Adding 40% to your cost does not give you a 40% margin. This sheet works out the price that "
         "actually gives you the margin you asked for, after fees."),
    ]):
        r.cell(row=32 + i, column=1, value=a).font = BOLD
        r.cell(row=32 + i, column=3, value=cc)


def finish(wb):
    for ws in wb.worksheets:
        ws.sheet_view.showGridLines = False
        ws.freeze_panes = "A2"


def build(path, o=None):
    wb = Workbook()
    wb.remove(wb.active)
    add_case(wb, o)
    add_reference(wb)
    finish(wb)
    wb.save(path)
    return path


if __name__ == "__main__":
    build(sys.argv[1] if len(sys.argv) > 1 else "dist/candle-calculator.xlsx")
    print("built")
