"""Renders the one-page Start Here PDF every product ships with."""
import subprocess, os

CHROME = "/opt/pw-browsers/chromium"

CSS = """<!doctype html><html><head><meta charset="utf-8"><style>
@page { size: A4; margin: 13mm; }
body { font-family: Georgia,'Times New Roman',serif; color:#1a1a1a; margin:0; line-height:1.45; }
h1 { font-size:21pt; margin:0 0 1mm; letter-spacing:-0.015em; }
.sub { font-size:11pt; color:#455a64; margin:0 0 4mm; }
h2 { font-family:Helvetica,Arial,sans-serif; font-size:10.5pt; text-transform:uppercase;
     letter-spacing:0.06em; color:%ACCENT%; border-bottom:2px solid %ACCENT%;
     padding-bottom:1.5mm; margin:0 0 2.5mm; }
ol,ul { margin:0 0 4mm; padding-left:5mm; } li { margin-bottom:1.5mm; }
.box { background:#eceff1; border-left:3px solid %ACCENT%; padding:3mm 4.5mm; margin:0 0 4mm; font-size:10.5pt; }
.warn { background:#fff3e0; border-left:3px solid #c62828; padding:3mm 4.5mm; margin:0 0 4mm; font-size:10.5pt; }
strong { font-weight:700; } .tabs { font-size:10.5pt; }
.tabs b { font-family:Helvetica,Arial,sans-serif; font-size:9.5pt; }
</style></head><body>
"""


def render(out_dir, stem, title, subtitle, blocks, accent="#1B3A4B"):
    """blocks: list of ('h2', text) | ('ol'|'ul'|'tabs', [items]) | ('box'|'warn', html)"""
    parts = [CSS.replace("%ACCENT%", accent),
             f"<h1>{title}</h1>", f'<p class="sub">{subtitle}</p>']
    for kind, val in blocks:
        if kind == "h2":
            parts.append(f"<h2>{val}</h2>")
        elif kind in ("ol", "ul", "tabs"):
            tag = "ol" if kind == "ol" else "ul"
            cls = ' class="tabs"' if kind == "tabs" else ""
            parts.append(f"<{tag}{cls}>" + "".join(f"<li>{i}</li>" for i in val) + f"</{tag}>")
        else:
            parts.append(f'<div class="{kind}">{val}</div>')
    parts.append("</body></html>")

    os.makedirs(out_dir, exist_ok=True)
    html = os.path.join(out_dir, "start-here.html")
    pdf = os.path.join(out_dir, f"{stem}-Start-Here.pdf")
    open(html, "w", encoding="utf-8").write("\n".join(parts))
    subprocess.run([CHROME, "--headless", "--no-sandbox", "--disable-gpu",
                    "--no-pdf-header-footer", f"--print-to-pdf={pdf}", html],
                   capture_output=True)
    return pdf


def preview(pdf, png):
    import pypdfium2 as pdfium
    doc = pdfium.PdfDocument(pdf)
    doc[0].render(scale=150 / 72).to_pil().save(png)
    return len(doc)
