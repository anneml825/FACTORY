"""
Builds the buyer workbook.

Copy rule: this is a spreadsheet, not a document. Labels are labels — a few
words, no sentences, no commentary about how the sheet works. Explanation lives
in the Start Here PDF that ships with it. The only full sentences here are
warning messages, because a warning is a sentence in every spreadsheet.

The .xlsx IS the product. It is delivered to the buyer directly as a download,
so there is no sharing layer, no account requirement, and nothing of the seller's
attached to the file.
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

H1 = Font(bold=True, size=14, color="263238")
H2 = Font(bold=True, size=10, color="FFFFFF")
BOLD = Font(bold=True)
BIG = Font(bold=True, size=12)
HINT = Font(size=9, color="78909C")
WARN = Font(bold=True, size=10, color="C62828")
THIN = Border(left=Side("thin", color="B0BEC5"), right=Side("thin", color="B0BEC5"),
              top=Side("thin", color="B0BEC5"), bottom=Side("thin", color="B0BEC5"))

LOAD_OPT = "Load (% of wax)"
CONTENT_OPT = "Content (% of wax + fragrance)"
BASIS_PRICE = "Item only"
BASIS_SHIP = "Item + shipping"

MASS, PCT, MONEY = "0.0", "0.0%", "0.00"


def section(ws, row, text, width=4):
    ws.cell(row=row, column=1, value=text).font = H2
    for c in range(1, width + 1):
        ws.cell(row=row, column=c).fill = HEAD_FILL


def row(ws, r, label, hint=None):
    ws.cell(row=r, column=1, value=label)
    if hint:
        ws.cell(row=r, column=4, value=hint).font = HINT


def inp(ws, r, value, fmt=None, fill=INPUT_FILL, col=2):
    c = ws.cell(row=r, column=col, value=value)
    c.fill, c.border = fill, THIN
    if fmt:
        c.number_format = fmt
    return c


def calc(ws, r, formula, fmt=None, font=None):
    c = ws.cell(row=r, column=2, value=formula)
    c.fill, c.border = CALC_FILL, THIN
    if fmt:
        c.number_format = fmt
    if font:
        c.font = font
    return c


def warnbox(ws, r, formula):
    c = calc(ws, r, formula)
    c.font, c.fill, c.border = WARN, WHITE, Border()
    ws.merge_cells(f"B{r}:D{r}")


def listdv(ws, cell, options):
    d = DataValidation(type="list", formula1='"%s"' % options, allow_blank=True)
    ws.add_data_validation(d)
    d.add(ws[cell])


def add_case(wb, o=None, suffix="", brief=False):
    o = o or {}
    g = lambda k, d=None: o.get(k, d)
    CA, CP = f"Candle{suffix}", f"Costs & Price{suffix}"
    qCA = f"'{CA}'"
    UNIT = f'IF({qCA}!$B$3="grams","g","oz")'
    GPW = f'IF({qCA}!$B$3="grams",1,28.349523125)'

    # ----------------------------------------------------------------- Candle
    c = wb.create_sheet(CA)
    for col, w in (("A", 26), ("B", 16), ("C", 6), ("D", 44)):
        c.column_dimensions[col].width = w
    c["A1"] = "Candle"
    c["A1"].font = H1

    row(c, 3, "Weigh in")
    inp(c, 3, g("unit_system", "grams"))
    listdv(c, "B3", "grams,ounces")
    row(c, 4, "Currency")
    inp(c, 4, g("currency", "$"))

    section(c, 6, "Jar")
    row(c, 7, "Water weight", "jar filled to your line")
    inp(c, 7, g("water_weight", 300), MASS)
    c["C7"] = f"={UNIT}"
    row(c, 8, "Wax factor", "editable assumption — wax density varies by type")
    inp(c, 8, g("wax_factor", 0.86), "0.00", ASSUM_FILL)
    row(c, 9, "Fill weight")
    calc(c, 9, '=IF(OR($B$7="",$B$8=""),"",$B$7*$B$8)', MASS, BOLD)
    c["C9"] = f"={UNIT}"

    section(c, 11, "Fragrance")
    row(c, 12, "Measured as", "load = % of wax · content = % of wax + fragrance")
    inp(c, 12, g("convention", LOAD_OPT))
    listdv(c, "B12", f"{LOAD_OPT},{CONTENT_OPT}")
    row(c, 13, "Fragrance %")
    inp(c, 13, g("fragrance_pct", 0.10), PCT)
    row(c, 14, "Wax maximum", "optional — from your wax spec sheet")
    inp(c, 14, g("wax_max_pct"), PCT)

    ready = 'OR($B$9="",$B$13="",$B$13>=1)'
    isload = f'$B$12="{LOAD_OPT}"'
    warnbox(c, 15, f'=IF({ready},"",IF(AND($B$14<>"",$B$13>$B$14),'
                   f'"Above the maximum you entered ("&TEXT($B$14,"0.0%")&"). Your wax may not hold it.",""))')

    section(c, 17, "Per candle")
    row(c, 18, "Wax")
    calc(c, 18, f'=IF({ready},"",IF({isload},$B$9/(1+$B$13),$B$9*(1-$B$13)))', MASS, BIG)
    c["C18"] = f"={UNIT}"
    row(c, 19, "Fragrance oil")
    calc(c, 19, f'=IF({ready},"",IF({isload},$B$9*$B$13/(1+$B$13),$B$9*$B$13))', MASS, BIG)
    c["C19"] = f"={UNIT}"
    row(c, 20, "Fill weight")
    calc(c, 20, '=IF($B$9="","",$B$9)', MASS)
    c["C20"] = f"={UNIT}"
    row(c, 21, "Load", "% of wax")
    calc(c, 21, f'=IF({ready},"",IF({isload},$B$13,$B$13/(1-$B$13)))', PCT, BOLD)
    row(c, 22, "Content", "% of wax + fragrance")
    calc(c, 22, f'=IF({ready},"",IF({isload},$B$13/(1+$B$13),$B$13))', PCT, BOLD)

    section(c, 24, "Batch")
    row(c, 25, "Candles")
    inp(c, 25, g("batch_qty", 12), "0")
    row(c, 26, "Pitcher loss", "extra wax left in the pitcher")
    inp(c, 26, g("melt_loss_pct", 0.0), PCT, ASSUM_FILL)
    row(c, 27, "Wax")
    calc(c, 27, '=IF(OR($B$18="",$B$25=""),"",$B$18*$B$25*(1+$B$26))', MASS, BIG)
    c["C27"] = f"={UNIT}"
    row(c, 28, "Fragrance oil")
    calc(c, 28, '=IF(OR($B$19="",$B$25=""),"",$B$19*$B$25*(1+$B$26))', MASS, BIG)
    c["C28"] = f"={UNIT}"

    # ---------------------------------------------------------- Costs & Price
    p = wb.create_sheet(CP)
    for col, w in (("A", 26), ("B", 16), ("C", 14), ("D", 44)):
        p.column_dimensions[col].width = w
    p["A1"] = "Costs & Price"
    p["A1"].font = H1

    section(p, 3, "Materials")
    for col, txt in (("B", "Price paid"), ("C", "Quantity"), ("D", "Unit")):
        p[f"{col}4"] = txt
        p[f"{col}4"].font = BOLD
    row(p, 5, "Wax")
    inp(p, 5, g("wax_pack_price", 30.0), MONEY)
    inp(p, 5, g("wax_pack_size", 5), col=3)
    inp(p, 5, g("wax_pack_unit", "kg"), col=4)
    row(p, 6, "Fragrance oil")
    inp(p, 6, g("fo_pack_price", 18.0), MONEY)
    inp(p, 6, g("fo_pack_size", 500), col=3)
    inp(p, 6, g("fo_pack_unit", "g"), col=4)
    listdv(p, "D5", "g,kg,oz,lb")
    listdv(p, "D6", "g,kg,oz,lb")

    def gpu(ref):
        return f'IF({ref}="g",1,IF({ref}="kg",1000,IF({ref}="oz",28.349523125,453.59237)))'

    row(p, 7, "Wax per unit")
    calc(p, 7, f'=IF(OR($B$5="",$C$5="",$C$5=0),"",$B$5/($C$5*{gpu("$D$5")}/{GPW}))', "0.0000")
    row(p, 8, "Fragrance per unit")
    calc(p, 8, f'=IF(OR($B$6="",$C$6="",$C$6=0),"",$B$6/($C$6*{gpu("$D$6")}/{GPW}))', "0.0000")

    section(p, 10, "Parts per candle")
    for i, (label, key, dflt) in enumerate([
            ("Vessel", "vessel", 1.80), ("Wick", "wick", 0.12), ("Lid", "lid", 0.60),
            ("Label", "label", 0.15), ("Packaging", "box", 0.45), ("Other", "other", 0.0)]):
        row(p, 11 + i, label)
        inp(p, 11 + i, g(key, dflt), MONEY)

    section(p, 18, "Labor")
    row(p, 19, "Include", "optional")
    inp(p, 19, g("labour_on", "No"))
    listdv(p, "B19", "Yes,No")
    row(p, 20, "Minutes per candle")
    inp(p, 20, g("minutes_per_candle"), "0")
    row(p, 21, "Hourly rate")
    inp(p, 21, g("hourly_rate"), MONEY)

    section(p, 23, "Overhead")
    row(p, 24, "Include", "optional — rent, insurance, subscriptions")
    inp(p, 24, g("overhead_on", "No"))
    listdv(p, "B24", "Yes,No")
    row(p, 25, "Monthly cost")
    inp(p, 25, g("monthly_overhead"), MONEY)
    row(p, 26, "Candles per month")
    inp(p, 26, g("monthly_volume"), "0")
    warnbox(p, 27, '=IF(AND($B$24="Yes",OR($B$26="",$B$26=0)),'
                   '"Enter candles per month, or set Include to No.","")')

    section(p, 29, "Cost per candle")
    row(p, 30, "Wax + fragrance")
    calc(p, 30, f'=IF(OR({qCA}!$B$27="",$B$7="",$B$8="",{qCA}!$B$25=""),"",'
                f'({qCA}!$B$27*$B$7+{qCA}!$B$28*$B$8)/{qCA}!$B$25)', MONEY)
    row(p, 31, "Parts")
    calc(p, 31, "=SUM($B$11:$B$16)", MONEY)
    row(p, 32, "Labor")
    calc(p, 32, '=IF($B$19<>"Yes",0,IF(OR($B$20="",$B$21=""),"",$B$20/60*$B$21))', MONEY)
    row(p, 33, "Overhead")
    calc(p, 33, '=IF($B$24<>"Yes",0,IF(OR($B$25="",$B$26="",$B$26=0),"",$B$25/$B$26))', MONEY)
    row(p, 34, "Total")
    calc(p, 34, '=IF(OR($B$30="",$B$32="",$B$33=""),"",$B$30+$B$31+$B$32+$B$33)', MONEY, BIG)

    section(p, 36, "Selling fees")
    row(p, 37, "Channel", "look up your marketplace's current fees")
    inp(p, 37, g("channel_name"))
    for i, (label, key) in enumerate([("Selling fee", "fee_pct_1"),
                                      ("Processing", "fee_pct_2"),
                                      ("Other %", "fee_pct_3")]):
        row(p, 38 + i, label)
        inp(p, 38 + i, g(key), PCT)
    row(p, 41, "Fixed per order")
    inp(p, 41, g("fee_fixed"), MONEY)
    row(p, 42, "Charged on", "item only, or item + shipping")
    inp(p, 42, g("fee_basis", BASIS_PRICE))
    listdv(p, "B42", f"{BASIS_PRICE},{BASIS_SHIP}")
    row(p, 43, "Shipping charged")
    inp(p, 43, g("shipping_charged", 0), MONEY)
    row(p, 44, "Shipping cost")
    inp(p, 44, g("shipping_cost", 0), MONEY)

    F = "SUM($B$38:$B$40)"
    FIX = 'IF($B$41="",0,$B$41)'
    SC = 'IF($B$43="",0,$B$43)'
    SK = 'IF($B$44="",0,$B$44)'
    DEN = f"(1-{F}-$B$47)"
    NUM = f'({FIX}+$B$34+{SK}-IF($B$42="{BASIS_SHIP}",{SC}*(1-{F}),{SC}))'

    section(p, 46, "Price")
    row(p, 47, "Target margin", "share of price, not markup on cost")
    inp(p, 47, g("target_margin", 0.40), PCT)
    row(p, 48, "Price")
    calc(p, 48, f'=IF(OR($B$34="",$B$47=""),"",IF({DEN}<=0,"",{NUM}/{DEN}))', MONEY, BIG)
    warnbox(p, 49, f'=IF(OR($B$34="",$B$47=""),"",IF({DEN}<=0,'
                   f'"A "&TEXT($B$47,"0%")&" margin is not reachable with fees of "&'
                   f'TEXT({F},"0.0%")&". Lower the margin or the fees.",'
                   f'IF($B$48<=0,"Check the shipping and fee figures — this comes out at or below zero.","")))')
    row(p, 50, "Fees")
    calc(p, 50, f'=IF($B$48="","",{F}*IF($B$42="{BASIS_SHIP}",$B$48+{SC},$B$48)+{FIX})', MONEY)
    row(p, 51, "Net received")
    calc(p, 51, f'=IF($B$48="","",$B$48+{SC}-$B$50)', MONEY)
    row(p, 52, "Profit")
    calc(p, 52, f'=IF($B$48="","",$B$51-$B$34-{SK})', MONEY, BOLD)
    row(p, 53, "Margin achieved")
    calc(p, 53, '=IF(OR($B$48="",$B$48=0),"",$B$52/$B$48)', PCT, BOLD)
    row(p, 54, "Markup", "profit ÷ cost")
    calc(p, 54, '=IF(OR($B$34="",$B$34=0,$B$48=""),"",$B$52/$B$34)', PCT, BOLD)

    section(p, 56, "Wholesale")
    row(p, 57, "Multiplier", "2 = twice your cost")
    inp(p, 57, g("wholesale_multiplier", 2.0), "0.00", ASSUM_FILL)
    row(p, 58, "Wholesale price")
    calc(p, 58, '=IF(OR($B$34="",$B$57=""),"",$B$34*$B$57)', MONEY, BIG)
    row(p, 59, "Shop retail at 2x")
    calc(p, 59, '=IF($B$58="","",$B$58*2)', MONEY)
    warnbox(p, 60, '=IF($B$58="","",IF($B$58<$B$34,'
                   '"Wholesale price is below your cost per candle.",""))')


def add_reference(wb):
    r = wb.create_sheet("Reference")
    for col, w in (("A", 24), ("B", 14), ("C", 58)):
        r.column_dimensions[col].width = w
    r["A1"] = "Reference"
    r["A1"].font = H1

    section(r, 3, "Wick sizing", 3)
    r["A4"] = "Not calculated"
    r["A4"].font = Font(bold=True, size=11, color="C62828")
    r["C4"] = "Depends on wax, fragrance load, dye and jar shape. Confirmed by burn testing."
    r["A5"] = "Use"
    r["C5"] = "The printable Burn Test Log included with this download."

    section(r, 7, "Editable assumptions", 3)
    for col, txt in (("A", "Assumption"), ("B", "Default"), ("C", "Change it on")):
        r[f"{col}8"] = txt
        r[f"{col}8"].font = BOLD
    for i, (a, b, cc) in enumerate([
        ("Wax factor", "0.86", "Candle · wax weighs about 86% of the same volume of water; varies by wax"),
        ("Pitcher loss", "0%", "Candle · the wax left behind in your pouring pitcher"),
        ("Wholesale multiplier", "2.00", "Costs & Price"),
        ("Selling fees", "blank", "Costs & Price · enter your own current rates"),
        ("Labor, overhead", "off", "Costs & Price · both are optional"),
    ]):
        r.cell(row=9 + i, column=1, value=a)
        r.cell(row=9 + i, column=2, value=b)
        r.cell(row=9 + i, column=3, value=cc)

    section(r, 15, "Load and content", 3)
    for i, (a, cc) in enumerate([
        ("Load", "Fragrance as a % of the wax alone."),
        ("Content", "Fragrance as a % of wax + fragrance."),
        ("Example", "20 g fragrance in 200 g wax = 10% load, 9.09% content."),
        ("Reference point", "1 oz fragrance per 1 lb wax = 6.25% load."),
    ]):
        r.cell(row=16 + i, column=1, value=a).font = BOLD
        r.cell(row=16 + i, column=3, value=cc)

    section(r, 21, "Margin and markup", 3)
    for i, (a, cc) in enumerate([
        ("Margin", "Profit ÷ price."),
        ("Markup", "Profit ÷ cost."),
        ("Common error", "Adding 40% to cost gives a 29% margin, not 40%."),
    ]):
        r.cell(row=22 + i, column=1, value=a).font = BOLD
        r.cell(row=22 + i, column=3, value=cc)

    section(r, 26, "Fee cells", 3)
    for i, (a, cc) in enumerate([
        ("Selling fee", "Marketplace commission."),
        ("Processing", "Payment provider."),
        ("Other %", "Advertising or similar."),
        ("Fixed per order", "Flat amount, not a percentage."),
        ("Charged on", "Some charge on item + shipping, others item only."),
    ]):
        r.cell(row=27 + i, column=1, value=a).font = BOLD
        r.cell(row=27 + i, column=3, value=cc)

    section(r, 33, "Cell colors", 3)
    for i, (fill, txt) in enumerate([(INPUT_FILL, "Enter your own numbers"),
                                     (CALC_FILL, "Calculated automatically"),
                                     (ASSUM_FILL, "Editable assumption")]):
        cell = r.cell(row=34 + i, column=1)
        cell.fill, cell.border = fill, THIN
        r.cell(row=34 + i, column=3, value=txt)


def finish(wb):
    for ws in wb.worksheets:
        ws.sheet_view.showGridLines = False
        ws.freeze_panes = "A2"
    # Recalculate on open. Without this a viewer can render whatever values were
    # cached at build time, which is how a shipped workbook shows one stale number
    # beside a correct one.
    wb.calculation.fullCalcOnLoad = True


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
