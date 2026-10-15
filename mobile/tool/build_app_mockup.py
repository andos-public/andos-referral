#!/usr/bin/env python3
"""Renders the app screens as pictures so the icons can be judged in context.

    python3 tool/build_app_mockup.py

Output (tool/style_demos/):
  mockup_invite_hub.png     Invite Hub, dark
  mockup_wallet.png         Wallet, dark
  mockup_screens.png        Invite Hub dark + light, side by side
  mockup_screens_pair.png   Wallet dark + light

Every coordinate below is in logical pixels on a 390x844 canvas (iPhone-class),
and the Canvas helper multiplies by SCALE, so nothing drifts.
"""
from __future__ import annotations

import io
from pathlib import Path

import cairosvg
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "icons_src"
OUT = ROOT / "tool" / "style_demos"
FONT = ROOT / "assets" / "fonts" / "PlusJakartaSans-VariableFont_wght.ttf"

W, H, SCALE = 390, 844, 2

DARK = dict(bg="#0B1020", surface="#141C30", surface2="#1B2440", border="#2A3654",
            text="#F8FAFC", muted="#A9B6CE", dim="#7C8AA6", gold="#F59E0B",
            green="#10B981", violet="#8B5CF6", red="#EF4444", hold="#FBBF24",
            on_gold="#0B1020")
LIGHT = dict(bg="#F6F7FB", surface="#FFFFFF", surface2="#EDF0F7", border="#E2E6EF",
             text="#0F172A", muted="#4A5568", dim="#6B7280", gold="#92400E",
             green="#047857", violet="#6D28D9", red="#B91C1C", hold="#B45309",
             on_gold="#FFFFFF")

