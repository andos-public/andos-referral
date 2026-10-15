#!/usr/bin/env python3
"""Compile owner-authored SVGs into the Flutter icon registry.

Usage
-----
    python3 tool/generate_icons.py            # compile what exists, report the rest
    python3 tool/generate_icons.py --check    # report only (used by tests/CI)

Input   assets/icons_src/<icon_id>.svg      (one icon per file, 24x24 viewBox)
Output  lib/design/icons/app_icons_registry.dart

What it accepts
---------------
* `<path d="…">` with any of the usual paint attributes
  (fill / stroke / stroke-width / stroke-linecap / stroke-linejoin / fill-rule).
* Explicit `fill="none"` (stroke-only), `fill="currentColor"` or any colour
  value (treated as "use the app's tint"), and icons mixing both layers.
* `<circle>`, `<rect rx>`, `<ellipse>`, `<line>`, `<polyline>`, `<polygon>` and
  `<g>` wrappers with inherited paint attributes.
* Comments, `<?xml?>`, `<title>`, `<desc>`, `xmlns` and sketch metadata.

What it rejects (loudly, with a file+reason, exit code 1)
---------------------------------------------------------
* viewBox other than "0 0 24 24" (icons must be authored on the shared grid),
* `<style>` blocks, CSS classes, `<use>`, external references, <image>, text,
* transform attributes other than `translate(tx ty)`.

Nothing is fetched, nothing is written outside the output file.
"""
from __future__ import annotations

import argparse
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "assets" / "icons_src"
OUT_FILE = ROOT / "lib" / "design" / "icons" / "app_icons_registry.dart"
MANIFEST = ROOT / "tool" / "icon_manifest.txt"

NS = "{http://www.w3.org/2000/svg}"

NUMBER = r"[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?"


def norm(value: str | None, fallback: float) -> float:
    if value is None:
        return fallback
    m = re.search(NUMBER, value)
    return float(m.group(0)) if m else fallback


def is_tint(colour: str | None) -> bool:
    """A colour means 'paint with the app tint' unless it is explicitly none."""
    if colour is None:
        return False
    return colour.strip().lower() not in {"none", "transparent", ""}


def esc(text: str) -> str:
    return text.replace("\\", "\\\\").replace("'", "\\'").replace("$", "\\$")


class IconPath:
    def __init__(self, d: str, paint: str, stroke_width: float, cap: str, join: str, fill_rule: str):
        self.d = d
        self.paint = paint
        self.stroke_width = stroke_width
        self.cap = cap
        self.join = join
        self.fill_rule = fill_rule


CAPS = {"butt": "butt", "round": "round", "square": "square"}
JOINS = {"miter": "miter", "round": "round", "bevel": "bevel"}


