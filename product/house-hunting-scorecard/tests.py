"""Independent model of what the workbook should compute, written from intent."""
CRIT = [("Commute", 5), ("Neighborhood", 5), ("Condition", 4), ("Kitchen", 4),
        ("Natural light", 4), ("Layout", 3), ("Yard or outdoor space", 3),
        ("Schools", 3), ("Storage", 2), ("Parking", 2)]
HOMES = [("123 Oak Street", 425000), ("88 Larch Avenue", 399000),
         ("17 Mill Lane", 460000), ("", ""), ("", ""), ("", ""), ("", ""), ("", "")]
COSTS = [(2150, 390, 95, 0, 120, 180), (1980, 340, 88, 145, 210, 165),
         (2340, 455, 102, 0, 60, 195), *[("", "", "", "", "", "")] * 5]


def model(o=None):
    o = o or {}
    crit = o.get("crit", CRIT)
    homes = o.get("homes", HOMES)
    costs = o.get("costs", COSTS)
    weights = [w for _, w in crit]
    total_w = sum(weights)
    possible = total_w * 5

    rows = []
    for i, (name, _price) in enumerate(homes):
        if name == "":
            rows.append(dict(name="", score="", of="", cost="", per=""))
            continue
        scores = [o.get(f"s{i}{j}", 3) for j in range(10)]
        score = sum(s * w for s, w in zip(scores, weights))
        of = score / possible if possible else ""
        c = costs[i]
        cost = sum(x for x in c if x != "") if any(x != "" for x in c) else ""
        per = (cost / score) if (cost != "" and score) else ""
        rows.append(dict(name=name, score=score, of=of, cost=cost, per=per))

    pers = [r["per"] for r in rows if r["per"] != ""]
    return dict(rows=rows, total_w=total_w, possible=possible,
                best_per=min(pers) if pers else "",
                max_score=max([r["score"] for r in rows if r["score"] != ""] or [0]))
