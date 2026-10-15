#!/usr/bin/env python3
"""Renders the four tabs as pictures, so the flow and the icons can be judged.

    python3 tool/build_app_mockup.py

Screens (each dark + light):
  chat       /chat       — home tab, referral conversations
  referrals  /referrals  — invite link + network progress (one tab)
  wallet     /wallet     — balance, 7-day hold, ledger
  profile    /profile    — profile, stats, and every setting

Boards: mockup_screens.png (chat), mockup_screens_pair.png (referrals),
mockup_wallet_pair.png, mockup_profile_pair.png, plus one PNG per screen.
Pure rendering with the shipped SVG icons, token colours and Plus Jakarta Sans.
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

NAV = [("nav_chat", "Chat"), ("nav_referrals", "Referrals"),
       ("nav_wallet", "Wallet"), ("nav_profile", "Profile")]


def mix(fg: str, alpha: float, bg: str) -> str:
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


def header(c: Canvas, col: dict, title: str, sub: str, actions: list[str]):
    c.text(24, 54, title, 23, 800, col["text"])
    c.text(24, 86, sub, 11.5, 500, col["dim"])
    x = 366 - 40 * len(actions)
    for name in actions:
        c.rrect(x, 56, 36, 36, 12, fill=col["surface"], outline=col["border"])
        c.icon(name, 18, col["text"], x + 9, 65)
        x += 42


def bottom_nav(c: Canvas, col: dict, active: int):
    c.rrect(16, H - 96, W - 32, 76, 32, fill=col["surface"], outline=col["border"])
    slot = (W - 32) / 4
    for i, (name, label) in enumerate(NAV):
        cx = 16 + slot * i + slot / 2
        on = i == active
        if on:
            c.rrect(cx - 27, H - 88, 54, 46, 16, fill=mix(col["gold"], 0.16, col["surface"]))
        tint = col["gold"] if on else col["dim"]
        c.icon(name, 22, tint, cx - 11, H - 68)
        c.text(cx, H - 42, label, 9.5, 700 if on else 500, tint, anchor="ma")


def section(c: Canvas, col: dict, y: float, label: str) -> float:
    c.text(24, y, label.upper(), 11.5, 700, col["dim"])
    return y + 22


# ── 0 · Chat (home) ─────────────────────────────────────────────────────────
def chat(col: dict) -> Image.Image:
    c = Canvas(col["bg"])
    status_bar(c, col)
    header(c, col, "Chats", "Your referral conversations", ["search"])

    y = section(c, col, 122, "Locked until verified")
    c.rrect(16, y, W - 32, 74, 18, fill=col["surface"], outline=col["border"])
    c.rrect(28, y + 15, 44, 44, 14, fill=col["surface2"])
    c.icon("chat_locked", 20, col["dim"], 40, y + 27)
    c.text(84, y + 18, "Chat locked", 14.5, 700, col["text"])
    c.text(84, y + 38, "Unlocks after the friend installs + logs in", 11, 500, col["dim"])
    c.icon("info", 16, col["dim"], W - 42, y + 29)

    y = section(c, col, y + 100, "Conversations")
    c.rrect(16, y, W - 32, 190, 20, fill=col["surface"], outline=col["border"])
    c.icon("nav_chat", 40, col["dim"], W / 2 - 20, y + 34)
    c.text(W / 2, y + 92, "No conversations yet", 15, 700, col["text"], anchor="ma")
    c.text(W / 2, y + 114, "Invite a friend from the Referrals tab —", 11.5, 500, col["dim"], anchor="ma")
    c.text(W / 2, y + 130, "the chat appears here once they join.", 11.5, 500, col["dim"], anchor="ma")

    # an example row, so the owner sees how a live thread will look
    y2 = y + 210
    c.text(24, y2, "WHEN SOMEONE JOINS", 11.5, 700, col["dim"])
    y2 += 22
    c.rrect(16, y2, W - 32, 66, 18, fill=col["surface"], outline=col["border"])
    c.circle(46, y2 + 33, 20, fill=mix(col["gold"], 0.18, col["surface"]))
    c.icon("nav_profile", 20, col["gold"], 36, y2 + 23)
    c.text(78, y2 + 16, "New friend", 14, 700, col["text"])
    c.text(78, y2 + 36, "Say hello — your referral is verified", 11, 500, col["dim"])
    c.icon("chevron_right", 16, col["dim"], W - 40, y2 + 25)

    bottom_nav(c, col, 0)
    return c.img


# ── 1 · Referrals (invite + network) ────────────────────────────────────────
def referrals(col: dict) -> Image.Image:
    c = Canvas(col["bg"])
    status_bar(c, col)
    header(c, col, "Referrals", "Your link, your network, their progress", ["qr_code"])

    # invite card
    c.rrect(16, 122, W - 32, 132, 22, fill=col["surface"], outline=col["border"])
    c.text(34, 140, "YOUR INVITE LINK", 10.5, 700, col["dim"])
    c.icon("link", 17, col["gold"], 34, 160)
    c.text(58, 160, "andos.app/r/YOURCODE", 13.5, 600, col["muted"])
    c.rrect(34, 192, 190, 44, 14, fill=col["gold"])
    c.icon("share", 18, col["on_gold"], 64, 205)
    c.text(90, 205, "Share link", 13.5, 700, col["on_gold"])
    c.rrect(232, 192, 44, 44, 14, fill=col["surface2"], outline=col["border"])
    c.icon("qr_code", 19, col["gold"], 244.5, 204.5)
    c.rrect(284, 192, 44, 44, 14, fill=col["surface2"], outline=col["border"])
    c.icon("copy", 19, col["gold"], 296.5, 204.5)

    # stats strip
    c.rrect(16, 266, W - 32, 84, 20, fill=col["surface"], outline=col["border"])
    stats = [("cursor_tap", "248", "Clicks"), ("user_plus", "36", "Signups"),
             ("chart_bars", "14%", "Converted"), ("trending_up", "₹4.8k", "Earned")]
    slot = (W - 32) / 4
    for i, (name, value, label) in enumerate(stats):
        cx = 16 + slot * i + slot / 2
        if i:
            c.line(16 + slot * i, 282, 16 + slot * i, 334, col["border"])
        c.icon(name, 17, col["gold"], cx - 8.5, 282)
        c.text(cx, 304, value, 15, 800, col["text"], anchor="ma")
        c.text(cx, 326, label, 9.5, 500, col["dim"], anchor="ma")

    y = section(c, col, 364, "Your network")
    c.rrect(16, y, W - 32, 100, 20, fill=col["surface"], outline=col["border"])
    c.icon("network", 34, col["dim"], W / 2 - 17, y + 16)
    c.text(W / 2, y + 58, "No referrals yet", 14.5, 700, col["text"], anchor="ma")
    c.text(W / 2, y + 78, "Friends appear here the moment they register", 11,
           500, col["dim"], anchor="ma")

    y = section(c, col, y + 122, "How a referral completes")
    steps = [("link", "Link opened", "Attributed to you"),
             ("user_plus", "Signed up", "New account created"),
             ("user_check", "Install + login", "Verified from the main app"),
             ("chat_unlocked", "Chat unlocked", "You can message each other")]
    c.rrect(16, y, W - 32, 6 + 44 * len(steps), 20, fill=col["surface"], outline=col["border"])
    for i, (name, title, sub) in enumerate(steps):
        yy = y + 12 + i * 44
        c.rrect(30, yy, 32, 32, 11, fill=mix(col["gold"], 0.16, col["surface"]))
        c.icon(name, 16, col["gold"], 38, yy + 8)
        c.text(72, yy + 1, title, 13.5, 700, col["text"])
        c.text(72, yy + 18, sub, 10.5, 500, col["dim"])
        c.text(W - 34, yy + 6, f"{i + 1}", 12, 700, col["dim"], anchor="ra")

    bottom_nav(c, col, 1)
    return c.img


# ── 2 · Wallet ──────────────────────────────────────────────────────────────
def wallet(col: dict) -> Image.Image:
    c = Canvas(col["bg"])
    status_bar(c, col)
    header(c, col, "Wallet", "Available · 7-day hold · Withdrawn", ["filter"])

    c.rrect(16, 122, W - 32, 148, 22, fill=col["surface"], outline=col["border"])
    c.text(34, 140, "AVAILABLE BALANCE", 10.5, 700, col["dim"])
    c.text(33, 158, "₹ 3,240", 36, 800, col["gold"])
    c.text(34, 208, "₹ 1,610 on hold · releases in 3 days", 11, 500, col["dim"])
    for i, (label, name) in enumerate((("Withdraw", "arrow_up_right"), ("Ledger", "receipt"))):
        x = 34 + i * 106
        c.rrect(x, 228, 96, 32, 12, fill=col["surface2"], outline=col["border"])
        c.icon(name, 15, col["gold"], x + 10, 236.5)
        c.text(x + 30, 236, label, 11.5, 700, col["text"])

    y = section(c, col, 288, "Recent activity")
    rows = [("arrow_down_left", "Commission credited", "Order #8421 · 25%", "+ ₹ 250.00", col["green"]),
            ("hourglass", "On hold", "Releases 18 Oct", "₹ 120.00", col["hold"]),
            ("rotate_ccw", "Refund reversal", "Order #8390", "− ₹ 50.00", col["red"]),
            ("arrow_up_right", "Withdrawal", "To HDFC ••4412", "− ₹ 500.00", col["muted"]),
            ("badge_check", "Payout completed", "UTR 4421 8890", "₹ 500.00", col["violet"])]
    for name, title, sub, amount, colour in rows:
        c.rrect(16, y, W - 32, 62, 18, fill=col["surface"], outline=col["border"])
        c.rrect(28, y + 12, 38, 38, 13, fill=mix(colour, 0.16, col["surface"]))
        c.icon(name, 19, colour, 37.5, y + 21.5)
        c.text(76, y + 14, title, 12.5, 700, col["text"])
        c.text(76, y + 33, sub, 10.5, 500, col["dim"])
        c.text(W - 28, y + 20, amount, 13, 800,
               col["text"] if colour == col["muted"] else colour, anchor="ra")
        y += 70

    bottom_nav(c, col, 2)
    return c.img


# ── 3 · Profile (profile + every setting) ───────────────────────────────────
def profile(col: dict) -> Image.Image:
    c = Canvas(col["bg"])
    status_bar(c, col)
    header(c, col, "Profile", "You, your stats and your settings", [])

    c.rrect(16, 122, W - 32, 72, 20, fill=col["surface"], outline=col["border"])
    c.rrect(30, 136, 44, 44, 14, fill=mix(col["gold"], 0.16, col["surface"]))
    c.icon("nav_profile", 21, col["gold"], 41.5, 147.5)
    c.text(90, 141, "Your profile", 15, 700, col["text"])
    c.text(90, 161, "Signs in with the main app account", 11, 500, col["dim"])
    c.icon("chevron_right", 16, col["dim"], W - 40, 150)

    c.rrect(16, 206, W - 32, 72, 20, fill=col["surface"], outline=col["border"])
    stats = [("nav_referrals", "12", "Referrals"), ("rupee", "₹4.8k", "Earned"),
             ("lock", "₹1.6k", "On hold")]
    slot = (W - 32) / 3
    for i, (name, value, label) in enumerate(stats):
        cx = 16 + slot * i + slot / 2
        if i:
            c.line(16 + slot * i, 220, 16 + slot * i, 266, col["border"])
        c.icon(name, 16, col["gold"], cx - 8, 220)
        c.text(cx, 240, value, 15, 800, col["text"], anchor="ma")
        c.text(cx, 260, label, 9.5, 500, col["dim"], anchor="ma")

    y = section(c, col, 290, "Appearance")
    c.rrect(16, y, W - 32, 84, 20, fill=col["surface"], outline=col["border"])
    c.text(34, y + 14, "Theme", 14, 700, col["text"])
    opts = [("sun", "Light", False), ("moon", "Dark", True), ("theme_auto", "System", False)]
    ow = 100
    for i, (name, label, on) in enumerate(opts):
        x = 34 + i * (ow + 10)
        c.rrect(x, y + 38, ow, 38, 13,
                fill=mix(col["gold"], 0.16, col["surface"]) if on else col["surface2"],
                outline=mix(col["gold"], 0.45, col["surface"]) if on else col["border"])
        c.icon(name, 15, col["gold"] if on else col["muted"], x + 18, y + 49)
        c.text(x + 40, y + 49, label, 12, 700 if on else 500,
               col["text"] if on else col["muted"])

    y = section(c, col, y + 110, "Feel")
    c.rrect(16, y, W - 32, 66, 20, fill=col["surface"], outline=col["border"])
    c.icon("mic", 19, col["muted"], 32, y + 23)
    c.text(62, y + 14, "Haptic feedback", 14, 700, col["text"])
    c.text(62, y + 33, "A light tap on every touch point", 11, 500, col["dim"])
    c.rrect(W - 78, y + 18, 44, 26, 13, fill=col["gold"])
    c.circle(W - 45, y + 31, 10, fill="#FFFFFF")

    y = section(c, col, y + 92, "Account")
    rows = [("bank", "Payout methods", "Bank / UPI, stored masked"),
            ("receipt", "Withdrawal history", "Past payout requests and UTRs"),
            ("fingerprint", "Security", "Biometric lock and sessions"),
            ("bell", "Notifications", "Referral, payout and chat alerts"),
            ("help_circle", "Help & support", "FAQ and contact")]
    # keep the card clear of the floating nav — the rest scrolls on a real phone
    rows = rows[: max(1, int((H - 128 - (y + 12)) // 52))]
    c.rrect(16, y, W - 32, 24 + 52 * len(rows), 20, fill=col["surface"], outline=col["border"])
    for i, (name, title, sub) in enumerate(rows):
        yy = y + 14 + i * 52
        c.icon(name, 19, col["muted"], 32, yy + 4)
        c.text(62, yy, title, 13.5, 700, col["text"])
        c.text(62, yy + 18, sub, 10.5, 500, col["dim"])
        c.icon("chevron_right", 15, col["dim"], W - 40, yy + 4)
        if i < len(rows) - 1:
            c.line(62, yy + 42, W - 32, yy + 42, col["border"])

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


def strip(images: list[tuple[str, Image.Image]], title: str, path: Path):
    """All four tabs in one row — the anatomy of the app in a single picture."""
    from PIL import ImageDraw
    pad, cap, gap = 22, 60, 20
    w = sum(im.width for _, im in images) + gap * (len(images) - 1) + pad * 2
    h = max(im.height for _, im in images) + cap + pad
    board = Image.new("RGB", (w, h), "#0F172A")
    d = ImageDraw.Draw(board)
    d.text((pad, 16), title, font=get_font(16, 700), fill="#F8FAFC")
    x = pad
    for label, im in images:
        board.paste(im, (x, cap))
        d.text((x, cap + im.height + 8), label, font=get_font(12, 700), fill="#94A3B8")
        x += im.width + gap
    board.save(path)
    print(f"wrote {path.relative_to(ROOT)}")


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    screens = {"chat": chat, "referrals": referrals, "wallet": wallet, "profile": profile}
    rendered: dict[str, tuple[Image.Image, Image.Image]] = {}
    for name, fn in screens.items():
        dark, light = fn(DARK), fn(LIGHT)
        dark.save(OUT / f"mockup_{name}.png")
        light.save(OUT / f"mockup_{name}_light.png")
        rendered[name] = (dark, light)
        print(f"wrote mockup_{name}.png + mockup_{name}_light.png")

    pair(*rendered["chat"], "Chat (home) — dark · light", OUT / "mockup_screens.png")
    pair(*rendered["referrals"], "Referrals — invite + network — dark · light",
         OUT / "mockup_screens_pair.png")
    pair(*rendered["wallet"], "Wallet — dark · light", OUT / "mockup_wallet_pair.png")
    pair(*rendered["profile"], "Profile + settings — dark · light", OUT / "mockup_profile_pair.png")

    labels = ["1 · Chat (home)", "2 · Referrals", "3 · Wallet", "4 · Profile + settings"]
    order = ["chat", "referrals", "wallet", "profile"]
    strip([(labels[i], rendered[name][0]) for i, name in enumerate(order)],
          "ANDOS Referral — the four tabs, dark", OUT / "app_four_tabs_dark.png")
    strip([(labels[i], rendered[name][1]) for i, name in enumerate(order)],
          "ANDOS Referral — the four tabs, light", OUT / "app_four_tabs_light.png")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
