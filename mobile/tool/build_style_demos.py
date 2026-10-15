#!/usr/bin/env python3
"""Builds 20 icon-style demos so the owner can pick a direction.

    python3 tool/build_style_demos.py

Output (all under tool/style_demos/):
  demo_NN_<style>.png     one picture per style (same 6 icons every time)
  STYLE_DEMOS_01_10.png   contact sheet
  STYLE_DEMOS_11_20.png   contact sheet
  style_demos.zip         everything, for Drive

Same 6 icons in every demo, so the styles can be compared like-for-like:
filter (the one the owner liked), search, chat, wallet, lock, gift.
"""
from __future__ import annotations

import io
import re
import zipfile
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

import cairosvg
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "icons_src"
OUT = ROOT / "tool" / "style_demos"
SAMPLE = ["filter", "search", "nav_chat", "wallet", "lock", "gift"]

INK = "#111827"
GOLD1, GOLD2, GOLD3 = "#F59E0B", "#FBBF24", "#B45309"
VIOLET = "#8B5CF6"
SHAPES = {"path", "circle", "rect", "ellipse", "line", "polyline", "polygon"}

FONTS = ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
         "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]


# ── geometry helpers ────────────────────────────────────────────────────────
def body(icon: str) -> str:
    svg = (SRC / f"{icon}.svg").read_text(encoding="utf-8")
    return svg[svg.index(">") + 1: svg.rindex("</svg>")].strip()


def restyle(icon: str, fn) -> str:
    """Rewrite per-element attributes: fn(element, index, total)."""
    root = ET.fromstring(f"<svg>{body(icon)}</svg>")
    els = [e for e in root.iter() if e.tag in SHAPES]
    for i, el in enumerate(els):
        fn(el, i, len(els))
    out = []
    for child in list(root):
        xml = ET.tostring(child, encoding="unicode")
        out.append(re.sub(r"\s*/>", "/>", xml.replace("ns0:", "")))
    return "".join(out)


def group(inner: str, x: float, y: float, *, stroke: str, width: float = 1.6,
          cap: str = "round", join: str = "round", dash: str | None = None,
          opacity: float = 1.0, fill: str = "none") -> str:
    dash_attr = f' stroke-dasharray="{dash}"' if dash else ""
    return (f'<g transform="translate({x},{y})" fill="{fill}" stroke="{stroke}" '
            f'stroke-width="{width}" stroke-linecap="{cap}" stroke-linejoin="{join}" '
            f'opacity="{opacity}" color="{stroke}"{dash_attr}>{inner}</g>')


def defs() -> str:
    return f'''<defs>
  <linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="{GOLD2}"/><stop offset="0.55" stop-color="{GOLD1}"/>
    <stop offset="1" stop-color="{GOLD3}"/></linearGradient>
  <linearGradient id="gMix" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="{VIOLET}"/><stop offset="0.5" stop-color="{GOLD1}"/>
    <stop offset="1" stop-color="{GOLD2}"/></linearGradient>
  <linearGradient id="gGlass" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#6D28D9"/><stop offset="0.5" stop-color="#0B1020"/>
    <stop offset="1" stop-color="{GOLD3}"/></linearGradient>
</defs>'''


