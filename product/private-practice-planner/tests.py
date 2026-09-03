"""
An independent model of what the workbook is supposed to compute.

Written from the intended behaviour, not from build.py's formula strings.
Agreement between this and the evaluator running the real formulas is what
makes the pair meaningful — either alone proves very little.
"""
import math

BASE = dict(
    weeks=46, target=60000, tax=0.25,
    tiers=[("Full fee", 150, 12, 0.90),
           ("Sliding scale A", 110, 4, 0.90),
           ("Sliding scale B", 80, 2, 0.90),
           ("Insurance", 95, 4, 0.85),
           ("", "", "", ""), ("", "", "", "")],
    monthly=[("Office rent", 600), ("Practice software", 69), ("Phone and internet", 45),
             ("Clinical supervision", 150), ("Bookkeeping", 60),
             ("Directory listings", 30), ("Other", 0), ("", ""), ("", ""), ("", "")],
    annual=[("Liability insurance", 600), ("License renewal", 200),
            ("Continuing education", 500), ("Professional membership", 300),
            ("Other", 0), ("", ""), ("", ""), ("", "")],
    full_fee=150, red_fee=80, slots=22, att=0.90,
)


def model(o=None):
    d = dict(BASE)
    if o:
        d.update(o)
    weeks, tax = d["weeks"], d["tax"]

    slots_wk = sum(t[2] for t in d["tiers"] if t[2] != "")
    attended = sum(t[2] * t[3] * weeks for t in d["tiers"] if t[2] != "" and t[3] != "")
    revenue = sum(t[1] * t[2] * t[3] * weeks
                  for t in d["tiers"] if t[1] != "" and t[2] != "" and t[3] != "")
    avg_held = revenue / attended if attended else ""
    avg_slot = revenue / (slots_wk * weeks) if slots_wk * weeks else ""

    monthly = sum(a for _, a in d["monthly"] if a != "")
    annual = sum(a for _, a in d["annual"] if a != "")
    costs = monthly * 12 + annual

    before_tax = revenue - costs
    set_aside = max(0.0, before_tax) * tax
    take_home = before_tax - set_aside
    diff = take_home - d["target"]

    needed = d["target"] / (1 - tax) + costs if tax != 1 else ""
    to_cover = math.ceil(costs / avg_held) if avg_held else ""
    to_target = math.ceil(needed / avg_held) if (avg_held and needed != "") else ""
    slots_needed = (math.ceil(needed / (avg_slot * weeks))
                    if (avg_slot and needed != "") else "")

    full, red, sl, att = d["full_fee"], d["red_fee"], d["slots"], d["att"]
    if full <= red or needed == "" or att == 0:
        reduced = ""
    else:
        raw = (sl * full - needed / (weeks * att)) / (full - red)
        reduced = math.floor(min(sl, max(0.0, raw)))

    return dict(slots_wk=slots_wk, attended=attended, revenue=revenue,
                avg_held=avg_held, avg_slot=avg_slot, costs=costs,
                before_tax=before_tax, set_aside=set_aside, take_home=take_home,
                diff=diff, needed=needed, to_cover=to_cover, to_target=to_target,
                slots_needed=slots_needed, reduced=reduced)
