// COMPILED ICON REGISTRY — do not edit by hand.
//
// Source of truth:  assets/icons_src/*.svg   (owner-authored, hand-tuned SVGs)
// Regenerate with:  python3 tool/generate_icons.py
//
// This file is intentionally NOT named `*.g.dart`: build_runner treats those as
// its own outputs and prunes them. Icons are compiled here into plain Dart so the
// app ships no icon font and no third-party icon package — every glyph is painted
// by `AppIcon` from the path data below.

import 'app_icon_data.dart';

/// Compiled icons, keyed by icon id (== source file name, snake_case).
const Map<String, AppIconData> kGeneratedIcons = <String, AppIconData>{
};

/// Manifest the generator reports against.
const String kIconManifestName = 'tool/icon_manifest.txt';
