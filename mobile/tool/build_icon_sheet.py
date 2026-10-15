#!/usr/bin/env python3
"""Builds the icon review sheet — simple, WHITE, every icon visible.

    python3 tool/build_icon_sheet.py          # -> tool/icon_sheet.html
    python3 tool/build_icon_sheet.py --png    # -> tool/icon_sheet_v1.png

Both outputs are self-contained: no network, no fonts, no external files.
The HTML is plain white with one job — show every icon and its name.
The PNG is the same thing as a single picture (opens anywhere, offline).
"""
from __future__ import annotations

import html
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "tool" / "icon_manifest.txt"
ICONS_DART = ROOT / "lib" / "design" / "icons" / "app_icons.dart"
SRC = ROOT / "assets" / "icons_src"
OUT_HTML = ROOT / "tool" / "icon_sheet.html"
OUT_PNG = ROOT / "tool" / "icon_sheet_v1.png"

INK = "#111827"          # icon colour on white
MUTED = "#6B7280"
LINE = "#E5E7EB"

# Every inline <svg> must carry the drawing rules, otherwise the browser paints
# the paths with its default fill and the icon disappears. This wrapper is the
# single place that owns them.
SVG_OPEN = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" '
            'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" '
            'stroke-linejoin="round"')
GROUPS = ["nav", "chrome", "invite hub", "referrals", "chat", "wallet", "status", "settings"]
TITLES = {"nav": "Navigation (bottom bar)", "chrome": "Chrome (basic actions)",
          "invite hub": "Invite Hub", "referrals": "Referrals", "chat": "Chat",
          "wallet": "Wallet", "status": "Status / alerts", "settings": "Settings"}


def icon_svg(icon_id: str, size: int) -> str:
    body = (SRC / f"{icon_id}.svg").read_text(encoding="utf-8")
    body = body[body.index(">") + 1: body.rindex("</svg>")].strip()
    return f'{SVG_OPEN} width="{size}" height="{size}">{body}</svg>'


def icon_body(icon_id: str) -> str:
    text = (SRC / f"{icon_id}.svg").read_text(encoding="utf-8")
    return text[text.index(">") + 1: text.rindex("</svg>")].strip()


def groups_in_order() -> list[tuple[str, str]]:
    text = ICONS_DART.read_text(encoding="utf-8")
    block = text[text.index("required ="):]
    block = block[block.index("[") + 1: block.index("];")]
    out: list[tuple[str, str]] = []
    group = "other"
    for raw in block.splitlines():
        body = raw.split("//")[0]
        if raw.strip().startswith("//"):
            group = raw.strip().strip("/ ").strip()
        for word in re.findall(r"\b[a-z][A-Za-z0-9]*\b", body):
            out.append((group, re.sub(r"(?<!^)(?=[A-Z])", "_", word).lower()))
    return out


def used_in() -> dict[str, str]:
    rows: dict[str, str] = {}
    for raw in MANIFEST.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        parts = [p.strip() for p in line.split("|")]
        rows[parts[0]] = parts[1] if len(parts) > 1 else ""
    return rows


