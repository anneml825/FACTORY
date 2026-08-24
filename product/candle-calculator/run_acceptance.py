"""Runs the ten pre-registered acceptance tests against the built workbook."""
import math
from build import build, LOAD_OPT, CONTENT_OPT, BASIS_PRICE
from evaluate import Eval
import tests

YC, CP = "Your Candle", "Costs & Price"
OZ = 28.349523125
results = []


def ev(inputs, name):
    path = f"dist/tests/{name}.xlsx"
    build(path, inputs)
    return Eval(path)


def check(name, desc, ok, detail):
    results.append((name, "PASS" if ok else "FAIL", desc, detail))


def close(a, b, tol=1e-6):
    return a not in ("", None) and abs(float(a) - b) <= tol


# T1 / T2 -- fill 220 at 10% load
e = ev(tests.TESTS["T2"], "T2")
fo, fill, content = e.get(YC, "B16"), e.get(YC, "B17"), e.get(YC, "B19")
wax = e.get(YC, "B15")
check("T1", "220 g fill at 10% load shows FO 20 g, fill 220 g, content 9.09%",
      close(fo, 20) and close(fill, 220) and close(content, 20 / 220),
      f"FO={fo:.4f} fill={fill:.4f} content={content*100:.2f}%")
check("T2", "220 g fill at 10% load gives wax 200 g, FO 20 g",
      close(wax, 200) and close(fo, 20), f"wax={wax:.4f} FO={fo:.4f}")

# T3 -- same fill at 10% CONTENT must differ
e3 = ev(tests.TESTS["T3"], "T3")
wax3, fo3 = e3.get(YC, "B15"), e3.get(YC, "B16")
check("T3", "220 g fill at 10% content gives wax 198 g, FO 22 g and differs from T2",
      close(wax3, 198) and close(fo3, 22) and not close(wax3, wax),
      f"wax={wax3:.4f} FO={fo3:.4f} (T2 wax was {wax:.4f})")

# T4 -- water weight x factor
e4 = ev(tests.TESTS["T4"], "T4")
check("T4", "water weight 300 with factor 0.86 gives fill 258",
      close(e4.get(YC, "B6"), 258), f"fill={e4.get(YC,'B6'):.4f}")

# T5 -- grams and ounces agree
ea = ev(tests.TESTS["T5a"], "T5a")
eb = ev(tests.TESTS["T5b"], "T5b")
wax_g, wax_oz = ea.get(YC, "B15"), eb.get(YC, "B15")
cost_g, cost_oz = ea.get(CP, "B34"), eb.get(CP, "B34")
check("T5", "the same candle entered in ounces and grams agrees within 0.1 g",
      abs(wax_g - wax_oz * OZ) <= 0.1 and close(cost_g, cost_oz, 1e-6),
      f"{wax_g:.4f} g vs {wax_oz:.4f} oz = {wax_oz*OZ:.4f} g; cost {cost_g:.4f} vs {cost_oz:.4f}")

# T6 -- margin solver
e6 = ev(tests.TESTS["T6"], "T6")
cost6, price6, margin6 = e6.get(CP, "B34"), e6.get(CP, "B48"), e6.get(CP, "B53")
check("T6", "cost 5.00, fixed 0.45, fees 9.5%, target 40% gives price 10.79 and achieved margin 40.0%",
      close(cost6, 5.0) and close(round(price6, 2), 10.79, 1e-9) and close(margin6, 0.40, 1e-9),
      f"cost={cost6:.2f} price={price6:.4f} achieved={margin6*100:.2f}%")

# T7 -- unreachable target refused
e7 = ev(tests.TESTS["T7"], "T7")
price7, warn7 = e7.get(CP, "B48"), e7.get(CP, "B49")
check("T7", "a 91% target with 9.5% fees is refused with no number in the price cell",
      price7 == "" and isinstance(warn7, str) and "isn't reachable" in warn7,
      f"price={price7!r} message={warn7!r}")

# T8 -- blank inputs produce prompts, never error values
e8 = ev(tests.case(water_weight=None, fragrance_pct=None, batch_qty=None,
                   wax_pack_price=None, wax_pack_size=None, fo_pack_price=None,
                   fo_pack_size=None, vessel=None, wick=None, lid=None, label=None,
                   box=None, other=None, target_margin=None,
                   shipping_charged=None, shipping_cost=None), "T8")
probs8 = e8.scan()
blanks = [e8.get(YC, "B15"), e8.get(YC, "B16"), e8.get(CP, "B34"), e8.get(CP, "B48")]
check("T8", "every required input blank produces no error value anywhere",
      not probs8 and all(b == "" for b in blanks),
      f"formula errors={len(probs8)} key cells all blank={all(b=='' for b in blanks)}")

# T9 -- over the entered wax maximum
e9 = ev(tests.TESTS["T9"], "T9")
warn9, wax9 = e9.get(YC, "B12"), e9.get(YC, "B15")
check("T9", "fragrance 12% against an entered maximum of 10% warns, and still calculates",
      isinstance(warn9, str) and "Above the maximum" in warn9 and wax9 != "",
      f"message={warn9!r} wax still computed={wax9:.4f}")

# T10 -- wholesale below cost
e10 = ev(tests.TESTS["T10"], "T10")
ws10, cost10, warn10 = e10.get(CP, "B58"), e10.get(CP, "B34"), e10.get(CP, "B60")
check("T10", "a wholesale price below unit cost warns",
      ws10 < cost10 and isinstance(warn10, str) and "below what the candle costs" in warn10,
      f"wholesale={ws10:.2f} cost={cost10:.2f} message={warn10!r}")

# Cross-check every case against the independently written model
mismatch = []
for name, inputs in tests.TESTS.items():
    build(f"dist/tests/{name}.xlsx", inputs)
    e = Eval(f"dist/tests/{name}.xlsx")
    m = tests.model(inputs)
    for key, (sheet, addr) in {"fill": (YC, "B6"), "wax": (YC, "B15"), "fo": (YC, "B16"),
                               "load": (YC, "B18"), "content": (YC, "B19"),
                               "unit_cost": (CP, "B34")}.items():
        got, want = e.get(sheet, addr), m[key]
        if want is not None and not close(got, want, 1e-9):
            mismatch.append(f"{name}.{key}: workbook={got} model={want}")
    if m["price"] is not None and not close(e.get(CP, "B48"), m["price"], 1e-9):
        mismatch.append(f"{name}.price: workbook={e.get(CP,'B48')} model={m['price']}")

print(f"{'test':5} {'result':6} description")
print("-" * 100)
for n, r, d, det in results:
    print(f"{n:5} {r:6} {d}")
    print(f"{'':12} {det}")
print()
print("independent-model cross-check across all cases:",
      "AGREE" if not mismatch else f"{len(mismatch)} MISMATCHES")
for m in mismatch[:10]:
    print("  ", m)
print()
failed = [r for r in results if r[1] == "FAIL"]
print(f"{len(results)-len(failed)}/{len(results)} acceptance tests pass")
