#!/usr/bin/env python3
"""Builds the icon review sheet (single self-contained HTML file).

    python3 tool/build_icon_sheet.py            # -> tool/icon_sheet.html

What the sheet gives the owner
  * every declared icon, grouped by feature, drawn at 48 / 32 / 24 / 20 / 16 px
  * dark and light previews side by side (real token colours)
  * the icon in context: bottom nav, invite-hub quick actions, wallet ledger row
  * the raw SVG source of each icon, ready to copy
  * a Keep / Upgrade / Drop decision per icon, summarised into copyable JSON

Everything is inlined (no network, no fonts, no external assets), so the file
opens anywhere — phone, laptop, offline.
"""
from __future__ import annotations

import html
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "tool" / "icon_manifest.txt"
ICONS_DART = ROOT / "lib" / "design" / "icons" / "app_icons.dart"
SRC = ROOT / "assets" / "icons_src"
OUT = ROOT / "tool" / "icon_sheet.html"

# Token colours, mirrored from lib/design/tokens/app_colors.dart.
DARK = {"bg": "#0B1020", "surface": "#141C30", "border": "#2A3654", "text": "#F8FAFC",
        "muted": "#A9B6CE", "brand": "#F59E0B", "accent": "#8B5CF6"}
LIGHT = {"bg": "#F6F7FB", "surface": "#FFFFFF", "border": "#E2E6EF", "text": "#0F172A",
         "muted": "#4A5568", "brand": "#92400E", "accent": "#6D28D9"}

GROUPS = ["nav", "chrome", "invite hub", "referrals", "chat", "wallet", "status", "settings"]
TITLES = {"nav": "Navigation", "chrome": "Chrome", "invite hub": "Invite Hub",
          "referrals": "Referrals", "chat": "Chat", "wallet": "Wallet",
          "status": "Status", "settings": "Settings"}


def parse_dart_groups() -> list[tuple[str, str]]:
    """[(group, icon_id)] in declaration order, straight from app_icons.dart."""
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


def parse_manifest() -> dict[str, str]:
    """icon_id -> used_in text."""
    rows: dict[str, str] = {}
    for raw in MANIFEST.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        parts = [p.strip() for p in line.split("|")]
        rows[parts[0]] = parts[1] if len(parts) > 1 else ""
    return rows


def svg_body(icon_id: str) -> str:
    text = (SRC / f"{icon_id}.svg").read_text(encoding="utf-8")
    return text[text.index(">") + 1: text.rindex("</svg>")].strip()


def card(group: str, icon_id: str, used_in: str, body: str) -> str:
    sizes = "".join(
        f'<span class="sz"><svg viewBox="0 0 24 24" width="{s}" height="{s}">{body}</svg>'
        f'<em>{s}</em></span>'
        for s in (48, 32, 24, 20, 16)
    )
    code = html.escape(f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" '
                       f'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">\n'
                       f'  {body}\n</svg>')
    return f'''<article class="card" data-id="{icon_id}" data-search="{icon_id} {used_in.lower()} {group}">
  <header>
    <div class="hero"><svg viewBox="0 0 24 24" width="52" height="52">{body}</svg></div>
    <div class="meta">
      <code>{icon_id}</code>
      <p>{html.escape(used_in)}</p>
    </div>
  </header>
  <div class="sizes">{sizes}</div>
  <div class="decide" role="group" aria-label="decision for {icon_id}">
    <button data-v="keep" class="on">Keep</button>
    <button data-v="upgrade">Upgrade</button>
    <button data-v="drop">Drop</button>
  </div>
  <details><summary>SVG code</summary><pre>{code}</pre></details>
</article>'''


def strip(icons: list[str], labels: list[str]) -> str:
    """A row of icons with labels — used for the in-app context previews."""
    cells = []
    for icon_id, label in zip(icons, labels):
        body = svg_body(icon_id)
        cells.append(
            f'<div class="navcell"><svg viewBox="0 0 24 24" width="24" height="24">{body}</svg>'
            f'<span>{label}</span></div>'
        )
    return f'<div class="strip">{"".join(cells)}</div>'


def ledger_row(icon_id: str, title: str, amount: str, tone: str) -> str:
    body = svg_body(icon_id)
    return (f'<div class="row {tone}"><svg viewBox="0 0 24 24" width="22" height="22">{body}</svg>'
            f'<div class="rowtext"><strong>{title}</strong><span>{amount}</span></div></div>')