# ── hand-drawn solid versions (only the 6 sample icons need them) ───────────
SOLID = {
    "filter": '<path d="M3.9 5.9h16.2l-6.4 7.6v4.8l-3.4 2.1v-6.9z" fill="currentColor" stroke="none"/>',
    "search": (
        '<circle cx="10.8" cy="10.8" r="6.5" fill="currentColor" stroke="none"/>'
        '<circle cx="10.8" cy="10.8" r="4.3" fill="#FFFFFF" stroke="none"/>'
        '<path d="M15.4 15.4 20 20" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round"/>'
    ),
    "nav_chat": (
        '<path d="M5.2 7.6a3.2 3.2 0 0 1 3.2-3.2h7.2a3.2 3.2 0 0 1 3.2 3.2v4.2a3.2 3.2 0 0 1-3.2 3.2'
        'h-4.2L7.6 18.7v-3.7a3.2 3.2 0 0 1-2.4-3.1z" fill="currentColor" stroke="none"/>'
        '<circle cx="9.4" cy="9.8" r="1.05" fill="#FFFFFF" stroke="none"/>'
        '<circle cx="12" cy="9.8" r="1.05" fill="#FFFFFF" stroke="none"/>'
        '<circle cx="14.6" cy="9.8" r="1.05" fill="#FFFFFF" stroke="none"/>'
    ),
    "wallet": (
        '<path d="M5.6 6.8h12.8a3.4 3.4 0 0 1 3.4 3.4v5.6a3.4 3.4 0 0 1-3.4 3.4H5.6A3.4 3.4 0 0 1 2.2 15.8'
        'v-5.6A3.4 3.4 0 0 1 5.6 6.8z" fill="currentColor" stroke="none"/>'
        '<path d="M21.8 10.6h-4.7a2.4 2.4 0 0 0 0 4.8h4.7z" fill="#FFFFFF" stroke="none"/>'
        '<circle cx="17.3" cy="13" r="1" fill="currentColor" stroke="none"/>'
    ),
    "lock": (
        '<rect x="4.6" y="10.4" width="14.8" height="9.6" rx="2.6" fill="currentColor" stroke="none"/>'
        '<path d="M8.4 10.4V8a3.6 3.6 0 0 1 7.2 0v2.4" fill="none" stroke="currentColor" '
        'stroke-width="2.6" stroke-linecap="round"/>'
        '<circle cx="12" cy="14.9" r="1.6" fill="#FFFFFF" stroke="none"/>'
        '<path d="M12 15v2.3" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>'
    ),
    "gift": (
        '<rect x="3.8" y="8.6" width="16.4" height="11.4" rx="2.2" fill="currentColor" stroke="none"/>'
        '<rect x="3" y="5.6" width="18" height="4.4" rx="1.6" fill="currentColor" stroke="none"/>'
        '<path d="M12 5.8v14" fill="none" stroke="#FFFFFF" stroke-width="1.9"/>'
        '<path d="M12 5.4c-.9-2.2-2-3.2-3.1-3.2a1.6 1.6 0 0 0 0 3.2z" fill="currentColor" stroke="none"/>'
        '<path d="M12 5.4c.9-2.2 2-3.2 3.1-3.2a1.6 1.6 0 0 1 0 3.2z" fill="currentColor" stroke="none"/>'
    ),
}


def plain(icon: str, **kw) -> str:
    return group(body(icon), 0, 0, **kw)


def icon_in(icon: str, size: int, tile: int, **kw) -> str:
    """Icon centred inside a tile of `tile` px."""
    off = (tile - size) / 2
    return group(body(icon), off, off, **kw)


# ── the 20 styles ───────────────────────────────────────────────────────────
def s_classic(icon, t):
    return f'<rect width="{t}" height="{t}" rx="22" fill="#FFFFFF" stroke="#E5E7EB"/>' \
           + icon_in(icon, 44, t, stroke=INK, width=1.6)


def s_hairline(icon, t):
    return f'<rect width="{t}" height="{t}" rx="22" fill="#FFFFFF" stroke="#E5E7EB"/>' \
           + icon_in(icon, 46, t, stroke="#0B1020", width=1.15)


def s_medium(icon, t):
    return f'<rect width="{t}" height="{t}" rx="22" fill="#FFFFFF" stroke="#E5E7EB"/>' \
           + icon_in(icon, 44, t, stroke=INK, width=1.95)


def s_bold(icon, t):
    return f'<rect width="{t}" height="{t}" rx="22" fill="#FFFFFF" stroke="#E5E7EB"/>' \
           + icon_in(icon, 42, t, stroke=INK, width=2.45)


