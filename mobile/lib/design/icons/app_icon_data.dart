import 'package:flutter/foundation.dart' show immutable;
import 'package:flutter/painting.dart';

/// How a single path inside an icon is painted.
enum AppIconPaint {
  /// `fill` wins (the icon is a silhouette) — tinted with the icon colour.
  fill,

  /// `stroke` only (the icon is line-art) — tinted with the icon colour.
  stroke,
}

/// One drawable sub-path of a custom icon, already normalised from SVG.
///
/// The SVG source is compiled into Dart (see `tool/generate_icons.py`) so the
/// app ships **no icon font and no icon package** — only these path strings.
@immutable
class AppIconPathSpec {
  const AppIconPathSpec({
    required this.d,
    this.paint = AppIconPaint.stroke,
    this.strokeWidth = 1.6,
    this.cap = StrokeCap.round,
    this.join = StrokeJoin.round,
    this.fillRule = PathFillType.nonZero,
  });

  /// SVG path data (`M …`, `L …`, arcs, béziers …).
  final String d;

  final AppIconPaint paint;

  /// Stroke width in the icon's own viewBox units (icons are authored at 24×24).
  final double strokeWidth;

  final StrokeCap cap;
  final StrokeJoin join;
  final PathFillType fillRule;

  Map<String, Object?> toJson() => {
        'd': d,
        'paint': paint.name,
        'strokeWidth': strokeWidth,
        'cap': cap.name,
        'join': join.name,
        'fillRule': fillRule.name,
      };
}

/// A complete custom icon: its viewBox size plus one or more path specs.
///
/// Instances are `const` and live in the generated registry
/// (`lib/design/icons/app_icons.g.dart`), so icons cost nothing at runtime
/// beyond the path parse (which is memoised).
@immutable
class AppIconData {
  const AppIconData({
    required this.name,
    this.viewBox = 24,
    required this.paths,
    this.duotone = false,
  });

  /// Icon id — matches the source SVG file name (snake_case).
  final String name;

  /// Authoring canvas (square). Icons are drawn at 24 by default.
  final double viewBox;

  final List<AppIconPathSpec> paths;

  /// True when the icon mixes fill and stroke layers on purpose (two-tone look);
  /// the painter then keeps each layer's own paint mode.
  final bool duotone;

  bool get hasStrokes => paths.any((p) => p.paint == AppIconPaint.stroke);
  bool get hasFills => paths.any((p) => p.paint == AppIconPaint.fill);

  @override
  String toString() => 'AppIconData($name, ${paths.length} paths, viewBox $viewBox)';
}
