"""
Builds the buyer workbook.

Copy rule: this is a spreadsheet, not a document. Labels are labels — a few
words, no sentences, no commentary about how the sheet works. Explanation lives
in the Start Here PDF. The only full sentences here are warning messages,
because a warning is a sentence in every spreadsheet.

Scope rule: this workbook does arithmetic on numbers the buyer enters. It does
not recommend a fee, a tax rate, a caseload or a sliding-scale policy, and it
contains nothing clinical. The buyer is a practitioner running a business.
"""

import sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation

INPUT_FILL = PatternFill("solid", fgColor="FFF8E1")
CALC_FILL = PatternFill("solid", fgColor="F1F3F4")
ASSUM_FILL = PatternFill("solid", fgColor="E3F2FD")
HEAD_FILL = PatternFill("solid", fgColor="1B3A4B")

H1 = Font(bold=True, size=14, color="1B3A4B")
H2 = Font(bold=True, size=10, color="FFFFFF")
BOLD = Font(bold=True)
NOTE = Font(size=9, color="607D8B", italic=True)
WARN = Font(bold=True, size=10, color="C62828")
BIG = Font(bold=True, size=12, color="1B3A4B")

THIN = Border(*[Side("thin", color="CFD8DC")] * 4)
MONEY = '#,##0.00'
PCT = '0%'
PCT1 = '0.0%'
NUM = '0'
NUM1 = '0.0'

PR, CO, RE, RF = "Practice", "Costs", "Results", "Reference"


def section(ws, row, text, span=4):
    for i in range(span):
        ws.cell(row=row, column=1 + i).fill = HEAD_FILL
    c = ws.cell(row=row, column=1, value=text)
    c.font = H2


def row(ws, r, label, note=None):
    ws.cell(row=r, column=1, value=label)
    if note:
        n = ws.cell(row=r, column=4, value=note)
        n.font = NOTE


def inp(ws, r, value, fmt=None, col=2, fill=INPUT_FILL):
    c = ws.cell(row=r, column=col, value=value)
    c.fill, c.border = fill, THIN
    if fmt:
        c.number_format = fmt
    return c


def calc(ws, r, formula, fmt=None, font=None, col=2):
    c = ws.cell(row=r, column=col, value=formula)
    c.fill, c.border = CALC_FILL, THIN
    if fmt:
        c.number_format = fmt
    if font:
        c.font = font
    return c


def warn(ws, r, formula, col=2):
    c = ws.cell(row=r, column=col, value=formula)
    c.font = WARN
    return c


def g(o, key, default):
    return default if not o or key not in o else o[key]


# --- Practice -----------------------------------------------------------------

TIERS = [
    ("Full fee", 150, 12, 0.90),
    ("Sliding scale A", 110, 4, 0.90),
    ("Sliding scale B", 80, 2, 0.90),
    ("Insurance", 95, 4, 0.85),
    ("", "", "", ""),
    ("", "", "", ""),
]
T0, T1 = 12, 17  # tier rows