def s_chunky(icon, t):
    return f'<rect width="{t}" height="{t}" rx="22" fill="#FFFFFF" stroke="#E5E7EB"/>' \
           + icon_in(icon, 40, t, stroke=INK, width=2.95)


def s_sharp(icon, t):
    return f'<rect width="{t}" height="{t}" rx="8" fill="#FFFFFF" stroke="#E5E7EB"/>' \
           + icon_in(icon, 44, t, stroke="#0F172A", width=1.75, cap="square", join="miter")


def s_solid(icon, t):
    off = (t - 46) / 2
    return f'<rect width="{t}" height="{t}" rx="22" fill="#FFFFFF" stroke="#E5E7EB"/>' \
           f'<g transform="translate({off},{off})" color="{INK}">{SOLID[icon]}</g>'


def s_two_tone(icon, t):
    inner = restyle(icon, lambda el, i, n: el.set("stroke", GOLD1) if i == n - 1 else None)
    return f'<rect width="{t}" height="{t}" rx="22" fill="#FFFFFF" stroke="#E5E7EB"/>' \
           + group(inner, (t - 44) / 2, (t - 44) / 2, stroke="#1F2937", width=1.75)


def s_double_line(icon, t):
    inner = restyle(icon, lambda el, i, n: el.set("opacity", "0.32") if i % 2 else None)
    return f'<rect width="{t}" height="{t}" rx="22" fill="#FFFFFF" stroke="#E5E7EB"/>' \
           + icon_in(icon, 44, t, stroke="#0B1020", width=1.8)


def s_gradient_stroke(icon, t):
    return f'<rect width="{t}" height="{t}" rx="22" fill="#FFFFFF" stroke="#E5E7EB"/>' \
           + icon_in(icon, 44, t, stroke="url(#gMix)", width=2.05)


def s_glow_dark(icon, t):
    lay = ""
    for w, o in ((7.5, 0.10), (4.4, 0.16)):
        lay += icon_in(icon, 42, t, stroke=GOLD2, width=w, opacity=o)
    lay += icon_in(icon, 42, t, stroke=GOLD2, width=1.75)
    return f'<rect width="{t}" height="{t}" rx="22" fill="#0B1020"/>' + lay


def s_tinted_plate(icon, t):
    return (f'<rect width="{t}" height="{t}" rx="22" fill="#FFFFFF" stroke="#E5E7EB"/>'
            f'<circle cx="{t/2}" cy="{t/2}" r="{t*0.34}" fill="{GOLD1}" fill-opacity="0.14"/>'
            + icon_in(icon, 40, t, stroke=GOLD3, width=1.75))


def s_solid_gold_plate(icon, t):
    return (f'<rect width="{t}" height="{t}" rx="22" fill="#FFFFFF" stroke="#E5E7EB"/>'
            f'<circle cx="{t/2}" cy="{t/2}" r="{t*0.36}" fill="url(#gGold)"/>'
            + icon_in(icon, 38, t, stroke="#FFFFFF", width=1.8))


def s_keyline_plate(icon, t):
    return (f'<rect width="{t}" height="{t}" rx="22" fill="#FFFFFF" stroke="#E5E7EB"/>'
            f'<circle cx="{t/2}" cy="{t/2}" r="{t*0.36}" fill="none" stroke="#D1D5DB" stroke-width="1.2"/>'
            + icon_in(icon, 36, t, stroke=INK, width=1.6))


def s_gradient_squircle(icon, t):
    return (f'<rect x="6" y="6" width="{t-12}" height="{t-12}" rx="20" fill="url(#gGold)"/>'
            + icon_in(icon, 38, t, stroke="#FFFFFF", width=1.85))


