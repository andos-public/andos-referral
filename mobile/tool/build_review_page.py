#!/usr/bin/env python3
"""Builds the Chat-screen review page — one self-contained index.html.

    python3 tool/build_review_page.py     # -> tool/review/index.html

The page shows the Chat tab exactly as the app renders it (same tokens, same
SVG icons, same Plus Jakarta Sans, embedded as base64 so the file works with no
internet, no fonts, no CDN) plus a plain-language breakdown of every element:
what it is, what it does and what state it is in today.

Only Chat content appears here — no other tab is shown, by owner request.
"""
from __future__ import annotations

import base64
import html
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "icons_src"
FONT = ROOT / "assets" / "fonts" / "PlusJakartaSans-VariableFont_wght.ttf"
OUT = ROOT / "tool" / "review" / "index.html"

SVG_OPEN = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" '
            'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" '
            'stroke-linejoin="round"')

T = {
    "bg": "#0B1020", "surface": "#141C30", "surface2": "#1B2440", "border": "#2A3654",
    "text": "#F8FAFC", "secondary": "#A9B6CE", "tertiary": "#7C8AA6",
    "gold": "#F59E0B", "goldBright": "#FBBF24", "green": "#10B981",
}


def ic(name: str, size: int) -> str:
    """Inline SVG from the app's own icon sources."""
    raw = (SRC / f"{name}.svg").read_text(encoding="utf-8")
    body = raw[raw.index(">") + 1: raw.rindex("</svg>")].strip()
    return (f'{SVG_OPEN} width="{size}" height="{size}">{body}</svg>')


def font_face() -> str:
    data = base64.b64encode(FONT.read_bytes()).decode("ascii")
    return ("@font-face{font-family:'PJS';src:url(data:font/ttf;base64," + data + ") "
            "format('truetype-variations');font-weight:200 800;font-style:normal;font-display:swap}")