def add_practice(wb, o=None):
    p = wb.create_sheet(PR)
    p["A1"] = "Private Practice Planner"
    p["A1"].font = H1

    section(p, 3, "Setup")
    row(p, 4, "Weeks worked per year", "allow for time off")
    inp(p, 4, g(o, "weeks", 46), NUM)
    row(p, 5, "Currency")
    inp(p, 5, g(o, "currency", "$"))
    row(p, 6, "Target take-home", "per year, after your tax set-aside")
    inp(p, 6, g(o, "target", 60000), MONEY)
    row(p, 7, "Tax set-aside", "your own rate")
    inp(p, 7, g(o, "tax", 0.25), PCT, fill=ASSUM_FILL)

    section(p, 9, "Caseload", 7)
    for col, txt in ((1, "Fee tier"), (2, "Fee"), (3, "Sessions/week"),
                     (4, "Attendance"), (5, "Attended/year"),
                     (6, "Revenue/year"), (7, "Check")):
        c = p.cell(row=T0 - 1, column=col, value=txt)
        c.font = BOLD

    tiers = g(o, "tiers", TIERS)
    for i, (name, fee, sess, att) in enumerate(tiers):
        r = T0 + i
        inp(p, r, name, col=1)
        inp(p, r, fee, MONEY, col=2)
        inp(p, r, sess, NUM1, col=3)
        inp(p, r, att, PCT, col=4)
        calc(p, r, f'=IF(OR($C{r}="",$D{r}=""),"",$C{r}*$D{r}*$B$4)', NUM1, col=5)
        calc(p, r, f'=IF(OR($B{r}="",$C{r}="",$D{r}=""),"",$B{r}*$C{r}*$D{r}*$B$4)',
             MONEY, col=6)
        p.cell(row=r, column=7, value=(
            f'=IF(AND($A{r}="",$B{r}="",$C{r}="",$D{r}=""),"",'
            f'IF($A{r}="","Name this tier.",'
            f'IF($B{r}="","Enter a fee.",'
            f'IF($C{r}="","Enter sessions per week.",'
            f'IF($D{r}="","Enter an attendance rate.",'
            f'IF($D{r}>1,"Attendance cannot be above 100%.",'
            f'IF($D{r}<0,"Attendance cannot be below 0%.",'
            f'IF($B{r}<0,"Fee cannot be negative.",'
            f'IF($C{r}<0,"Sessions per week cannot be negative.","READY")))))))))'
        )).font = NOTE

    section(p, 19, "Totals")
    row(p, 20, "Sessions per week")
    calc(p, 20, f"=SUM($C${T0}:$C${T1})", NUM1)
    row(p, 21, "Sessions attended per year")
    calc(p, 21, f"=SUM($E${T0}:$E${T1})", NUM1)
    row(p, 22, "Revenue per year")
    calc(p, 22, f"=SUM($F${T0}:$F${T1})", MONEY, BIG)
    row(p, 23, "Average fee per session held", "revenue ÷ sessions attended")
    calc(p, 23, '=IFERROR($B$22/$B$21,"")', MONEY)
    row(p, 24, "Average per slot on the calendar", "counts the no-shows")
    calc(p, 24, '=IFERROR($B$22/($B$20*$B$4),"")', MONEY)

    warn(p, 26, f'=IF($B$20=0,"Enter at least one fee tier with sessions per week.","")')

    for col, w in (("A", 30), ("B", 15), ("C", 15), ("D", 34), ("E", 15),
                   ("F", 16), ("G", 34)):
        p.column_dimensions[col].width = w
    return p


# --- Costs --------------------------------------------------------------------

MONTHLY = [("Office rent", 600), ("Practice software", 69), ("Phone and internet", 45),
           ("Clinical supervision", 150), ("Bookkeeping", 60),
           ("Directory listings", 30), ("Other", 0), ("", ""), ("", ""), ("", "")]
ANNUAL = [("Liability insurance", 600), ("License renewal", 200),
          ("Continuing education", 500), ("Professional membership", 300),
          ("Other", 0), ("", ""), ("", ""), ("", "")]
M0, M1 = 5, 14
A0, A1_ = 20, 27


def add_costs(wb, o=None):
    c = wb.create_sheet(CO)
    c["A1"] = "Costs"
    c["A1"].font = H1

    section(c, 3, "Every month")
    c.cell(row=4, column=1, value="Item").font = BOLD
    c.cell(row=4, column=2, value="Per month").font = BOLD
    for i, (name, amt) in enumerate(g(o, "monthly", MONTHLY)):
        r = M0 + i
        inp(c, r, name, col=1)
        inp(c, r, amt, MONEY, col=2)
    row(c, 16, "Monthly total")
    calc(c, 16, f"=SUM($B${M0}:$B${M1})", MONEY)

    section(c, 18, "Once a year")
    c.cell(row=19, column=1, value="Item").font = BOLD
    c.cell(row=19, column=2, value="Per year").font = BOLD
    for i, (name, amt) in enumerate(g(o, "annual", ANNUAL)):
        r = A0 + i
        inp(c, r, name, col=1)
        inp(c, r, amt, MONEY, col=2)
    row(c, 29, "Annual total")
    calc(c, 29, f"=SUM($B${A0}:$B${A1_})", MONEY)

    section(c, 31, "Total")
    row(c, 32, "Costs per year")
    calc(c, 32, "=$B$16*12+$B$29", MONEY, BIG)

    for col, w in (("A", 30), ("B", 15), ("C", 4), ("D", 34)):
        c.column_dimensions[col].width = w
    return c


