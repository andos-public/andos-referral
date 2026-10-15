#!/usr/bin/env python3
"""Builds the Chat app preview: a page that IS the app, nothing else.

    python3 tool/app_preview/build.py

Reads `template.html`, embeds the real Plus Jakarta Sans font and the app's own
SVG icons as data, and writes a single file that opens anywhere with no network:

    tool/app_preview/app_chat.html          (in the repo)
    /home/user/ANDOS_App_Chat.html          (workspace root, for the owner)

There is no explanatory text inside the page — it boots like the app, shows the
Chat tab and responds to taps. The explanation lives outside, in chat.
"""
from __future__ import annotations

import base64
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]          # mobile/
HERE = Path(__file__).resolve().parent
SRC = ROOT / "assets" / "icons_src"
FONT = ROOT / "assets" / "fonts" / "PlusJakartaSans-VariableFont_wght.ttf"
OUT = HERE / "app_chat.html"
ALSO = Path("/home/user/ANDOS_Chat_App.html")

SVG_OPEN = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" '
            'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" '
            'stroke-linejoin="round"')

ICON_RE = re.compile(r"\{\{ICON:([a-z0-9_]+):(\d+)\}\}")


def icon_svg(name: str, size: str) -> str:
    raw = (SRC / f"{name}.svg").read_text(encoding="utf-8")
    body = raw[raw.index(">") + 1: raw.rindex("</svg>")].strip()
    return f'{SVG_OPEN} width="{size}" height="{size}">{body}</svg>'


def font_rule() -> str:
    data = base64.b64encode(FONT.read_bytes()).decode("ascii")
    return ("@font-face{font-family:'PJS';src:url(data:font/ttf;base64," + data +
            ") format('truetype-variations');font-weight:200 800;font-style:normal;"
            "font-display:block}")


def build() -> str:
    html = (HERE / "template.html").read_text(encoding="utf-8")
    html = html.replace("{{FONT}}", font_rule())
    used = set()

    def sub(m: re.Match[str]) -> str:
        used.add(m.group(1))
        return icon_svg(m.group(1), m.group(2))

    html = ICON_RE.sub(sub, html)
    missing = ICON_RE.findall(html)
    if missing:
        raise SystemExit(f"unresolved icons left: {missing}")
    print(f"embedded: font {FONT.stat().st_size:,} B · {len(used)} icons · "
          f"{len(html):,} B total")
    return html


def main() -> int:
    html = build()
    OUT.write_text(html, encoding="utf-8")
    shutil.copyfile(OUT, ALSO)
    old = Path("/home/user/ANDOS_App_Chat.html")
    if old.exists():
        old.unlink()
    print(f"wrote {OUT}")
    print(f"wrote {ALSO}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