def s_glass(icon, t):
    return (f'<rect width="{t}" height="{t}" rx="22" fill="url(#gGlass)"/>'
            f'<rect x="8" y="8" width="{t-16}" height="{t-16}" rx="18" fill="#FFFFFF" fill-opacity="0.16" '
            f'stroke="#FFFFFF" stroke-opacity="0.42" stroke-width="1.1"/>'
            f'<ellipse cx="{t*0.34}" cy="{t*0.28}" rx="{t*0.2}" ry="{t*0.12}" fill="#FFFFFF" fill-opacity="0.16"/>'
            + icon_in(icon, 36, t, stroke="#FFFFFF", width=1.7))


def s_neumorphic(icon, t):
    return (f'<rect width="{t}" height="{t}" rx="22" fill="#F3F6FB"/>'
            f'<rect x="3" y="4" width="{t-6}" height="{t-6}" rx="19" fill="#E7ECF5"/>'
            f'<rect x="5" y="5" width="{t-10}" height="{t-10}" rx="17" fill="#F8FAFF"/>'
            + icon_in(icon, 40, t, stroke="#5B6472", width=1.75))


def s_sticker(icon, t):
    lay = icon_in(icon, 38, t, stroke="#FFFFFF", width=5.2)
    lay += icon_in(icon, 38, t, stroke="#0B1020", width=1.65)
    return f'<rect width="{t}" height="{t}" rx="22" fill="url(#gGold)"/>' + lay


def s_echo(icon, t):
    lay = ""
    for dx, dy, o in ((3.0, 3.4, 0.10), (1.6, 1.8, 0.18)):
        lay += group(body(icon), (t - 44) / 2 + dx, (t - 44) / 2 + dy,
                     stroke="#0B1020", width=1.8, opacity=o)
    lay += icon_in(icon, 44, t, stroke=INK, width=1.85)
    return f'<rect width="{t}" height="{t}" rx="22" fill="#FFFFFF" stroke="#E5E7EB"/>' + lay


def s_dashed(icon, t):
    return f'<rect width="{t}" height="{t}" rx="22" fill="#FFFFFF" stroke="#E5E7EB"/>' \
           + icon_in(icon, 44, t, stroke=INK, width=1.95, dash="2.9 2.3")


def s_metal(icon, t):
    return (f'<rect width="{t}" height="{t}" rx="22" fill="#0B1020"/>'
            + icon_in(icon, 42, t, stroke="url(#gGold)", width=1.9))


STYLES = [
    ("classic", "Classic monoline", "Clean 1.6 px line — sabse balanced, Telegram/Notion jaisa", s_classic),
    ("hairline", "Hairline luxe", "Patli 1.15 px line — CRED/Apple jaisa premium feel", s_hairline),
    ("medium", "Medium line", "1.95 px — thoda bharipo, zyada saaf dikhe", s_medium),
    ("bold", "Bold line", "2.45 px — bold aur confident, Instagram jaisa", s_bold),
    ("chunky", "Chunky friendly", "2.95 px — mota aur friendly, Duolingo/Zomato jaisa", s_chunky),
    ("sharp", "Sharp geometric", "Square corners — technical, Stripe/Linear jaisa", s_sharp),
    ("solid", "Solid filled", "Pura bhara hua shape — sabse jaldi samajh aata hai (aapke filter jaisa)", s_solid),
    ("two_tone", "Gold accent", "Dark line + ek hissa gold me — branded premium", s_two_tone),
    ("double_line", "Layered fade", "Kuch lines halki, kuch gehri — depth wala look", s_double_line),
    ("gradient_stroke", "Gradient line", "Line me gold-violet gradient — 2026 modern", s_gradient_stroke),
    ("glow_dark", "Neon glow (dark)", "Dark pe gold line + halki chamak — gaming/CRED jaisa", s_glow_dark),
    ("tinted_plate", "Tinted circle", "Halka gold circle peeche — soft aur premium", s_tinted_plate),
    ("solid_gold_plate", "Gold disc", "Bhara hua gold circle + white icon — PhonePe jaisa", s_solid_gold_plate),
    ("keyline_plate", "Circle keyline", "Patla circle border — list rows me bahut common", s_keyline_plate),
    ("gradient_squircle", "Gold tile", "Gold gradient ka rounded square — app icon jaisa", s_gradient_squircle),
    ("glass", "Glass (frosted)", "Kaanch jaisa tile — 2026 glassmorphism", s_glass),
    ("neumorphic", "Soft emboss", "Ubhaar hua soft tile — halka 3D feel", s_neumorphic),
    ("sticker", "Sticker", "White outline + ink icon — WhatsApp sticker jaisa", s_sticker),
    ("echo", "Echo depth", "Icon ke peeche halki parchhai — modern depth", s_echo),
    ("dashed", "Dashed tech", "Dotted/broken line — techy, data wala feel", s_dashed),
    ("metal", "Metallic gold (dark)", "Dark pe gold gradient line — luxury", s_metal),
]