# --- Results ------------------------------------------------------------------

def add_results(wb, o=None):
    r = wb.create_sheet(RE)
    r["A1"] = "Results"
    r["A1"].font = H1

    section(r, 3, "As things stand")
    row(r, 4, "Revenue")
    calc(r, 4, f"='{PR}'!$B$22", MONEY)
    row(r, 5, "Costs")
    calc(r, 5, f"='{CO}'!$B$32", MONEY)
    row(r, 6, "Before tax")
    calc(r, 6, '=IF(OR($B$4="",$B$5=""),"",$B$4-$B$5)', MONEY)
    row(r, 7, "Tax set-aside")
    calc(r, 7, f'=IF($B$6="","",MAX(0,$B$6)*\'{PR}\'!$B$7)', MONEY)
    row(r, 8, "Take-home")
    calc(r, 8, '=IF($B$6="","",$B$6-$B$7)', MONEY, BIG)
    row(r, 9, "Target")
    calc(r, 9, f"='{PR}'!$B$6", MONEY)
    row(r, 10, "Difference", "negative means short of target")
    calc(r, 10, '=IF($B$8="","",$B$8-$B$9)', MONEY)

    section(r, 12, "What the target needs")
    row(r, 13, "Revenue needed")
    calc(r, 13, f'=IFERROR(\'{PR}\'!$B$6/(1-\'{PR}\'!$B$7)+\'{CO}\'!$B$32,"")', MONEY)
    row(r, 14, "Sessions to cover costs", "held sessions per year")
    calc(r, 14, f'=IFERROR(ROUNDUP(\'{CO}\'!$B$32/\'{PR}\'!$B$23,0),"")', NUM)
    row(r, 15, "Sessions to reach target", "held sessions per year")
    calc(r, 15, f'=IFERROR(ROUNDUP($B$13/\'{PR}\'!$B$23,0),"")', NUM)
    row(r, 16, "Slots per week to reach target", "counts the no-shows")
    calc(r, 16, f'=IFERROR(ROUNDUP($B$13/(\'{PR}\'!$B$24*\'{PR}\'!$B$4),0),"")', NUM)
    warn(r, 17, f'=IF(\'{PR}\'!$B$7>=1,"A tax set-aside of 100% or more leaves nothing to take home.","")')

    section(r, 19, "How many reduced-fee slots you can carry")
    row(r, 20, "Full fee")
    inp(r, 20, g(o, "full_fee", 150), MONEY)
    row(r, 21, "Reduced fee")
    inp(r, 21, g(o, "red_fee", 80), MONEY)
    row(r, 22, "Slots per week")
    inp(r, 22, g(o, "slots", 22), NUM1)
    row(r, 23, "Attendance")
    inp(r, 23, g(o, "att", 0.90), PCT)
    row(r, 24, "Reduced-fee slots", "and still reach the target")
    calc(r, 24, (
        '=IFERROR(IF(OR($B$20="",$B$21="",$B$22="",$B$23="",$B$13=""),"",'
        'IF($B$20<=$B$21,"",'
        f'ROUNDDOWN(MIN($B$22,MAX(0,($B$22*$B$20-$B$13/(\'{PR}\'!$B$4*$B$23))/($B$20-$B$21))),0)'
        ')),"")'
    ), NUM, BIG)
    warn(r, 25, (
        '=IF(OR($B$20="",$B$21="",$B$22="",$B$23=""),"",'
        'IF($B$20<=$B$21,"The reduced fee has to be below the full fee.",'
        'IF($B$24="","",'
        'IF($B$24<=0,"At this target every slot needs to be at the full fee.",'
        'IF($B$24>=$B$22,"The target is covered even with every slot at the reduced fee.","")))))'
    ))

    for col, w in (("A", 32), ("B", 16), ("C", 4), ("D", 34)):
        r.column_dimensions[col].width = w
    return r