CSS = """
*{box-sizing:border-box;margin:0;padding:0}
body{background:#070B16;color:#E7ECF6;font-family:'PJS',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
  -webkit-font-smoothing:antialiased;line-height:1.55}
.wrap{max-width:1180px;margin:0 auto;padding:40px 22px 90px}
.kicker{font-size:12.5px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#FBBF24}
h1{font-size:34px;font-weight:800;letter-spacing:-.6px;margin:10px 0 12px;color:#F8FAFC}
.sub{font-size:15.5px;color:#A9B6CE;max-width:820px}
.note{margin-top:18px;padding:13px 16px;border:1px solid #26304D;border-radius:14px;background:#0E1428;
  color:#A9B6CE;font-size:13.5px;max-width:900px}
.note b{color:#E7ECF6}
h2.sec{font-size:13px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#7C8AA6;
  margin:52px 0 6px}
h3.big{font-size:25px;font-weight:800;color:#F8FAFC;letter-spacing:-.4px}
.lead{font-size:14.5px;color:#A9B6CE;margin:8px 0 22px;max-width:900px}

/* ── phone ─────────────────────────────────────────────────────────── */
.stage{display:grid;grid-template-columns:400px 1fr;gap:34px;align-items:start;margin-top:26px}
@media(max-width:880px){.stage{grid-template-columns:1fr}}
.phone{position:relative;width:390px;height:844px;border-radius:46px;padding:9px;
  background:linear-gradient(160deg,#2A3654,#0E1428 60%);box-shadow:0 40px 90px rgba(0,0,0,.6)}
.screen{position:relative;width:100%;height:100%;border-radius:38px;overflow:hidden;
  background:radial-gradient(120% 60% at 88% -6%,rgba(245,158,11,.13),rgba(11,16,32,0) 60%),#0B1020}
.island{position:absolute;top:13px;left:50%;transform:translateX(-50%);width:104px;height:26px;
  border-radius:16px;background:#000;opacity:.72;z-index:6}
.statusbar{display:flex;justify-content:space-between;align-items:center;padding:15px 26px 0;font-size:12.5px;font-weight:700;color:#F8FAFC}
.statusbar .rig{display:flex;gap:5px;align-items:center}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;padding:16px 24px 0}
.hdr h4{font-size:23px;font-weight:800;letter-spacing:-.3px;color:#F8FAFC}
.hdr p{font-size:11.5px;color:#7C8AA6;font-weight:500;margin-top:1px}
.hbtn{width:40px;height:40px;border-radius:12px;border:1px solid #2A3654;background:#1B2440;color:#A9B6CE;
  display:flex;align-items:center;justify-content:center}
.body{padding-top:16px;position:absolute;top:104px;left:0;right:0;bottom:0;overflow:hidden}
.card{background:rgba(20,28,48,.78);border:1px solid #2A3654;border-radius:20px;padding:16px;margin:0 16px}
.card+.card{margin-top:12px}
.label{font-size:11.5px;font-weight:800;letter-spacing:.9px;text-transform:uppercase;color:#7C8AA6;margin:20px 24px 10px}
.badge{width:48px;height:48px;border-radius:16px;background:rgba(245,158,11,.16);color:#FBBF24;
  display:flex;align-items:center;justify-content:center}
.badge.sm{width:44px;height:44px;border-radius:13px;background:#1B2440;color:#7C8AA6}
.card h5{font-size:20px;font-weight:800;color:#F8FAFC;margin-top:14px}
.card h5.s{font-size:14.5px}
.card p.d{font-size:14px;color:#A9B6CE;margin-top:6px}
.card p.cap{font-size:12px;color:#7C8AA6;margin-top:3px}
.row{display:flex;align-items:center;gap:12px}
.grow{flex:1;min-width:0}
.empty{display:flex;flex-direction:column;align-items:center;text-align:center;padding:26px 18px}
.empty h5{font-size:15px;margin-top:12px}
.empty p{font-size:12px;color:#7C8AA6;margin-top:4px;max-width:250px}
.chatrow{display:flex;align-items:center;gap:12px;padding:14px 16px}
.chatrow+.chatrow{border-top:1px solid rgba(42,54,84,.7)}
.ava{width:44px;height:44px;border-radius:14px;background:rgba(245,158,11,.16);color:#FBBF24;
  display:flex;align-items:center;justify-content:center;flex:0 0 auto}
.ava.mute{background:#1B2440;color:#7C8AA6}
.who{font-size:14px;font-weight:700;color:#F8FAFC}
.msg{font-size:12px;color:#7C8AA6;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.meta{text-align:right;flex:0 0 auto}
.meta .t{font-size:10.5px;color:#7C8AA6;font-weight:600}
.pill{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:800;letter-spacing:.3px;
  padding:3px 8px;border-radius:9px;background:rgba(245,158,11,.16);color:#FBBF24;margin-top:5px}
.pill.plain{background:#1B2440;color:#7C8AA6}
.pill.g{background:rgba(16,185,129,.15);color:#34D399}
.navdots{position:absolute;left:16px;right:16px;bottom:16px;height:68px;border-radius:32px;
  background:rgba(20,28,48,.72);border:1px solid #2A3654;backdrop-filter:blur(18px);
  display:flex;align-items:center}
.navdots .it{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:9.5px;
  font-weight:600;color:#7C8AA6}
.navdots .it.on{color:#FBBF24;font-weight:800}
.navdots .it .box{width:54px;height:42px;border-radius:16px;display:flex;align-items:center;justify-content:center}
.navdots .it.on .box{background:rgba(245,158,11,.16)}
.hot{position:absolute;width:25px;height:25px;border-radius:50%;background:#FBBF24;color:#0B1020;
  font-size:12.5px;font-weight:800;display:flex;align-items:center;justify-content:center;
  box-shadow:0 0 0 3px rgba(11,16,32,.9),0 4px 14px rgba(0,0,0,.5);z-index:8}

/* ── legend ────────────────────────────────────────────────────────── */
.legend{display:flex;flex-direction:column;gap:11px}
.leg{display:flex;gap:13px;padding:14px 16px;border:1px solid #232C48;border-radius:16px;background:#0E1428}
.leg .n{flex:0 0 auto;width:25px;height:25px;border-radius:50%;background:#FBBF24;color:#0B1020;
  font-size:12.5px;font-weight:800;display:flex;align-items:center;justify-content:center}
.leg h6{font-size:14.5px;font-weight:800;color:#F8FAFC}
.leg p{font-size:13px;color:#A9B6CE;margin-top:3px}

/* ── detail cards ──────────────────────────────────────────────────── */
.detail{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;margin-top:22px}
.dcard{border:1px solid #232C48;border-radius:18px;background:#0E1428;padding:18px 18px 16px}
.dcard .top{display:flex;align-items:center;gap:11px;margin-bottom:10px}
.dcard .n{width:25px;height:25px;border-radius:50%;background:#FBBF24;color:#0B1020;font-size:12.5px;
  font-weight:800;display:flex;align-items:center;justify-content:center;flex:0 0 auto}
.dcard h6{font-size:15.5px;font-weight:800;color:#F8FAFC}
.dcard dl{display:grid;grid-template-columns:88px 1fr;gap:6px 12px;font-size:13px}
.dcard dt{color:#7C8AA6;font-weight:700;font-size:11.5px;letter-spacing:.5px;text-transform:uppercase;padding-top:2px}
.dcard dd{color:#C6D0E2}
.dcard dd b{color:#F8FAFC}

/* ── states ────────────────────────────────────────────────────────── */
.states{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:22px;margin-top:22px}
.state .minibox{width:242px;height:523px;overflow:hidden;border-radius:29px;margin:0 auto;
  box-shadow:0 22px 50px rgba(0,0,0,.5)}
.state .phone{transform:scale(.62);transform-origin:top left;border-radius:29px;padding:6px}
.state .screen{border-radius:24px}
.state h6{margin:14px 4px 5px;font-size:15px;font-weight:800;color:#F8FAFC;text-align:center}
.state p{font-size:12.5px;color:#A9B6CE;text-align:center;max-width:260px;margin:0 auto}
.tag{display:inline-block;font-size:10.5px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;
  padding:4px 9px;border-radius:8px;background:rgba(245,158,11,.16);color:#FBBF24;margin-bottom:8px}

/* ── lists ─────────────────────────────────────────────────────────── */
.cols{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:22px}
@media(max-width:760px){.cols{grid-template-columns:1fr}}
.panel{border:1px solid #232C48;border-radius:18px;background:#0E1428;padding:18px}
.panel h6{font-size:15px;font-weight:800;margin-bottom:10px}
.panel.ok h6{color:#34D399}
.panel.next h6{color:#FBBF24}
.panel ul{list-style:none;display:flex;flex-direction:column;gap:8px}
.panel li{display:flex;gap:9px;font-size:13px;color:#C6D0E2}
.panel li span.mark{flex:0 0 auto;margin-top:1px}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;color:#FBBF24}
.files{margin-top:18px;display:flex;flex-direction:column;gap:8px}
.files div{font-size:13px;color:#A9B6CE}
.files code{color:#E7ECF6}
footer{margin-top:56px;padding-top:22px;border-top:1px solid #232C48;color:#7C8AA6;font-size:13px}
footer b{color:#E7ECF6}
"""


