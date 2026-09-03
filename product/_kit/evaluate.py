"""
Evaluates the workbook's ACTUAL formula strings.

This is not a re-statement of intent: it parses the text openpyxl wrote into the
file, so a typo, an unbalanced parenthesis, a reference to a cell that does not
exist, or a wrong row number fails here. Agreement with tests.model() — written
independently from the specification — is what makes the pair meaningful.

Supports only the subset the workbook uses: IF, IFERROR, AND, OR, SUM, MIN, MAX,
ROUND, ROUNDUP, ROUNDDOWN, TEXT, comparison
and arithmetic operators, string concatenation, quoted sheet references.
"""
import re
from openpyxl import load_workbook
from openpyxl.utils import range_boundaries, get_column_letter

EMPTY = ""


class Eval:
    def __init__(self, path):
        self.wb = load_workbook(path)
        self.cache = {}

    # ---------------------------------------------------------------- lexing
    TOKEN = re.compile(r"""
        (?P<sheetref>'[^']+'!\$?[A-Z]{1,3}\$?\d+)
      | (?P<range>\$?[A-Z]{1,3}\$?\d+:\$?[A-Z]{1,3}\$?\d+)
      | (?P<ref>\$?[A-Z]{1,3}\$?\d+)
      | (?P<func>[A-Z]+(?=\())
      | (?P<num>\d+(?:\.\d+)?)
      | (?P<str>"(?:[^"]|"")*")
      | (?P<op><>|<=|>=|[-+*/&<>=(),])
      | (?P<ws>\s+)
    """, re.X)

    def lex(self, s):
        out, i = [], 0
        while i < len(s):
            m = self.TOKEN.match(s, i)
            if not m:
                raise SyntaxError(f"cannot lex at {i}: {s[i:i+30]!r} in {s!r}")
            i = m.end()
            kind = m.lastgroup
            if kind != "ws":
                out.append((kind, m.group()))
        return out

    # --------------------------------------------------------------- parsing
    def parse(self, tokens):
        self.t, self.i = tokens, 0
        v = self.expr()
        if self.i != len(self.t):
            raise SyntaxError(f"trailing tokens at {self.i}: {self.t[self.i:]}")
        return v

    def peek(self):
        return self.t[self.i] if self.i < len(self.t) else (None, None)

    def eat(self, val=None):
        k, v = self.t[self.i]
        if val is not None and v != val:
            raise SyntaxError(f"expected {val!r} got {v!r}")
        self.i += 1
        return v

    def expr(self):
        left = self.concat()
        while self.peek()[1] in ("=", "<>", "<", ">", "<=", ">="):
            op = self.eat()
            right = self.concat()
            left = self.compare(op, left, right)
        return left

    def concat(self):
        left = self.add()
        while self.peek()[1] == "&":
            self.eat()
            left = self.text(left) + self.text(self.add())
        return left

    def add(self):
        left = self.mul()
        while self.peek()[1] in ("+", "-"):
            op = self.eat()
            right = self.mul()
            left = self.num(left) + self.num(right) if op == "+" else self.num(left) - self.num(right)
        return left

    def mul(self):
        left = self.unary()
        while self.peek()[1] in ("*", "/"):
            op = self.eat()
            right = self.unary()
            if op == "*":
                left = self.num(left) * self.num(right)
            else:
                d = self.num(right)
                if d == 0:
                    raise ZeroDivisionError("#DIV/0!")
                left = self.num(left) / d
        return left

    def unary(self):
        if self.peek()[1] == "-":
            self.eat()
            return -self.num(self.unary())
        return self.atom()

    def atom(self):
        kind, val = self.peek()
        if val == "(":
            self.eat("(")
            v = self.expr()
            self.eat(")")
            return v
        if kind == "func":
            return self.call(self.eat())
        if kind == "num":
            self.eat()
            return float(val)
        if kind == "str":
            self.eat()
            return val[1:-1].replace('""', '"')
        if kind in ("ref", "sheetref"):
            self.eat()
            return self.cell(val)
        if kind == "range":
            self.eat()
            return self.rng(val)
        raise SyntaxError(f"unexpected {val!r}")

    def call(self, name):
        self.eat("(")
        args = []
        if self.peek()[1] != ")":
            args.append(self.arg())
            while self.peek()[1] == ",":
                self.eat(",")
                args.append(self.arg())
        self.eat(")")
        return self.apply(name, args)

    def arg(self):
        """Arguments are captured lazily only where needed (IF branches)."""
        start = self.i
        depth = 0
        while self.i < len(self.t):
            k, v = self.t[self.i]
            if v == "(":
                depth += 1
            elif v == ")":
                if depth == 0:
                    break
                depth -= 1
            elif v == "," and depth == 0:
                break
            self.i += 1
        return self.t[start:self.i]

    def sub(self, tokens):
        saved_t, saved_i = self.t, self.i
        self.t, self.i = tokens, 0
        v = self.expr()
        self.t, self.i = saved_t, saved_i
        return v

    # ------------------------------------------------------------- semantics
    def apply(self, name, args):
        if name == "IF":
            cond = self.sub(args[0])
            if bool(cond) and cond != 0 and cond != "":
                return self.sub(args[1])
            return self.sub(args[2]) if len(args) > 2 else False
        if name == "IFERROR":
            # Lazy on purpose: the whole point is to catch a division that has
            # not happened yet. Evaluating args eagerly would raise past it.
            try:
                return self.sub(args[0])
            except (ZeroDivisionError, ValueError, TypeError, KeyError):
                return self.sub(args[1])
        vals = [self.sub(a) for a in args]
        if name == "OR":
            return any(self.flat(vals))
        if name == "AND":
            return all(self.flat(vals))
        if name == "SUM":
            return sum(self.num(x) for x in self.flat(vals) if x not in (None, EMPTY))
        if name == "MIN":
            xs = [self.num(x) for x in self.flat(vals) if x not in (None, EMPTY)]
            return min(xs) if xs else 0.0
        if name == "MAX":
            xs = [self.num(x) for x in self.flat(vals) if x not in (None, EMPTY)]
            return max(xs) if xs else 0.0
        if name in ("ROUND", "ROUNDUP", "ROUNDDOWN"):
            import math
            n, d = self.num(vals[0]), int(self.num(vals[1]))
            f = 10 ** d
            if name == "ROUND":
                return round(n * f) / f
            return (math.ceil(n * f) if name == "ROUNDUP" else math.floor(n * f)) / f
        if name == "TEXT":
            v, fmt = vals[0], vals[1]
            n = self.num(v)
            if fmt.endswith("%"):
                dec = len(fmt.split(".")[1]) - 1 if "." in fmt else 0
                return f"{n*100:.{dec}f}%"
            return str(n)
        raise NotImplementedError(name)

    @staticmethod
    def flat(vals):
        out = []
        for v in vals:
            out.extend(v) if isinstance(v, list) else out.append(v)
        return out

    @staticmethod
    def num(v):
        if v in (None, EMPTY, False):
            return 0.0
        if v is True:
            return 1.0
        if isinstance(v, str):
            raise TypeError(f"#VALUE! — text where a number was needed: {v!r}")
        return float(v)

    @staticmethod
    def text(v):
        if v in (None, EMPTY):
            return ""
        if isinstance(v, bool):
            return "TRUE" if v else "FALSE"
        if isinstance(v, float) and v.is_integer():
            return str(int(v))
        return str(v)

    def compare(self, op, a, b):
        if isinstance(a, str) or isinstance(b, str):
            a, b = self.text(a), self.text(b)
        else:
            a, b = self.num(a), self.num(b)
        return {"=": a == b, "<>": a != b, "<": a < b, ">": a > b,
                "<=": a <= b, ">=": a >= b}[op]

    # ------------------------------------------------------------- addressing
    def split(self, ref, default_sheet):
        if "!" in ref:
            sh, cell = ref.split("!")
            return sh.strip("'"), cell.replace("$", "")
        return default_sheet, ref.replace("$", "")

    def cell(self, ref):
        sheet, addr = self.split(ref, self.sheet)
        return self.value(sheet, addr)

    def rng(self, ref):
        sheet = self.sheet
        if "!" in ref:
            sheet, ref = ref.split("!")
            sheet = sheet.strip("'")
        c1, r1, c2, r2 = range_boundaries(ref.replace("$", ""))
        return [self.value(sheet, f"{get_column_letter(c)}{r}")
                for r in range(r1, r2 + 1) for c in range(c1, c2 + 1)]

    def value(self, sheet, addr):
        key = (sheet, addr)
        if key in self.cache:
            return self.cache[key]
        raw = self.wb[sheet][addr].value
        if isinstance(raw, str) and raw.startswith("="):
            # Evaluating a referenced cell runs a nested parse, so the caller's
            # parser state must be preserved or its remaining tokens are lost.
            prev_sheet = getattr(self, "sheet", None)
            prev_t = getattr(self, "t", None)
            prev_i = getattr(self, "i", None)
            self.sheet = sheet
            self.cache[key] = EMPTY
            try:
                out = self.parse(self.lex(raw[1:]))
            finally:
                self.sheet = prev_sheet
                if prev_t is not None:
                    self.t, self.i = prev_t, prev_i
        else:
            out = EMPTY if raw is None else raw
        self.cache[key] = out
        return out

    def get(self, sheet, addr):
        self.sheet = sheet
        return self.value(sheet, addr)

    def scan(self):
        """Evaluate every formula in the book; collect anything that errors."""
        problems = []
        for ws in self.wb.worksheets:
            for row in ws.iter_rows():
                for c in row:
                    if isinstance(c.value, str) and c.value.startswith("="):
                        try:
                            self.get(ws.title, c.coordinate)
                        except Exception as e:
                            problems.append(f"{ws.title}!{c.coordinate}: {type(e).__name__}: {e}")
        return problems
