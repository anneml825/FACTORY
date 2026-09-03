"""Pre-registered acceptance tests, run against the built workbook."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "_kit"))
from qa import Run
from evaluate import Eval
from build import build, CR, HM, CO, RS
import tests

R = Run(build, Eval)
BLANK = [("", "")] * 8

e, m = R.ev(None, "T1"), tests.model()
r0, r1, r2 = m["rows"][0], m["rows"][1], m["rows"][2]

R.check("T1", "weighted score matches the independent model for every scored home",
        all(R.close(e.value(HM, f"M{5+i}"), m["rows"][i]["score"]) for i in range(3)),
        f"{[e.value(HM, f'M{5+i}') for i in range(3)]} vs {[m['rows'][i]['score'] for i in range(3)]}")

R.check("T2", "score as a share of possible uses total weight x 5",
        R.close(e.value(CR, "B18"), m["possible"]) and R.close(e.value(HM, "N5"), r0["of"]),
        f"possible {e.value(CR, 'B18')}, share {e.value(HM, 'N5')}")

R.check("T3", "monthly cost totals the six entered columns",
        all(R.close(e.value(CO, f"H{5+i}"), m["rows"][i]["cost"]) for i in range(3)),
        f"{[e.value(CO, f'H{5+i}') for i in range(3)]}")

R.check("T4", "cost per point is monthly cost divided by score",
        all(R.close(e.value(RS, f"E{5+i}"), m["rows"][i]["per"]) for i in range(3)),
        f"{[round(float(e.value(RS, f'E{5+i}')), 4) for i in range(3)]}")

flags = [str(e.value(RS, f"F{5+i}")) for i in range(3)]
best_i = min(range(3), key=lambda i: m["rows"][i]["per"])
R.check("T5", "the best-value flag lands on the lowest cost per point and nowhere else",
        flags[best_i].startswith("Most of what") and sum(1 for f in flags if f.startswith("Most")) == 1,
        f"flag on home {best_i + 1}; flags {[f[:12] for f in flags]}")

# T6 — the weights actually drive the answer, not just decorate it
alt = [("Commute", 1), ("Neighborhood", 1), ("Condition", 1), ("Kitchen", 1),
       ("Natural light", 1), ("Layout", 1), ("Yard or outdoor space", 1),
       ("Schools", 1), ("Storage", 1), ("Parking", 5)]
ov = {"crit": alt, "s00": 5, "s09": 1, "s10": 1, "s19": 5}
e6, m6 = R.ev(ov, "T6"), tests.model(ov)
R.check("T6", "changing which criterion is decisive changes which home scores higher",
        R.close(e6.value(HM, "M5"), m6["rows"][0]["score"])
        and R.close(e6.value(HM, "M6"), m6["rows"][1]["score"])
        and float(e6.value(HM, "M6")) > float(e6.value(HM, "M5")),
        f"home1 {e6.value(HM, 'M5')} vs home2 {e6.value(HM, 'M6')} when parking is decisive")

e7 = R.ev({"homes": BLANK}, "T7")
vals7 = [str(e7.value(RS, f"{c}{r}")) for c in "BCDE" for r in range(5, 13)]
R.check("T7", "an empty sheet produces no error values anywhere",
        not any("#" in v for v in vals7),
        f"{len(vals7)} result cells, none containing '#'")

R.check("T8", "an unweighted criteria list warns instead of dividing by zero",
        "at least one criterion" in str(R.ev({"crit": [(n, 0) for n, _ in tests.CRIT]}, "T8").value(CR, "B20")),
        f"{str(R.ev({'crit': [(n, 0) for n, _ in tests.CRIT]}, 'T8').value(CR, 'B20'))[:46]!r}")

e9 = R.ev({"s00": 9}, "T9")
R.check("T9", "a score above 5 is flagged on that row",
        "up to 5" in str(e9.value(HM, "O5")), f"{str(e9.value(HM, 'O5'))[:40]!r}")

e10 = R.ev({"s00": -2}, "T10")
R.check("T10", "a negative score is flagged on that row",
        "cannot be negative" in str(e10.value(HM, "O5")), f"{str(e10.value(HM, 'O5'))[:40]!r}")

e11 = R.ev({"homes": [("Only home", 300000)] + BLANK[1:]}, "T11")
R.check("T11", "a home with no asking price is flagged",
        "asking price" in str(R.ev({"homes": [("No price", "")] + BLANK[1:]}, "T11b").value(HM, "O5")),
        f"{str(R.ev({'homes': [('No price', '')] + BLANK[1:]}, 'T11c').value(HM, 'O5'))[:40]!r}")

# Summary values live in column B, beneath the per-home table in E.
R.check("T12", "summary best cost per point equals the lowest in the table",
        R.close(e.value(RS, "B17"), m["best_per"])
        and R.close(e.value(RS, "B15"), m["max_score"]),
        f"best/point {e.value(RS, 'B17')} vs {m['best_per']}, top score {e.value(RS, 'B15')}")

ok = R.report("dist/house-hunting-scorecard.xlsx")
sys.exit(0 if ok else 1)