def build() -> str:
    groups = parse_dart_groups()
    used_in = parse_manifest()
    missing = sorted({g for g, i in groups if not (SRC / f"{i}.svg").exists()})

    sections = []
    for group in GROUPS + sorted({g for g, _ in groups} - set(GROUPS)):
        items = [(i, used_in.get(i, "")) for g, i in groups if g == group]
        if not items:
            continue
        cards = "".join(card(group, i, u, svg_body(i)) for i, u in items)
        sections.append(f'''<section class="group" id="g-{group.replace(' ', '-')}">
  <h2>{TITLES.get(group, group.title())} <span>{len(items)}</span></h2>
  <div class="grid">{cards}</div>
</section>''')

    nav = strip(["nav_invite", "nav_referrals", "nav_chat", "nav_wallet", "nav_settings"],
                ["Invite", "Referrals", "Chat", "Wallet", "Settings"])
    quick = strip(["link", "qr_code", "share", "copy"], ["My link", "QR code", "Share", "Copy"])
    stats = strip(["cursor_tap", "user_check", "chart_bars", "calendar_clock"],
                  ["Clicks", "Signups", "Conversion", "Release"])
    ledger = (
        ledger_row("arrow_down_left", "Commission credited", "+ ₹50.00", "in")
        + ledger_row("hourglass", "On hold (7 days)", "₹120.00", "hold")
        + ledger_row("arrow_up_right", "Withdrawal", "− ₹75.00", "out")
        + ledger_row("badge_check", "Payout completed · UTR 4421…", "₹75.00", "ok")
    )
    legend = " · ".join(["24 × 24 grid", "1.6 px stroke", "round caps", "currentColor",
                         f"{len(groups)} icons", f"{len(used_in)} manifest rows"])

    payload = json.dumps({"keep": [], "upgrade": [], "drop": []})

    return f'''<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ANDOS Referral — icon set v1 ({date.today().isoformat()})</title>
<style>
  :root {{
    --bg:{DARK['bg']}; --surface:{DARK['surface']}; --border:{DARK['border']};
    --text:{DARK['text']}; --muted:{DARK['muted']}; --brand:{DARK['brand']}; --accent:{DARK['accent']};
    --ok:#10B981; --warn:{DARK['brand']}; --bad:#EF4444;
  }}
  body.light {{
    --bg:{LIGHT['bg']}; --surface:{LIGHT['surface']}; --border:{LIGHT['border']};
    --text:{LIGHT['text']}; --muted:{LIGHT['muted']}; --brand:{LIGHT['brand']}; --accent:{LIGHT['accent']};
  }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; background:var(--bg); color:var(--text); font:15px/1.5 -apple-system,
    "Segoe UI", Roboto, "Plus Jakarta Sans", system-ui, sans-serif; padding-bottom:96px; }}
  a {{ color:var(--brand); }}
  .wrap {{ max-width:1180px; margin:0 auto; padding:20px 16px 40px; }}
  h1 {{ font-size:24px; margin:0 0 6px; letter-spacing:-.02em; }}
  h1 span {{ color:var(--brand); }}
  .lede {{ color:var(--muted); margin:0 0 14px; max-width:70ch; }}
  .legend {{ color:var(--muted); font-size:13px; border:1px solid var(--border);
    border-radius:999px; padding:6px 12px; display:inline-block; margin-bottom:18px; }}
  .bar {{ position:sticky; top:0; z-index:5; background:color-mix(in srgb, var(--bg) 88%, transparent);
    backdrop-filter:blur(12px); border-bottom:1px solid var(--border);
    display:flex; gap:10px; align-items:center; flex-wrap:wrap; padding:10px 16px; margin:0 -16px 18px; }}
  .bar input {{ flex:1 1 190px; min-width:150px; background:var(--surface); color:var(--text);
    border:1px solid var(--border); border-radius:12px; padding:9px 12px; font:inherit; }}
  .bar button {{ background:var(--surface); color:var(--text); border:1px solid var(--border);
    border-radius:12px; padding:9px 13px; font:inherit; font-weight:600; cursor:pointer; }}
  .bar button:hover {{ border-color:var(--brand); color:var(--brand); }}
  .panel {{ background:var(--surface); border:1px solid var(--border); border-radius:18px;
    padding:16px; margin-bottom:22px; }}
  .panel h3 {{ margin:0 0 10px; font-size:14px; text-transform:uppercase; letter-spacing:.08em;
    color:var(--muted); }}
  .strip {{ display:flex; gap:8px; flex-wrap:wrap; }}
  .navcell {{ flex:1 1 62px; min-width:62px; display:flex; flex-direction:column; align-items:center;
    gap:6px; padding:10px 6px; border-radius:14px; color:var(--muted); }}
  .navcell:first-child {{ color:var(--brand); background:color-mix(in srgb, var(--brand) 14%, transparent); }}
  .navcell span {{ font-size:11px; }}
  .rows {{ display:grid; gap:8px; }}
  .row {{ display:flex; align-items:center; gap:12px; padding:10px 12px; border:1px solid var(--border);
    border-radius:14px; }}
  .rowtext {{ display:flex; justify-content:space-between; flex:1; gap:8px; }}
  .rowtext span {{ font-variant-numeric:tabular-nums; color:var(--muted); }}
  .row.in > svg {{ color:var(--ok); }} .row.out > svg {{ color:var(--bad); }}
  .row.hold > svg {{ color:var(--warn); }} .row.ok > svg {{ color:var(--accent); }}
  .group {{ margin:26px 0 0; }}
  .group h2 {{ font-size:16px; letter-spacing:.02em; display:flex; align-items:center; gap:10px;
    margin:0 0 12px; }}
  .group h2 span {{ color:var(--muted); font-weight:500; font-size:13px;
    border:1px solid var(--border); border-radius:999px; padding:1px 9px; }}
  .grid {{ display:grid; gap:14px; grid-template-columns:repeat(auto-fill, minmax(258px, 1fr)); }}
  .card {{ background:var(--surface); border:1px solid var(--border); border-radius:18px; padding:14px; }}
  .card header {{ display:flex; gap:12px; align-items:center; }}
  .hero {{ width:66px; height:66px; border-radius:16px; display:grid; place-items:center;
    background:color-mix(in srgb, var(--brand) 10%, transparent); color:var(--text); flex:0 0 auto; }}
  .meta code {{ font:12.5px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace; color:var(--brand); }}
  .meta p {{ margin:3px 0 0; color:var(--muted); font-size:12.5px; }}
  .sizes {{ display:flex; align-items:flex-end; gap:14px; margin:14px 0 4px; color:var(--text); }}
  .sz {{ display:flex; flex-direction:column; align-items:center; gap:4px; }}
  .sz em {{ font-style:normal; font-size:10px; color:var(--muted); }}
  .decide {{ display:flex; gap:6px; margin:12px 0 4px; }}
  .decide button {{ flex:1; padding:7px 0; border-radius:11px; border:1px solid var(--border);
    background:transparent; color:var(--muted); font:inherit; font-size:12.5px; font-weight:600;
    cursor:pointer; }}
  .decide button.on[data-v="keep"] {{ border-color:var(--ok); color:var(--ok);
    background:color-mix(in srgb, var(--ok) 12%, transparent); }}
  .decide button.on[data-v="upgrade"] {{ border-color:var(--warn); color:var(--warn);
    background:color-mix(in srgb, var(--warn) 12%, transparent); }}
  .decide button.on[data-v="drop"] {{ border-color:var(--bad); color:var(--bad);
    background:color-mix(in srgb, var(--bad) 12%, transparent); }}
  details {{ margin-top:10px; }}
  summary {{ cursor:pointer; color:var(--muted); font-size:12.5px; }}
  pre {{ background:color-mix(in srgb, var(--text) 6%, transparent); border:1px solid var(--border);
    border-radius:12px; padding:10px; overflow:auto; font-size:11.5px; }}
  .tray {{ position:fixed; left:0; right:0; bottom:0; z-index:9; background:var(--surface);
    border-top:1px solid var(--border); padding:12px 16px; display:flex; gap:10px;
    align-items:center; flex-wrap:wrap; }}
  .tray b {{ color:var(--brand); }}
  .tray textarea {{ flex:1 1 260px; height:52px; background:var(--bg); color:var(--text);
    border:1px solid var(--border); border-radius:12px; padding:8px 10px; font:11.5px/1.4 ui-monospace,
    SFMono-Regular, Menlo, monospace; }}
  .hidden {{ display:none !important; }}
</style></head>
<body>
<div class="wrap">
  <h1>ANDOS Referral — <span>icon set v1</span></h1>
  <p class="lede">Ye wo icons hain jo Phase-2 app me use honge. Har card me: bade size, chhote sizes
    (16 px tak), app ke andar ka context, aur neeche raw SVG code. Aap har icon pe
    <strong>Keep</strong> / <strong>Upgrade</strong> / <strong>Drop</strong> choose kar sakte ho — neeche
    summary ban jayegi jo aap mujhe bhej sakte ho. Kisi icon ka behtar version dena ho to wahi
    naam rakhein (<code>assets/icons_src/&lt;id&gt;.svg</code>), baaki sab main handle kar lunga.</p>
  <div class="legend">{legend}</div>

  <div class="bar">
    <input id="q" type="search" placeholder="Search icon / screen…" aria-label="Search icons">
    <button id="theme">Switch to light</button>
    <button id="togglecode">Show SVG code</button>
  </div>

  <div class="panel">
    <h3>Bottom navigation — in app</h3>
    {nav}
  </div>
  <div class="panel">
    <h3>Invite Hub quick actions</h3>
    {quick}
    <h3 style="margin-top:14px">Stats strip</h3>
    {stats}
  </div>
  <div class="panel">
    <h3>Wallet ledger rows</h3>
    <div class="rows">{ledger}</div>
  </div>

  {''.join(sections)}

  <p class="lede" style="margin-top:26px">Naam kya bhejein: ek hi line me
    <code>{{"keep":[…],"upgrade":[…],"drop":[…]}}</code> — ya sirf likh dein “upgrade: ye ye icons”.</p>
</div>

<div class="tray">
  <div>Decisions: <b id="n-keep">0</b> keep · <b id="n-upgrade">0</b> upgrade · <b id="n-drop">0</b> drop
    of {len(groups)}</div>
  <textarea id="out" readonly aria-label="decision summary"></textarea>
  <button id="copy">Copy</button>
  <button id="reset">Reset</button>
</div>

<script>
  var state = {payload};
  var out = document.getElementById('out');
  function render() {{
    out.value = JSON.stringify(state);
    document.getElementById('n-keep').textContent = state.keep.length;
    document.getElementById('n-upgrade').textContent = state.upgrade.length;
    document.getElementById('n-drop').textContent = state.drop.length;
  }}
  function decide(cardEl, value) {{
    var id = cardEl.dataset.id, list, i;
    ['keep','upgrade','drop'].forEach(function (k) {{
      list = state[k]; i = list.indexOf(id);
      if (i > -1) list.splice(i, 1);
    }});
    state[value].push(id);
    cardEl.querySelectorAll('.decide button').forEach(function (b) {{
      b.classList.toggle('on', b.dataset.v === value);
    }});
    render();
  }}
  document.querySelectorAll('.card').forEach(function (cardEl) {{
    cardEl.querySelectorAll('.decide button').forEach(function (b) {{
      b.addEventListener('click', function () {{ decide(cardEl, b.dataset.v); }});
    }});
  }});
  document.getElementById('reset').addEventListener('click', function () {{
    state = {{keep:[],upgrade:[],drop:[]}};
    document.querySelectorAll('.card').forEach(function (c) {{
      c.querySelectorAll('.decide button').forEach(function (b) {{
        b.classList.toggle('on', b.dataset.v === 'keep');
      }});
    }});
    render();
  }});
  document.getElementById('copy').addEventListener('click', function () {{
    out.select(); out.setSelectionRange(0, out.value.length);
    try {{ document.execCommand('copy'); }} catch (e) {{}}
    if (navigator.clipboard) {{ navigator.clipboard.writeText(out.value).catch(function () {{}}); }}
  }});
  var light = false;
  document.getElementById('theme').addEventListener('click', function (e) {{
    light = !light;
    document.body.classList.toggle('light', light);
    e.target.textContent = light ? 'Switch to dark' : 'Switch to light';
  }});
  var codeOn = false;
  document.getElementById('togglecode').addEventListener('click', function (e) {{
    codeOn = !codeOn;
    document.querySelectorAll('details').forEach(function (d) {{ d.open = codeOn; }});
    e.target.textContent = codeOn ? 'Hide SVG code' : 'Show SVG code';
  }});
  document.getElementById('q').addEventListener('input', function (e) {{
    var q = e.target.value.trim().toLowerCase();
    document.querySelectorAll('section.group').forEach(function (sec) {{
      var shown = 0;
      sec.querySelectorAll('.card').forEach(function (c) {{
        var hit = !q || c.dataset.search.indexOf(q) > -1;
        c.classList.toggle('hidden', !hit);
        if (hit) shown++;
      }});
      sec.classList.toggle('hidden', shown === 0);
    }});
  }});
  render();
</script>
</body></html>
'''


def main() -> int:
    sheet = build()
    OUT.write_text(sheet, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)} ({len(sheet):,} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
