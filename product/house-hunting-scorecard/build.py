"""
Builds the buyer workbook. Built on product/_kit.

Copy rule: labels are labels. The only full sentences are warnings.

Scope rule: this scores homes against criteria the buyer weights, and totals
monthly costs the buyer enters. It does not estimate a mortgage payment, value a
property, or advise on lending — the buyer enters the payment their lender
quoted, because a spreadsheet guess would be worse than the real number.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "_kit"))
from sheetkit import (Sheet, new_workbook, finish, g, MONEY, NUM, NUM1, PCT1)

ACCENT = "4A5D23"
CR, HM, CO, RS, RF = "Criteria", "Homes", "Costs", "Results", "Reference"

CRIT = [("Commute", 5), ("Neighborhood", 5), ("Condition", 4), ("Kitchen", 4),
        ("Natural light", 4), ("Layout", 3), ("Yard or outdoor space", 3),
        ("Schools", 3), ("Storage", 2), ("Parking", 2)]
C0, C1 = 5, 14                      # criteria rows
H0, H1 = 5, 12                      # home rows
COLS = "CDEFGHIJKL"                 # one column per criterion
HOMES = [("123 Oak Street", 425000), ("88 Larch Avenue", 399000),
         ("17 Mill Lane", 460000), ("", ""), ("", ""), ("", ""), ("", ""), ("", "")]
COSTS = [(2150, 390, 95, 0, 120, 180), (1980, 340, 88, 145, 210, 165),
         (2340, 455, 102, 0, 60, 195), *[("", "", "", "", "", "")] * 5]


def add_criteria(wb, o=None):
    s = Sheet(wb, CR, ACCENT, {"A": 28, "B": 12, "C": 4, "D": 40})
    s.section(3, "What matters to you")
    s.headers(4, ((1, "Criterion"), (2, "Weight")))
    s.label(4, "1 is nice to have, 5 is decisive", col=4)
    for i, (name, w) in enumerate(g(o, "crit", CRIT)):
        s.inp(C0 + i, name, col=1)
        s.inp(C0 + i, w, NUM, col=2)
    s.section(16, "Total")
    s.label(17, "Total weight")
    s.calc(17, f"=SUM($B${C0}:$B${C1})", NUM)
    s.label(18, "Highest possible score", "total weight x 5")
    s.calc(18, "=$B$17*5", NUM)
    s.warn(20, '=IF($B$17=0,"Give at least one criterion a weight.","")')
    return s


def score_formula(r):
    return " + ".join(f"${c}{r}*'{CR}'!$B${C0 + i}" for i, c in enumerate(COLS))


def add_homes(wb, o=None):
    s = Sheet(wb, HM, ACCENT, {"A": 26, "B": 14, "M": 15, "N": 11, "O": 30})
    s.section(3, "Score each home 1 to 5", 15)
    s.headers(4, [(1, "Home"), (2, "Asking price")]
              + [(3 + i, f"={CR}!$A${C0 + i}") for i in range(10)]
              + [(13, "Score"), (14, "Of possible"), (15, "Check")])
    for i, c in enumerate(COLS):
        s.ws.cell(row=4, column=3 + i, value=f"='{CR}'!$A${C0 + i}").font = s.f["BOLD"]
    for i, (name, price) in enumerate(g(o, "homes", HOMES)):
        r = H0 + i
        s.inp(r, name, col=1)
        s.inp(r, price, MONEY, col=2)
        for j, c in enumerate(COLS):
            s.inp(r, g(o, f"s{i}{j}", 3 if name else ""), NUM, col=3 + j)
        s.calc(r, f'=IF($A{r}="","",{score_formula(r)})', NUM, col=13)
        s.calc(r, f'=IFERROR(IF($A{r}="","",$M{r}/\'{CR}\'!$B$18),"")', PCT1, col=14)
        s.ws.cell(row=r, column=15, value=(
            f'=IF($A{r}="","",'
            f'IF($B{r}="","Enter an asking price.",'
            f'IF(OR($C{r}>5,$D{r}>5,$E{r}>5,$F{r}>5,$G{r}>5,$H{r}>5,$I{r}>5,$J{r}>5,$K{r}>5,$L{r}>5),'
            f'"Scores go up to 5.",'
            f'IF(OR($C{r}<0,$D{r}<0,$E{r}<0,$F{r}<0,$G{r}<0,$H{r}<0,$I{r}<0,$J{r}<0,$K{r}<0,$L{r}<0),'
            f'"Scores cannot be negative.","READY"))))'
        )).font = s.f["NOTE"]
    return s


def add_costs(wb, o=None):
    s = Sheet(wb, CO, ACCENT, {"A": 26, "B": 14, "C": 13, "D": 13, "E": 10,
                               "F": 13, "G": 14, "H": 15})
    s.section(3, "What each one costs you every month", 8)
    s.headers(4, ((1, "Home"), (2, "Loan payment"), (3, "Property tax"),
                  (4, "Insurance"), (5, "HOA"), (6, "Commute"),
                  (7, "Maintenance"), (8, "Total")))
    s.label(4, "the figure your lender quoted", col=10)
    for i, vals in enumerate(g(o, "costs", COSTS)):
        r = H0 + i
        s.calc(r, f"='{HM}'!$A{r}", col=1)
        for j, v in enumerate(vals):
            s.inp(r, v, MONEY, col=2 + j)
        s.calc(r, f'=IF(\'{HM}\'!$A{r}="","",SUM($B{r}:$G{r}))', MONEY, col=8)
    return s


def add_results(wb, o=None):
    s = Sheet(wb, RS, ACCENT, {"A": 26, "B": 12, "C": 13, "D": 15, "E": 16, "F": 20})
    s.section(3, "Every home, side by side", 6)
    s.headers(4, ((1, "Home"), (2, "Score"), (3, "Of possible"),
                  (4, "Cost per month"), (5, "Cost per point"), (6, "")))
    for i in range(H0, H1 + 1):
        s.calc(i, f"='{HM}'!$A{i}", col=1)
        s.calc(i, f"='{HM}'!$M{i}", NUM, col=2)
        s.calc(i, f"='{HM}'!$N{i}", PCT1, col=3)
        s.calc(i, f"='{CO}'!$H{i}", MONEY, col=4)
        s.calc(i, f'=IFERROR(IF(OR($B{i}="",$B{i}=0,$D{i}=""),"",$D{i}/$B{i}),"")',
               MONEY, col=5)
        s.ws.cell(row=i, column=6, value=(
            f'=IFERROR(IF($E{i}="","",'
            f'IF($E{i}=MIN($E${H0}:$E${H1}),"Most of what you want per dollar","")),"")'
        )).font = s.f["BIG"]
    s.section(14, "Summary", 6)
    s.label(15, "Highest score")
    s.calc(15, f"=MAX($B${H0}:$B${H1})", NUM)
    s.label(16, "Lowest monthly cost")
    s.calc(16, f"=MIN($D${H0}:$D${H1})", MONEY)
    s.label(17, "Best cost per point")
    s.calc(17, f"=MIN($E${H0}:$E${H1})", MONEY, big=True)
    s.warn(19, f'=IF(MAX($B${H0}:$B${H1})=0,"Score at least one home to see results.","")')
    return s


def add_reference(wb):
    s = Sheet(wb, RF, ACCENT, {"A": 24, "B": 18, "C": 74})
    s.section(3, "What this is not", 3)
    s.ws["A4"] = "Not a valuation"
    s.ws["A4"].font = s.f["WARN"]
    s.ws["C4"] = ("It does not estimate what a home is worth or what it should sell for.")
    s.ws["A5"] = "Not lending advice"
    s.ws["C5"] = ("Enter the monthly payment your lender quoted. A spreadsheet guess would be "
                  "worse than the real number.")
    s.section(7, "Terms", 3)
    for i, (a, c) in enumerate([
        ("Weight", "How much a criterion matters to you, 1 to 5."),
        ("Score", "How well one home does on one criterion, 1 to 5."),
        ("Of possible", "Your score as a share of the highest score any home could reach."),
        ("Cost per point", "Monthly cost divided by score. Lower means more of what you want per dollar."),
    ]):
        s.ws.cell(row=8 + i, column=1, value=a).font = s.f["BOLD"]
        s.ws.cell(row=8 + i, column=3, value=c)
    s.section(13, "Editable assumptions", 3)
    s.headers(14, ((1, "Assumption"), (2, "Default"), (3, "Change it on")))
    for i, (a, b, c) in enumerate([
        ("Criteria and weights", "10 shown", "Criteria"),
        ("Score range", "1 to 5", "fixed"),
        ("Homes compared", "8 available", "Homes"),
    ]):
        s.ws.cell(row=15 + i, column=1, value=a)
        s.ws.cell(row=15 + i, column=2, value=b)
        s.ws.cell(row=15 + i, column=3, value=c)
    s.color_key(19)
    return s


def build(path, o=None):
    wb = new_workbook()
    add_criteria(wb, o); add_homes(wb, o); add_costs(wb, o)
    add_results(wb, o); add_reference(wb)
    finish(wb)
    wb.save(path)
    return path


if __name__ == "__main__":
    build(sys.argv[1] if len(sys.argv) > 1 else "dist/house-hunting-scorecard.xlsx")
    print("built")
