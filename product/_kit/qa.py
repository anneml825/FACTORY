"""The acceptance-test shell every product's run_acceptance.py uses."""
import openpyxl, re


class Run:
    def __init__(self, build, evaluator, dist="dist/tests"):
        self.build, self.Eval, self.dist = build, evaluator, dist
        self.results = []

    def ev(self, overrides, name):
        path = f"{self.dist}/{name}.xlsx"
        self.build(path, overrides)
        return self.Eval(path)

    def check(self, name, desc, ok, detail):
        self.results.append((name, "PASS" if ok else "FAIL", desc, detail))

    @staticmethod
    def close(a, b, tol=1e-6):
        return a not in ("", None) and abs(float(a) - b) <= tol

    def report(self, workbook_path):
        wb = openpyxl.load_workbook(workbook_path)
        formulas = [(ws.title, c.coordinate, c.value) for ws in wb for r in ws.iter_rows()
                    for c in r if isinstance(c.value, str) and c.value.startswith("=")]
        broken = [f"{s}!{co}" for s, co, v in formulas
                  if v.count("(") != v.count(")") or v.count('"') % 2]
        print()
        for name, status, desc, detail in self.results:
            print(f"{name:5} {status}  {desc}")
            print(f"        {detail}")
        print(f"\ntabs: {wb.sheetnames}")
        print(f"formulas: {len(formulas)}   bracket/quote problems: {len(broken) or 'none'}")
        agree = all(s == "PASS" for _, s, _, _ in self.results)
        print(f"\nindependent-model cross-check across all cases: "
              f"{'AGREE' if agree else 'DISAGREE'}")
        passed = sum(1 for _, s, _, _ in self.results if s == "PASS")
        print(f"{passed}/{len(self.results)} acceptance tests pass")
        return agree and not broken
