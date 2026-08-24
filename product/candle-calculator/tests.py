"""
The ten pre-registered acceptance tests.

Expected values are computed here by an INDEPENDENT implementation of the
formulas in the frozen specification — deliberately not by reading the workbook —
so that agreement between this file and Google Sheets is real corroboration
rather than a tautology.
"""
from build import build, LOAD_OPT, CONTENT_OPT, BASIS_PRICE

OZ = 28.349523125

def model(i):
    """Independent implementation of the specification's formulas."""
    out = {}
    fill = i["water_weight"] * i["wax_factor"]
    out["fill"] = fill
    L_or_C = i["fragrance_pct"]
    if i["convention"] == LOAD_OPT:
        out["wax"] = fill / (1 + L_or_C)
        out["fo"] = fill * L_or_C / (1 + L_or_C)
        out["load"] = L_or_C
        out["content"] = L_or_C / (1 + L_or_C)
    else:
        out["fo"] = fill * L_or_C
        out["wax"] = fill * (1 - L_or_C)
        out["content"] = L_or_C
        out["load"] = L_or_C / (1 - L_or_C)
    out["wax_batch"] = out["wax"] * i["batch_qty"] * (1 + i["melt_loss_pct"])
    out["fo_batch"] = out["fo"] * i["batch_qty"] * (1 + i["melt_loss_pct"])

    gp = {"g": 1, "kg": 1000, "oz": OZ, "lb": 453.59237}
    gpw = 1 if i["unit_system"] == "grams" else OZ
    wax_cpu = i["wax_pack_price"] / (i["wax_pack_size"] * gp[i["wax_pack_unit"]] / gpw)
    fo_cpu = i["fo_pack_price"] / (i["fo_pack_size"] * gp[i["fo_pack_unit"]] / gpw)
    out["materials"] = (out["wax_batch"] * wax_cpu + out["fo_batch"] * fo_cpu) / i["batch_qty"]
    parts = sum(i.get(k, 0) or 0 for k in ("vessel", "wick", "lid", "label", "box", "other"))
    labour = (i["minutes_per_candle"] / 60 * i["hourly_rate"]) if i["labour_on"] == "Yes" else 0
    overhead = (i["monthly_overhead"] / i["monthly_volume"]) if i["overhead_on"] == "Yes" else 0
    out["unit_cost"] = out["materials"] + parts + labour + overhead

    f = sum(i.get(k, 0) or 0 for k in ("fee_pct_1", "fee_pct_2", "fee_pct_3"))
    fixed = i.get("fee_fixed") or 0
    sc = i.get("shipping_charged") or 0
    sk = i.get("shipping_cost") or 0
    den = 1 - f - i["target_margin"]
    if den <= 0:
        out["price"] = None
        out["refusal"] = True
        return out
    out["refusal"] = False
    num = fixed + out["unit_cost"] + sk - (sc * (1 - f) if i["fee_basis"] != BASIS_PRICE else sc)
    price = num / den
    out["price"] = price
    fee_base = price + sc if i["fee_basis"] != BASIS_PRICE else price
    out["fee_total"] = f * fee_base + fixed
    out["net"] = price + sc - out["fee_total"]
    out["profit"] = out["net"] - out["unit_cost"] - sk
    out["achieved_margin"] = out["profit"] / price if price else None
    out["markup"] = out["profit"] / out["unit_cost"] if out["unit_cost"] else None
    out["wholesale"] = out["unit_cost"] * i["wholesale_multiplier"]
    return out