def statusbar() -> str:
    return f"""<div class="island"></div>
  <div class="statusbar"><span>9:41</span>
    <span class="rig">
      <svg width="17" height="11" viewBox="0 0 17 11" fill="{T['text']}"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="3" width="3" height="8" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></svg>
      <svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke="{T['text']}" stroke-width="1.5" stroke-linecap="round"><path d="M1 4.2a10 10 0 0 1 14 0M3.6 6.9a6.2 6.2 0 0 1 8.8 0"/><circle cx="8" cy="9.4" r="1" fill="{T['text']}" stroke="none"/></svg>
      <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x=".8" y=".8" width="20" height="10.4" rx="3" stroke="{T['text']}" stroke-width="1.2"/><rect x="2.6" y="2.6" width="16.4" height="6.8" rx="2" fill="{T['text']}"/><rect x="22.2" y="4" width="2" height="4" rx="1" fill="{T['text']}"/></svg>
    </span></div>"""


def header() -> str:
    return f"""<div class="hdr">
    <div><h4>Chats</h4><p>Your referral conversations</p></div>
    <div class="hbtn">{ic('search', 18)}</div>
  </div>"""


def nav(active: int = 0) -> str:
    labels = [("nav_chat", "Chat"), ("nav_referrals", "Referrals"),
              ("nav_wallet", "Wallet"), ("nav_profile", "Profile")]
    items = "".join(
        f"""<div class="it{' on' if i == active else ''}"><div class="box">{ic(name, 22)}</div>{label}</div>"""
        for i, (name, label) in enumerate(labels))
    return f'<div class="navdots">{items}</div>'