# ── rendering ───────────────────────────────────────────────────────────────
def render_row(style_fn, icons: list[str], tile: int = 92, gap: int = 12) -> Image.Image:
    w = len(icons) * tile + (len(icons) - 1) * gap
    cells = "".join(
        f'<g transform="translate({i * (tile + gap)},0)">{style_fn(icon, tile)}</g>'
        for i, icon in enumerate(icons)
    )
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{tile}" '
           f'viewBox="0 0 {w} {tile}">{defs()}<rect width="{w}" height="{tile}" fill="#FFFFFF"/>'
           f'{cells}</svg>')
    png = cairosvg.svg2png(bytestring=svg.encode(), output_width=w * 2, output_height=tile * 2)
    return Image.open(io.BytesIO(png)).convert("RGB")


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONTS[0] if bold else FONTS[1], size)


def sheet(demos: list[tuple], title: str, path: Path) -> None:
    pad, label_h, row_gap = 30, 46, 18
    rows = [render_row(fn, SAMPLE) for _, _, _, fn in demos]
    w = rows[0].width + pad * 2
    h = 78 + sum(r.height + label_h + row_gap for r in rows)
    img = Image.new("RGB", (w, h), "#FFFFFF")
    d = ImageDraw.Draw(img)
    d.text((pad, 22), title, fill="#111827", font=font(22, True))
    d.text((pad, 52), f"{len(demos)} styles · same {len(SAMPLE)} icons har style me · "
                      f"jo pasand aaye uska number batao", fill="#6B7280", font=font(14))
    y = 78
    start = int(re.search(r"(\d+)_\d+", path.name).group(1))
    for i, (row, (_, name, hint, _fn)) in enumerate(zip(rows, demos)):
        n = start + i
        d.text((pad, y + 6), f"{n:02d}", fill=GOLD3, font=font(20, True))
        d.text((pad + 40, y + 6), name, fill="#111827", font=font(16, True))
        d.text((pad + 40, y + 26), hint, fill="#6B7280", font=font(12.5))
        img.paste(row, (pad, y + label_h - 8))
        y += label_h + row.height + row_gap
    img.save(path)
    print(f"wrote {path.relative_to(ROOT)}  ({img.size[0]}×{img.size[1]})")


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    for i, (slug, name, hint, fn) in enumerate(STYLES, start=1):
        row = render_row(fn, SAMPLE)
        row.save(OUT / f"demo_{i:02d}_{slug}.png")

    sheet(STYLES[:10], "ANDOS Referral — icon style demos (01–10)", OUT / "STYLE_DEMOS_01_10.png")
    sheet(STYLES[10:], "ANDOS Referral — icon style demos (11–21)", OUT / "STYLE_DEMOS_11_20.png")

    # explicit file list: never let the archive try to include itself
    zpath = OUT / "style_demos.zip"
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(OUT.glob("demo_*.png")) + sorted(OUT.glob("STYLE_DEMOS_*.png")):
            z.write(f, f.name)
    print(f"wrote {zpath.relative_to(ROOT)} ({zpath.stat().st_size:,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