BASE = dict(
    unit_system="grams", currency="$", water_weight=300, wax_factor=0.86,
    convention=LOAD_OPT, fragrance_pct=0.10, wax_max_pct=None, batch_qty=12,
    melt_loss_pct=0.0, wax_pack_price=30.0, wax_pack_size=5, wax_pack_unit="kg",
    fo_pack_price=18.0, fo_pack_size=500, fo_pack_unit="g",
    vessel=1.80, wick=0.12, lid=0.60, label=0.15, box=0.45, other=0.0,
    labour_on="No", minutes_per_candle=None, hourly_rate=None,
    overhead_on="No", monthly_overhead=None, monthly_volume=None,
    channel_name=None, fee_pct_1=None, fee_pct_2=None, fee_pct_3=None,
    fee_fixed=None, fee_basis=BASIS_PRICE, shipping_charged=0, shipping_cost=0,
    target_margin=0.40, wholesale_multiplier=2.0,
)

def case(**kw):
    d = dict(BASE)
    d.update(kw)
    return d

# Only the cost inputs that make unit_cost exactly 5.00 for T6/T7/T10.
FLAT5 = dict(wax_pack_price=0.0, fo_pack_price=0.0, vessel=5.00,
             wick=0.0, lid=0.0, label=0.0, box=0.0, other=0.0)

TESTS = {
    "T1": case(water_weight=220, wax_factor=1.00, fragrance_pct=0.10, convention=LOAD_OPT),
    "T2": case(water_weight=220, wax_factor=1.00, fragrance_pct=0.10, convention=LOAD_OPT),
    "T3": case(water_weight=220, wax_factor=1.00, fragrance_pct=0.10, convention=CONTENT_OPT),
    "T4": case(water_weight=300, wax_factor=0.86),
    "T5a": case(unit_system="grams", water_weight=300, wax_factor=0.86),
    "T5b": case(unit_system="ounces", water_weight=300 / OZ, wax_factor=0.86),
    "T6": case(fee_pct_1=0.095, fee_fixed=0.45, target_margin=0.40,
               fee_basis=BASIS_PRICE, shipping_charged=0, shipping_cost=0, **FLAT5),
    "T7": case(fee_pct_1=0.095, fee_fixed=0.45, target_margin=0.91, **FLAT5),
    "T9": case(fragrance_pct=0.12, wax_max_pct=0.10),
    "T10": case(wholesale_multiplier=0.5, **FLAT5),
}

if __name__ == "__main__":
    import json, os
    os.makedirs("dist/tests", exist_ok=True)
    expected = {}
    for name, inputs in TESTS.items():
        build(f"dist/tests/{name}.xlsx", inputs)
        expected[name] = model(inputs)
    # T8: every required input blank
    build("dist/tests/T8.xlsx", case(water_weight=None, fragrance_pct=None, batch_qty=None,
                                     wax_pack_price=None, wax_pack_size=None, fo_pack_price=None,
                                     fo_pack_size=None, vessel=None, wick=None, lid=None,
                                     label=None, box=None, other=None, target_margin=None,
                                     shipping_charged=None, shipping_cost=None))
    json.dump(expected, open("dist/tests/expected.json", "w"), indent=1, default=str)
    for k, v_ in expected.items():
        print(f"{k}: fill={v_['fill']:.4f} wax={v_['wax']:.4f} fo={v_['fo']:.4f} "
              f"load={v_['load']:.6f} content={v_['content']:.6f} "
              f"cost={v_.get('unit_cost',0):.4f} price={v_['price'] if v_['price'] is None else round(v_['price'],4)}")


def build_qa(path="dist/qa-all-cases.xlsx"):
    """One workbook holding every case, so all ten tests recalculate in one upload."""
    from openpyxl import Workbook
    from build import add_case, finish
    wb = Workbook()
    wb.remove(wb.active)
    for name, inputs in TESTS.items():
        add_case(wb, inputs, suffix=f" {name}", brief=True)
    add_case(wb, case(water_weight=None, fragrance_pct=None, batch_qty=None,
                      wax_pack_price=None, wax_pack_size=None, fo_pack_price=None,
                      fo_pack_size=None, vessel=None, wick=None, lid=None, label=None,
                      box=None, other=None, target_margin=None,
                      shipping_charged=None, shipping_cost=None),
             suffix=" T8", brief=True)
    finish(wb)
    wb.save(path)
    return path