def body_now() -> str:
    return f"""<div class="body">
    <div class="card">
      <div class="badge">{ic('attach', 22)}</div>
      <h5>Coming in the next step</h5>
      <p class="d">Chat opens the moment the messaging API lands — the list, search and threads are already routed.</p>
    </div>
    <div class="label">Locked until verified</div>
    <div class="card">
      <div class="row">
        <div class="badge sm">{ic('chat_locked', 20)}</div>
        <div class="grow">
          <div class="who">Chat locked</div>
          <p class="cap">A thread unlocks after the friend installs the app and logs in.</p>
        </div>
        <span style="color:{T['tertiary']}">{ic('info', 16)}</span>
      </div>
    </div>
    <div class="label">Conversations</div>
    <div class="card">
      <div class="empty">
        <span style="color:{T['tertiary']}">{ic('nav_chat', 40)}</span>
        <h5>No conversations yet</h5>
        <p>A thread appears here as soon as a friend's install + login is verified.</p>
      </div>
    </div>
  </div>"""


def body_locked() -> str:
    rows = "".join(
        f"""<div class="chatrow">
        <div class="ava mute">{ic('chat_locked', 20)}</div>
        <div class="grow"><div class="who">{name}</div><div class="msg">Install + login pending</div></div>
        <div class="meta"><div class="t">{when}</div><div class="pill plain">Locked</div></div>
      </div>"""
        for name, when in (("Rahul K.", "2m"), ("Sneha S.", "1h"), ("Amit", "3d")))
    return f"""<div class="body">
    <div class="card">
      <div class="row">
        <div class="badge sm">{ic('chat_locked', 20)}</div>
        <div class="grow">
          <div class="who">Chat locked</div>
          <p class="cap">A thread unlocks after the friend installs the app and logs in.</p>
        </div>
        <span style="color:{T['tertiary']}">{ic('info', 16)}</span>
      </div>
    </div>
    <div class="label">Conversations</div>
    <div class="card" style="padding:0;opacity:.72">{rows}</div>
  </div>"""


def body_future() -> str:
    rows = [
        ("Rahul Kumar", "Bhai install ho gaya, login bhi ✅", "2m", 2),
        ("Sneha S.", "Referral verified 🎉", "1h", 0),
        ("Amit", "Chalo chat karte hain", "Yesterday", 1),
    ]
    out = ""
    for name, msg, when, unread in rows:
        badge = f'<div class="pill">+{unread}</div>' if unread else \
                f'<div class="pill g">Open</div>'
        out += f"""<div class="chatrow">
        <div class="ava">{ic('nav_profile', 20)}</div>
        <div class="grow"><div class="who">{name}</div><div class="msg">{msg}</div></div>
        <div class="meta"><div class="t">{when}</div>{badge}</div>
      </div>"""
    return f"""<div class="body">
    <div class="label" style="margin-top:6px">Conversations</div>
    <div class="card" style="padding:0">{out}</div>
  </div>"""


PHONE = '<div class="phone"><div class="screen">{status}{hdr}{body}{nav}</div>{hots}</div>'


def phone(variant: str, hotspots: bool = False) -> str:
    bodies = {"now": body_now, "locked": body_locked, "future": body_future}
    marks = {
        "now": [(196, 62), (298, 60), (338, 172), (338, 302), (338, 452), (352, 786)],
    }
    hots = ""
    if hotspots:
        for i, (x, y) in enumerate(marks[variant], start=1):
            hots += f'<div class="hot" style="left:{x}px;top:{y}px">{i}</div>'
    return PHONE.format(status=statusbar(), hdr=header(), body=bodies[variant](), nav=nav(0), hots=hots)