# --- Reference ----------------------------------------------------------------

def add_reference(wb):
    r = wb.create_sheet(RF)
    r["A1"] = "Reference"
    r["A1"].font = H1

    section(r, 3, "What this is not", 3)
    r["A4"] = "Not advice"
    r["A4"].font = Font(bold=True, size=11, color="C62828")
    r["C4"] = ("Arithmetic on the numbers you enter. It does not recommend a fee, a tax rate, "
               "a caseload or a sliding-scale policy.")
    r["A5"] = "No clinical content"
    r["C5"] = "Nothing here concerns a client, a diagnosis or a treatment."
    r["A6"] = "Not a tax return"
    r["C6"] = "The tax set-aside is a rate you choose. Check it with your accountant."

    section(r, 8, "Terms", 3)
    for i, (a, cc) in enumerate([
        ("Session held", "A session that actually happened. No-shows are not held sessions."),
        ("Slot", "A place on your calendar. Some slots do not become held sessions."),
        ("Attendance", "Held sessions ÷ slots. 90% means one slot in ten does not happen."),
        ("Average per slot", "What a calendar slot is worth on average once no-shows are counted."),
        ("Take-home", "Revenue minus costs minus your tax set-aside."),
        ("Reduced-fee slots", "How many slots can be at the reduced fee with the target still reached."),
    ]):
        r.cell(row=9 + i, column=1, value=a).font = BOLD
        r.cell(row=9 + i, column=3, value=cc)

    section(r, 16, "Editable assumptions", 3)
    for col, txt in (("A", "Assumption"), ("B", "Default"), ("C", "Change it on")):
        r[f"{col}17"] = txt
        r[f"{col}17"].font = BOLD
    for i, (a, b, cc) in enumerate([
        ("Weeks worked per year", "46", "Practice"),
        ("Tax set-aside", "25%", "Practice · your own rate"),
        ("Attendance per tier", "85-90%", "Practice · use your own history"),
        ("Fee tiers", "4 shown, 6 available", "Practice"),
    ]):
        r.cell(row=18 + i, column=1, value=a)
        r.cell(row=18 + i, column=2, value=b)
        r.cell(row=18 + i, column=3, value=cc)

    section(r, 23, "Cell colors", 3)
    for i, (fill, txt) in enumerate([(INPUT_FILL, "Enter your own numbers"),
                                     (CALC_FILL, "Calculated automatically"),
                                     (ASSUM_FILL, "Editable assumption")]):
        cell = r.cell(row=24 + i, column=1)
        cell.fill, cell.border = fill, THIN
        r.cell(row=24 + i, column=3, value=txt)

    for col, w in (("A", 24), ("B", 20), ("C", 78)):
        r.column_dimensions[col].width = w
    return r


def finish(wb):
    for ws in wb.worksheets:
        ws.sheet_view.showGridLines = False
        ws.freeze_panes = "A2"
    # Recalculate on open rather than showing whatever was cached at build time.
    wb.calculation.fullCalcOnLoad = True


def build(path, o=None):
    wb = Workbook()
    wb.remove(wb.active)
    add_practice(wb, o)
    add_costs(wb, o)
    add_results(wb, o)
    add_reference(wb)
    finish(wb)
    wb.save(path)
    return path


if __name__ == "__main__":
    build(sys.argv[1] if len(sys.argv) > 1 else "dist/private-practice-planner.xlsx")
    print("built")