def inherited_paint(el: ET.Element, chain: list[dict[str, str]]) -> dict[str, str]:
    """Merge paint attributes from outer <g> down to the element."""
    merged: dict[str, str] = {}
    for attrs in chain:
        merged.update(attrs)
    for key in ("fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "fill-rule"):
        if key in el.attrib:
            merged[key] = el.attrib[key]
    # kebab-case is what SVG uses; ElementTree keeps it verbatim.
    return merged


def element_to_paths(el: ET.Element, attrs: dict[str, str], out: list[IconPath]) -> None:
    tag = el.tag.replace(NS, "")
    if tag in {"title", "desc", "metadata"}:
        return

    # Cascade: inherited attributes from ancestors, then this element's own.
    attrs = inherited_paint(el, [attrs])

    fill = attrs.get("fill")
    stroke = attrs.get("stroke")
    fill_on = is_tint(fill) or (fill is None and stroke is None)  # SVG default fill = black
    stroke_on = is_tint(stroke)
    stroke_width = norm(attrs.get("stroke-width"), 1.6)
    cap = CAPS.get((attrs.get("stroke-linecap") or "round").lower(), "round")
    join = JOINS.get((attrs.get("stroke-linejoin") or "round").lower(), "round")
    fill_rule = "evenOdd" if (attrs.get("fill-rule") or "").lower() == "evenodd" else "nonZero"

    def add(d: str, force_paint: str | None = None) -> None:
        paint = force_paint or ("fill" if fill_on and not stroke_on else "stroke")
        if fill_on and stroke_on:
            # Two-layer glyph: emit a fill layer first, then a stroke layer.
            out.append(IconPath(d, "fill", stroke_width, cap, join, fill_rule))
            out.append(IconPath(d, "stroke", stroke_width, cap, join, fill_rule))
            return
        out.append(IconPath(d, paint, stroke_width, cap, join, fill_rule))

    if tag == "path":
        d = el.attrib.get("d")
        if d:
            add(d.strip())
    elif tag in {"line", "polyline", "polygon", "rect", "circle", "ellipse"}:
        add(_shape_to_path(tag, el))
    elif tag in {"g", "svg"}:
        for child in el:
            element_to_paths(child, attrs, out)
    else:
        raise ValueError(f"unsupported element <{tag}>")


def _shape_to_path(tag: str, el: ET.Element) -> str:
    if tag == "line":
        return f"M{norm(el.attrib.get('x1'), 0)} {norm(el.attrib.get('y1'), 0)}L{norm(el.attrib.get('x2'), 0)} {norm(el.attrib.get('y2'), 0)}"
    if tag == "polyline":
        pts = [p for p in re.split(r"[,\s]+", el.attrib.get("points", "").strip()) if p]
        pairs = list(zip(pts[0::2], pts[1::2]))
        return "M" + "L".join(f"{p[0]} {p[1]}" for p in pairs)
    if tag == "polygon":
        pts = [p for p in re.split(r"[,\s]+", el.attrib.get("points", "").strip()) if p]
        pairs = list(zip(pts[0::2], pts[1::2]))
        return "M" + "L".join(f"{p[0]} {p[1]}" for p in pairs) + "Z"
    if tag == "rect":
        x, y = norm(el.attrib.get("x"), 0), norm(el.attrib.get("y"), 0)
        w, h = norm(el.attrib.get("width"), 0), norm(el.attrib.get("height"), 0)
        rx = norm(el.attrib.get("rx"), 0) or norm(el.attrib.get("ry"), 0)
        if rx <= 0:
            return f"M{x} {y}H{x + w}V{y + h}H{x}Z"
        return (
            f"M{x + rx} {y}H{x + w - rx}A{rx} {rx} 0 0 1 {x + w} {y + rx}"
            f"V{y + h - rx}A{rx} {rx} 0 0 1 {x + w - rx} {y + h}H{x + rx}"
            f"A{rx} {rx} 0 0 1 {x} {y + h - rx}V{y + rx}A{rx} {rx} 0 0 1 {x + rx} {y}Z"
        )
    if tag == "circle":
        cx, cy, r = norm(el.attrib.get("cx"), 0), norm(el.attrib.get("cy"), 0), norm(el.attrib.get("r"), 0)
        return (
            f"M{cx - r} {cy}A{r} {r} 0 1 0 {cx + r} {cy}"
            f"A{r} {r} 0 1 0 {cx - r} {cy}Z"
        )
    if tag == "ellipse":
        rx, ry = norm(el.attrib.get("rx"), 0), norm(el.attrib.get("ry"), 0)
        cx, cy = norm(el.attrib.get("cx"), 0), norm(el.attrib.get("cy"), 0)
        return (
            f"M{cx - rx} {cy}A{rx} {ry} 0 1 0 {cx + rx} {cy}"
            f"A{rx} {ry} 0 1 0 {cx - rx} {cy}Z"
        )
    raise ValueError(f"unsupported shape <{tag}>")


def parse_icon(path: Path) -> tuple[str, list[IconPath]]:
    icon_id = path.stem
    tree = ET.parse(path)
    root = tree.getroot()
    if root.tag.replace(NS, "") != "svg":
        raise ValueError("root element is not <svg>")

    view_box = (root.attrib.get("viewBox") or "").strip()
    if view_box.replace(",", " ").split() != ["0", "0", "24", "24"]:
        raise ValueError(f"viewBox must be '0 0 24 24' (found '{view_box}')")

    for el in root.iter():
        tag = el.tag.replace(NS, "")
        if tag in {"title", "desc", "metadata"}:
            continue  # documentation, carries no geometry
        if tag in {"style", "use", "image", "text", "tspan", "filter", "mask", "clipPath"}:
            raise ValueError(f"unsupported element <{tag}> — keep icons to plain paths/shapes")
        transform = el.attrib.get("transform")
        if transform and not re.fullmatch(r"translate\(\s*" + NUMBER + r"(?:\s*[,\s]\s*" + NUMBER + r")?\s*\)", transform.strip()):
            raise ValueError(f"unsupported transform '{transform}' (only translate is allowed)")

    # Paint attributes on the root <svg> (typically fill="none" + stroke rules)
    # must inherit into the tree, exactly like a browser would cascade them.
    root_attrs = {
        key: root.attrib[key]
        for key in ("fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "fill-rule")
        if key in root.attrib
    }
    paths: list[IconPath] = []
    element_to_paths(root, root_attrs, paths)
    if not paths:
        raise ValueError("no drawable paths found")
    return icon_id, paths


def render(icons: dict[str, list[IconPath]]) -> str:
    lines: list[str] = [
        "// COMPILED ICON REGISTRY — do not edit by hand.",
        "//",
        "// Source of truth:  assets/icons_src/*.svg   (owner-authored, hand-tuned SVGs)",
        "// Regenerate with:  python3 tool/generate_icons.py",
        "//",
        "// This file is intentionally NOT named `*.g.dart`: build_runner treats those as",
        "// its own outputs and prunes them. Icons are compiled here into plain Dart so the",
        "// app ships no icon font and no third-party icon package — every glyph is painted",
        "// by `AppIcon` from the path data below.",
        "",
        "import 'app_icon_data.dart';",
        "",
        "/// Compiled icons, keyed by icon id (== source file name, snake_case).",
        "const Map<String, AppIconData> kGeneratedIcons = <String, AppIconData>{",
    ]
    for icon_id in sorted(icons):
        paths = icons[icon_id]
        two_tone = len({p.paint for p in paths}) > 1
        lines.append(f"  '{icon_id}': AppIconData(")
        lines.append(f"    name: '{icon_id}',")
        if two_tone:
            lines.append("    duotone: true,")
        lines.append("    paths: [")
        for p in paths:
            lines.append("      AppIconPathSpec(")
            lines.append(f"        d: '{esc(p.d)}',")
            lines.append(f"        paint: AppIconPaint.{p.paint},")
            if p.paint == "stroke":
                lines.append(f"        strokeWidth: {p.stroke_width:g},")
                if p.cap != "round":
                    lines.append(f"        cap: StrokeCap.{p.cap},")
                if p.join != "round":
                    lines.append(f"        join: StrokeJoin.{p.join},")
            if p.fill_rule != "nonZero":
                lines.append(f"        fillRule: PathFillType.{p.fill_rule},")
            lines.append("      ),")
        lines.append("    ],")
        lines.append("  ),")
    lines.append("};")
    lines.append("")
    lines.append("/// Manifest the generator reports against.")
    lines.append("const String kIconManifestName = 'tool/icon_manifest.txt';")
    lines.append("")
    return "\n".join(lines)


def manifest_ids() -> list[str]:
    ids: list[str] = []
    if MANIFEST.exists():
        for raw in MANIFEST.read_text().splitlines():
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            ids.append(line.split("|")[0].strip())
    return ids


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="report only; do not write the registry")
    args = ap.parse_args()

    SRC_DIR.mkdir(parents=True, exist_ok=True)
    icons: dict[str, list[IconPath]] = {}
    errors: list[str] = []

    for svg in sorted(SRC_DIR.glob("*.svg")):
        try:
            icon_id, paths = parse_icon(svg)
            icons[icon_id] = paths
        except Exception as exc:  # noqa: BLE001 - report every file, don't stop at the first
            errors.append(f"{svg.name}: {exc}")

    wanted = manifest_ids()
    missing = [i for i in wanted if i not in icons]
    extra = [i for i in icons if wanted and i not in wanted]

    print(f"icons compiled : {len(icons)}")
    print(f"manifest wants : {len(wanted)}")
    if missing:
        print(f"still missing  : {len(missing)} -> {', '.join(missing[:12])}{' …' if len(missing) > 12 else ''}")
    if extra:
        print(f"not in manifest: {', '.join(extra)}")
    for err in errors:
        print(f"ERROR {err}", file=sys.stderr)

    if errors:
        return 1
    if not args.check:
        OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
        OUT_FILE.write_text(render(icons))
        print(f"wrote          : {OUT_FILE.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