LEGEND = [
    ("Screen ka naam — “Chats”",
     "Header me likha hai aap kahan ho: <b>Chats</b>, aur neeche chhota sa “Your referral conversations”. "
     "Ye header scroll ke saath nahi hilti — upar hi rehti hai."),
    ("Search button (top-right)",
     "Chat list me thread dhoondhne ka button. 40×40 ka dabba, tap par halka haptic + dabne wala animation. "
     "Route ready hai — list aane par naam se filter karega."),
    ("“Coming in the next step” card",
     "Ye <b>imaandaar notice</b> hai. Screen khaali ya toota hua na lage, isliye साफ़ likha hai ki chat "
     "messaging API aane par khulegi. Yahan koi nakli/fake data nahi dikhaya jaata."),
    ("“Chat locked” card",
     "Jab tak friend ne app install karke login nahi kiya, us thread ka status <b>locked</b> rehta hai — "
     "bina verify hue chat khul nahi sakti. Ye Phase-2 ka rule hai, isi liye lock icon + waja yahan dikhti hai."),
    ("“Conversations” area",
     "Aaj khaali state: icon + “No conversations yet” + ek line jo samjhati hai ki thread kab aayegi. "
     "Thread ban jayenge to yahin rows dikhengi — avatar, naam, last message, time, unread count."),
    ("Bottom navigation (Chat active)",
     "4 tabs: <b>Chat · Referrals · Wallet · Profile</b>. Chat gold colour me highlight hai kyunki aap "
     "yahin ho. Frosted glass wali floating bar hai — tap par haptic + spring animation se pill slide karta hai."),
]

DETAIL = [
    ("Screen ka naam — “Chats”", "Safed mota text (23 px)", "Batata hai ki aap home tab par hain aur yahan sirf referral chats hain.",
     "काम कर रहा है. Theme badalne par text colour apne aap adjust hota hai."),
    ("Search button", "40×40 ka rounded square, search icon", "Tap karne par chat search khulega; aaj list khaali hai isliye search bhi khaali dikhega.",
     "Route ready, data Phase-3 me."),
    ("Next-step notice", "Gold icon badge + title + ek line", "User ko saaf batata hai ki ye feature kis phase me aayega — jhoota data ya khaali screen nahi.",
     "काम कर रहा है."),
    ("Chat locked card", "Lock icon + “Chat locked” + waja + info icon", "Un friends ke liye jinka install + login verify nahi hua; nayi chat shuru karne ka option band rehta hai.",
     "Rule live hai (backend se verified signal par hi unlock)."),
    ("Conversations list", "Aaj empty state; kal rows", "Verified friends ke threads: avatar, naam, last message, time, unread badge; row tap karne par thread screen khulti hai.",
     "Empty state live; rows Phase-3 me (route /chat/:id already hai)."),
    ("Bottom nav", "Frosted glass pill, 4 icons + labels", "Screens ke beech switch karta hai; active tab gold pill me highlight hota hai.",
     "पूरा काम कर रहा है (spring animation + haptic)."),
]