def build_html() -> str:
    groups = groups_in_order()
    notes = used_in()

    sections = []
    for group in GROUPS + sorted({g for g, _ in groups} - set(GROUPS)):
        cells = []
        for g, icon in groups:
            if g != group:
                continue
            cells.append(f'''<div class="cell">
  <div class="big">{icon_svg(icon, 44)}</div>
  <div class="small">{icon_svg(icon, 22)}{icon_svg(icon, 18)}{icon_svg(icon, 14)}</div>
  <div class="name">{icon}</div>
  <div class="use">{html.escape(notes.get(icon, ""))}</div>
</div>''')
        if cells:
            sections.append(f'<h2>{TITLES.get(group, group.title())} <span>{len(cells)} icons</span></h2>'
                            f'<div class="grid">{"".join(cells)}</div>')

    return f'''<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ANDOS Referral — all {len(groups)} icons</title>
<style>
  body {{ margin:0; background:#FFFFFF; color:{INK}; padding:22px 16px 60px;
    font:15px/1.5 -apple-system, "Segoe UI", Roboto, system-ui, sans-serif; }}
  .wrap {{ max-width:1000px; margin:0 auto; }}
  h1 {{ font-size:21px; margin:0 0 6px; }}
  .sub {{ color:{MUTED}; margin:0 0 18px; }}
  .how {{ border:1px solid {LINE}; border-radius:14px; padding:12px 14px; margin:0 0 24px;
    background:#FAFAFA; color:#374151; font-size:14px; }}
  h2 {{ font-size:15px; margin:30px 0 12px; padding-bottom:8px; border-bottom:2px solid {LINE}; }}
  h2 span {{ float:right; color:{MUTED}; font-weight:400; font-size:13px; }}
  .grid {{ display:grid; grid-template-columns:repeat(auto-fill, minmax(118px, 1fr)); gap:10px; }}
  .cell {{ border:1px solid {LINE}; border-radius:14px; padding:12px 8px 10px; text-align:center;
    background:#FFFFFF; }}
  .big {{ color:{INK}; height:46px; display:flex; align-items:center; justify-content:center; }}
  .small {{ display:flex; gap:8px; align-items:flex-end; justify-content:center; color:{MUTED};
    height:26px; margin-top:4px; }}
  .name {{ font:12px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace; color:#111827;
    margin-top:8px; word-break:break-all; }}
  .use {{ font-size:10.5px; color:{MUTED}; margin-top:3px; }}
</style></head>
<body><div class="wrap">
  <h1>ANDOS Referral — icon set v1 ({len(groups)} icons)</h1>
  <p class="sub">Ye saare icons hain jo app me use honge. White background warna, taaki sab saaf dikhein.</p>
  <div class="how">Kaise feedback dein: jo icon pasand na aaye uska <b>naam</b> likh dein (ya naya SVG bhej dein) —
    baaki sab main update kar dunga. Har icon 2 tarah ka hota hai: <b>bada</b> aur chhote size
    (22/18/14 px) — chhote size me bhi saaf dikhna chahiye.</div>
  {''.join(sections)}
</div></body></html>
'''


def build_png() -> str:
    """One picture with everything, drawn as SVG then rasterised."""
    import cairosvg

    groups = groups_in_order()
    cols = 8
    cw, ch = 138, 116
    pad = 24
    title_h = 74

    blocks: list[str] = []
    y = title_h
    for group in GROUPS + sorted({g for g, _ in groups} - set(GROUPS)):
        items = [i for g, i in groups if g == group]
        if not items:
            continue
        blocks.append(f'<text x="{pad}" y="{y}" font-size="17" font-weight="700" '
                      f'fill="#111827">{html.escape(TITLES.get(group, group.title()))}'
                      f'<tspan fill="{MUTED}" font-weight="400" font-size="13">'
                      f'  ({len(items)})</tspan></text>')
        y += 12
        for n, icon in enumerate(items):
            r, c = divmod(n, cols)
            x = pad + c * cw
            cy = y + r * ch
            body = icon_body(icon)
            blocks.append(
                f'<g transform="translate({x + 8},{cy})">'
                f'<rect width="{cw - 12}" height="{ch - 14}" rx="14" fill="#FFFFFF" '
                f'stroke="{LINE}"/>'
                f'<g transform="translate({(cw - 12) / 2 - 21},14)" color="{INK}">'
                f'<svg width="42" height="42" viewBox="0 0 24 24" fill="none" '
                f'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" '
                f'stroke-linejoin="round">{body}</svg></g>'
                f'<text x="{(cw - 12) / 2}" y="76" text-anchor="middle" font-size="10.5" '
                f'font-family="DejaVu Sans, Helvetica, sans-serif" fill="#111827">{icon}</text>'
                f'</g>')
        rows = (len(items) + cols - 1) // cols
        y += rows * ch + 18

    width = pad * 2 + cols * cw
    height = y + pad
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
           f'viewBox="0 0 {width} {height}">'
           f'<rect width="{width}" height="{height}" fill="#FFFFFF"/>'
           f'<text x="{pad}" y="38" font-size="22" font-weight="700" fill="#111827" '
           f'font-family="DejaVu Sans, Helvetica, sans-serif">ANDOS Referral — icon set v1</text>'
           f'<text x="{pad}" y="58" font-size="13" fill="{MUTED}" '
           f'font-family="DejaVu Sans, Helvetica, sans-serif">'
           f'{len(groups)} icons · 24×24 grid · 1.6 px stroke · white background</text>'
           + "".join(blocks) + "</svg>")

    cairosvg.svg2png(bytestring=svg.encode("utf-8"), write_to=str(OUT_PNG),
                     output_width=width, output_height=height)
    return f"wrote {OUT_PNG.relative_to(ROOT)} ({OUT_PNG.stat().st_size:,} bytes)"


def main() -> int:
    if "--png" in sys.argv:
        print(build_png())
        return 0
    OUT_HTML.write_text(build_html(), encoding="utf-8")
    print(f"wrote {OUT_HTML.relative_to(ROOT)} ({OUT_HTML.stat().st_size:,} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