def mix(fg: str, alpha: float, bg: str) -> str:
    """Alpha-composite fg over bg and return a solid hex (PIL ignores #RRGGBBAA)."""
    f = [int(fg[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(bg[i:i + 2], 16) for i in (1, 3, 5)]
    return "#%02X%02X%02X" % tuple(round(f[i] * alpha + b[i] * (1 - alpha)) for i in range(3))


_icons: dict[tuple[str, int, str], Image.Image] = {}
_fonts: dict[tuple[int, int], ImageFont.FreeTypeFont] = {}


def icon_img(name: str, size: int, colour: str) -> Image.Image:
    key = (name, size, colour)
    if key not in _icons:
        svg = (SRC / f"{name}.svg").read_text(encoding="utf-8")
        png = cairosvg.svg2png(bytestring=svg.encode(), output_width=size * SCALE,
                               output_height=size * SCALE)
        base = Image.open(io.BytesIO(png)).convert("RGBA")
        r, g, b = (int(colour[i:i + 2], 16) for i in (1, 3, 5))
        solid = Image.new("RGBA", base.size, (r, g, b, 255))
        solid.putalpha(base.getchannel("A"))
        _icons[key] = solid
    return _icons[key]


def get_font(size: int, weight: int) -> ImageFont.FreeTypeFont:
    key = (size, weight)
    if key not in _fonts:
        f = ImageFont.truetype(str(FONT), size * SCALE)
        try:
            f.set_variation_by_axes([weight])
        except Exception:
            pass
        _fonts[key] = f
    return _fonts[key]


class Canvas:
    def __init__(self, bg: str):
        self.img = Image.new("RGB", (W * SCALE, H * SCALE), bg)
        self.d = ImageDraw.Draw(self.img)

    def rrect(self, x, y, w, h, r, fill=None, outline=None, width=1):
        self.d.rounded_rectangle([x * SCALE, y * SCALE, (x + w) * SCALE, (y + h) * SCALE],
                                 radius=int(round(r * SCALE)), fill=fill, outline=outline,
                                 width=max(1, int(round(width * SCALE))))

    def rect(self, x, y, w, h, fill):
        self.d.rectangle([int(x * SCALE), int(y * SCALE), int((x + w) * SCALE),
                          int((y + h) * SCALE)], fill=fill)

    def circle(self, cx, cy, r, fill=None, outline=None, width=1):
        self.d.ellipse([int((cx - r) * SCALE), int((cy - r) * SCALE),
                        int((cx + r) * SCALE), int((cy + r) * SCALE)],
                       fill=fill, outline=outline, width=max(1, int(round(width * SCALE))))

    def line(self, x1, y1, x2, y2, fill, width=1):
        self.d.line([int(x1 * SCALE), int(y1 * SCALE), int(x2 * SCALE), int(y2 * SCALE)],
                    fill=fill, width=max(1, int(round(width * SCALE))))

    def text(self, x, y, s, size=13, weight=500, colour="#F8FAFC", anchor="la"):
        self.d.text((int(x * SCALE), int(y * SCALE)), s, font=get_font(size, weight),
                    fill=colour, anchor=anchor)

    def icon(self, name, size, colour, x, y):
        im = icon_img(name, size, colour)
        self.img.paste(im, (int(x * SCALE), int(y * SCALE)), im)

    def tw(self, s, size=13, weight=500):
        return self.d.textlength(s, font=get_font(size, weight)) / SCALE


def status_bar(c: Canvas, col: dict):
    c.text(24, 14, "9:41", 13, 700, col["text"])
    for i, h in enumerate((5, 8, 11, 14)):
        c.rrect(300 + i * 7, 26 - h / 2, 4, h, 1.5, fill=col["text"])
    c.rrect(332, 19, 24, 12, 3, outline=col["text"], width=1.2)
    c.rrect(334, 21, 18, 8, 2, fill=col["text"])


def screen_header(c: Canvas, col: dict, title: str, sub: str, right_icon: str):
    c.text(24, 54, title, 23, 800, col["text"])
    c.text(24, 86, sub, 11.5, 500, col["dim"])
    c.rrect(330, 56, 36, 36, 12, fill=col["surface"], outline=col["border"])
    c.icon(right_icon, 19, col["text"], 338.5, 64.5)


def bottom_nav(c: Canvas, col: dict, active: int):
    c.rrect(16, H - 96, W - 32, 76, 32, fill=col["surface"], outline=col["border"])
    items = [("nav_invite", "Invite"), ("nav_referrals", "Referrals"), ("nav_chat", "Chat"),
             ("nav_wallet", "Wallet"), ("nav_settings", "Settings")]
    slot = (W - 32) / 5
    for i, (name, label) in enumerate(items):
        cx = 16 + slot * i + slot / 2
        on = i == active
        if on:
            c.rrect(cx - 25, H - 88, 50, 46, 16,
                    fill=mix(col["gold"], 0.16, col["surface"]))
        tint = col["gold"] if on else col["dim"]
        c.icon(name, 21, tint, cx - 10.5, H - 81)
        c.text(cx, H - 54, label, 9, 700 if on else 500, tint, anchor="ma")


def invite_hub(col: dict) -> Image.Image:
    c = Canvas(col["bg"])
    status_bar(c, col)
    screen_header(c, col, "Invite Hub", "Share your link, earn 25% on every order", "bell")

    # ── hero card ─────────────────────────────────────────────────────────
    c.rrect(16, 110, W - 32, 182, 24, fill=col["surface"], outline=col["border"])
    c.text(34, 128, "THIS MONTH", 10, 700, col["dim"])
    c.rrect(288, 122, 66, 24, 12, fill=mix(col["gold"], 0.16, col["surface"]))
    c.icon("trending_up", 13, col["gold"], 296, 127.5)
    c.text(314, 127, "Live", 11, 700, col["gold"])
    c.text(33, 148, "₹ 4,850", 38, 800, col["gold"])
    c.text(34, 200, "Commission lands here 7 days after an order completes.",
           11, 500, col["dim"])
    x = 34
    for label, colour in (("Pending", col["hold"]), ("Available", col["green"]),
                          ("Withdrawn", col["violet"])):
        w = 30 + c.tw(label, 11, 600)
        c.rrect(x, 236, w, 27, 13.5, fill=mix(colour, 0.15, col["surface"]),
                outline=mix(colour, 0.38, col["surface"]))
        c.circle(x + 12.5, 249.5, 3.5, fill=colour)
        c.text(x + 21, 243.5, label, 11, 700, colour)
        x += w + 8

    # ── quick actions ─────────────────────────────────────────────────────
    c.text(24, 312, "Quick actions", 13.5, 700, col["text"])
    actions = [("link", "My link", True), ("qr_code", "QR code", False),
               ("share", "Share", False), ("copy", "Copy", False)]
    slot = (W - 48) / 4
    for i, (name, label, primary) in enumerate(actions):
        cx = 24 + slot * i + slot / 2
        c.rrect(cx - 26, 334, 52, 52, 16,
                fill=col["gold"] if primary else col["surface"],
                outline=None if primary else col["border"])
        c.icon(name, 22, col["on_gold"] if primary else col["gold"], cx - 11, 349)
        c.text(cx, 394, label, 10.5, 600, col["text"] if primary else col["muted"], anchor="ma")

    # ── stats strip ───────────────────────────────────────────────────────
    c.rrect(16, 420, W - 32, 86, 20, fill=col["surface"], outline=col["border"])
    stats = [("cursor_tap", "248", "Clicks"), ("user_check", "36", "Signups"),
             ("chart_bars", "14%", "Converted"), ("hourglass", "7d", "Release")]
    slot = (W - 32) / 4
    for i, (name, value, label) in enumerate(stats):
        cx = 16 + slot * i + slot / 2
        if i:
            c.line(16 + slot * i, 436, 16 + slot * i, 490, col["border"])
        c.icon(name, 17, col["gold"], cx - 8.5, 436)
        c.text(cx, 460, value, 16, 800, col["text"], anchor="ma")
        c.text(cx, 482, label, 9.5, 500, col["dim"], anchor="ma")

    # ── my links (empty state) ────────────────────────────────────────────
    c.rrect(16, 522, W - 32, 158, 20, fill=col["surface"], outline=col["border"])
    c.text(34, 538, "My links", 13.5, 700, col["text"])
    c.icon("inbox_empty", 38, col["dim"], W / 2 - 19, 566)
    c.text(W / 2, 616, "No links yet", 13, 700, col["text"], anchor="ma")
    c.text(W / 2, 636, "Create your first invite link to start earning",
           10.5, 500, col["dim"], anchor="ma")

    bottom_nav(c, col, 0)
    return c.img


def wallet(col: dict) -> Image.Image:
    c = Canvas(col["bg"])
    status_bar(c, col)
    screen_header(c, col, "Wallet", "Available, on hold and withdrawn", "filter")

    # ── balance card ──────────────────────────────────────────────────────
    c.rrect(16, 110, W - 32, 152, 24, fill=col["surface"], outline=col["border"])
    c.text(34, 128, "AVAILABLE BALANCE", 10, 700, col["dim"])
    c.text(33, 146, "₹ 3,240", 36, 800, col["gold"])
    c.text(34, 197, "₹ 1,610 on hold · releases in 3 days", 11, 500, col["dim"])
    for i, (label, name) in enumerate((("Withdraw", "arrow_up_right"), ("Ledger", "receipt"))):
        x = 34 + i * 106
        c.rrect(x, 220, 96, 32, 12, fill=col["surface2"], outline=col["border"])
        c.icon(name, 15, col["gold"], x + 10, 228.5)
        c.text(x + 30, 228, label, 11.5, 700, col["text"])

    # ── ledger rows ───────────────────────────────────────────────────────
    c.text(24, 278, "Recent activity", 13.5, 700, col["text"])
    rows = [
        ("arrow_down_left", "Commission credited", "Order #8421 · 25%", "+ ₹ 250.00", col["green"]),
        ("hourglass", "On hold", "Releases 18 Oct", "₹ 120.00", col["hold"]),
        ("rotate_ccw", "Refund reversal", "Order #8390", "− ₹ 50.00", col["red"]),
        ("arrow_up_right", "Withdrawal", "To HDFC ••4412", "− ₹ 500.00", col["muted"]),
        ("badge_check", "Payout completed", "UTR 4421 8890", "₹ 500.00", col["violet"]),
    ]
    y = 300
    for name, title, sub, amount, colour in rows:
        c.rrect(16, y, W - 32, 62, 18, fill=col["surface"], outline=col["border"])
        c.rrect(28, y + 12, 38, 38, 13, fill=mix(colour, 0.16, col["surface"]))
        c.icon(name, 19, colour, 37.5, y + 21.5)
        c.text(76, y + 14, title, 12.5, 700, col["text"])
        c.text(76, y + 33, sub, 10.5, 500, col["dim"])
        c.text(W - 28, y + 20, amount, 13, 800,
               col["text"] if colour == col["muted"] else colour, anchor="ra")
        y += 70

    bottom_nav(c, col, 3)
    return c.img


def pair(a: Image.Image, b: Image.Image, title: str, path: Path):
    pad, cap = 22, 52
    board = Image.new("RGB", (pad * 3 + a.width * 2, cap + a.height + pad), "#0F172A")
    d = ImageDraw.Draw(board)
    d.text((pad, 16), title, font=get_font(16, 700), fill="#F8FAFC")
    board.paste(a, (pad, cap))
    board.paste(b, (pad * 2 + a.width, cap))
    board.save(path)
    print(f"wrote {path.relative_to(ROOT)}")


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    d_invite, l_invite = invite_hub(DARK), invite_hub(LIGHT)
    d_wallet, l_wallet = wallet(DARK), wallet(LIGHT)
    d_invite.save(OUT / "mockup_invite_hub.png")
    d_wallet.save(OUT / "mockup_wallet.png")
    pair(d_invite, l_invite, "Invite Hub — dark · light", OUT / "mockup_screens.png")
    pair(d_wallet, l_wallet, "Wallet — dark · light", OUT / "mockup_screens_pair.png")
    print("wrote mockup_invite_hub.png, mockup_wallet.png")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