def build() -> str:
    legend = "".join(
        f'<div class="leg"><div class="n">{i}</div><div><h6>{t}</h6><p>{d}</p></div></div>'
        for i, (t, d) in enumerate(LEGEND, start=1))

    detail = "".join(
        f"""<div class="dcard"><div class="top"><div class="n">{i}</div><h6>{t}</h6></div>
        <dl><dt>Dikhta kya hai</dt><dd>{a}</dd>
        <dt>Kaam</dt><dd>{b}</dd>
        <dt>Abhi</dt><dd>{c}</dd></dl></div>"""
        for i, (t, a, b, c) in enumerate(DETAIL, start=1))

    ok = ["Tab navigation, header aur search button ka route",
          "Locked state (install + login verify hone tak chat band)",
          "Empty state, dark + light theme, ek hi tap par theme badalna",
          "Haptics har tap par, spring animation nav me",
          "Edge-to-edge layout — content status bar ke peeche tak, koi kaali patti nahi",
          "Chhote phone (360 dp) par bhi layout nahi tootta — test isi ke liye hai",
          "Screen-reader labels (accessibility) har button par",
          "52 automated tests green — layout, icons, theme contrast sab cover"]
    nxt = ["Real messages aana-jaana (messaging API) — Phase 3",
           "Thread screen ke andar baat-cheet, typing, read ticks",
           "Search ka asli filter (naam se thread dhoondhna)",
           "Unread counts aur push notification",
           "Attachment / mic / emoji (icons set me pehle se hain)"]

    files = [
        ("lib/features/chat/presentation/chat_screen.dart", "Chat screen ka poora layout"),
        ("lib/app/router/app_router.dart", "routes: /chat (home) aur /chat/:id (thread)"),
        ("lib/design/widgets/floating_bottom_nav.dart", "frosted nav + spring pill indicator"),
        ("lib/design/widgets/edge_to_edge_scaffold.dart", "header aur edge-to-edge chrome"),
        ("assets/icons_src/*.svg + tool/generate_icons.py", "icons (61 custom SVG, koi icon package nahi)"),
        ("test/app/app_shell_test.dart · test/design/icons_pipeline_test.dart", "is screen ke automated tests"),
    ]

    return f"""<!doctype html>
<html lang="hi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ANDOS Referral — Chat Screen</title>
<style>{font_face()}{CSS}</style></head>
<body><div class="wrap">

  <div class="kicker">ANDOS Referral · Screen Review</div>
  <h1>Chat Screen — poora screen, detail ke saath</h1>
  <p class="sub">Ye page sirf <b>Chat</b> tab ka hai — jaisa aapne kaha, dusre tab ka koi content yahan nahi hai.
  Jo dikh raha hai wahi asli screen hai: same colours, same icons, same font (Plus Jakarta Sans), same gaps.</p>
  <div class="note"><b>File kahin bhi khulegi.</b> Sab kuch isi file ke andar hai (font + icons embedded) — internet,
  Drive ya kisi app ki zarurat nahi. Number <b>1–6</b> phone par lage hain, neeche har number ka matlab likha hai.</div>

  <h2 class="sec">Screen</h2>
  <h3 class="big">Aaj ka Chat screen (dark theme)</h3>
  <p class="lead">App kholte hi yahi screen dikhti hai kyunki Chat pehla (home) tab hai.</p>
  <div class="stage">
    {phone("now", hotspots=True)}
    <div class="legend">{legend}</div>
  </div>

  <h2 class="sec">Detail</h2>
  <h3 class="big">Ek-ek cheez — kaam kya karta hai</h3>
  <p class="lead">Har element ke teen sawaal: क्या dikhta hai, क्या karta hai, aur aaj kis haal me hai.</p>
  <div class="detail">{detail}</div>

  <h2 class="sec">States</h2>
  <h3 class="big">Screen ke teen haal</h3>
  <p class="lead">Ek hi screen teen tarah dikhti hai — depend karta hai aapke referrals ki position par.
  Teesra phone sirf <b>example</b> hai (dikhane ke liye ki backend judne par list kaisi lagegi).</p>
  <div class="states">
    <div class="state">{phone("now")}
      <h6>1 · Aaj — shuruaati haal</h6>
      <p>Yehi abhi app me hai: notice card + locked example + khaali conversations list.</p></div>
    <div class="state">{phone("locked")}
      <h6>2 · Locked threads</h6>
      <p>Friend ne install/login nahi kiya — naam dikh sakta hai, par chat band: “Locked” chip ke saath.</p></div>
    <div class="state">{phone("future")}
      <h6>3 · Verified friends (example)</h6>
      <p>Install + login verify hone par thread row: avatar, last message, time, unread count. Tap par thread khul jayegi.</p></div>
  </div>

  <h2 class="sec">Status</h2>
  <h3 class="big">Abhi kya kaam kar raha hai · kya baaki hai</h3>
  <div class="cols">
    <div class="panel ok"><h6>✅ Abhi kaam kar raha hai</h6><ul>
      {"".join(f'<li><span class="mark">{ic("check", 15)}</span><span>{x}</span></li>' for x in ok)}
    </ul></div>
    <div class="panel next"><h6>🚧 Baaki hai (Phase 3 — messaging)</h6><ul>
      {"".join(f'<li><span class="mark">{ic("hourglass", 15)}</span><span>{x}</span></li>' for x in nxt)}
    </ul></div>
  </div>
  <p class="lead" style="margin-top:16px">Isiliye screen par nakli messages nahi bheje gaye — jo feature abhi nahi hai,
  uske liye साफ़ likha hai “coming in the next step”.</p>

  <h2 class="sec">Andar ka code</h2>
  <h3 class="big">Ye screen kin files se banti hai</h3>
  <div class="files">{"".join(f"<div><code>{html.escape(p)}</code> — {d}</div>" for p, d in files)}</div>

  <footer>
    <b>Feedback:</b> jo cheez badalni ho, uska <b>number (1–6)</b> ya naam bata dijiye — main usi hisaab se
    screen update karke nayi picture bhej dunga.<br>
    <b>Note:</b> ye file sirf dekhne ke liye hai; app ka asli code alag hai aur wahi final chalega.
  </footer>
</div></body></html>
"""


def main() -> int:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(build(), encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size:,} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
