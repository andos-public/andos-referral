import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../tokens/app_colors.dart';
import 'app_icon_data.dart';
import 'app_icons.dart';
import 'svg_path_parser.dart';

/// Renders one of our own SVGs.
///
/// * `size` is the square box; paths are scaled from the icon's viewBox.
/// * `color` defaults to the surrounding [IconTheme] colour, so `AppIcon` drops
///   into any Material context (buttons, tiles, nav items).
/// * Uncompiled ids render a clearly-marked placeholder in debug and an empty
///   box in release — the app never silently falls back to a stock icon font.
class AppIcon extends StatelessWidget {
  const AppIcon(
    this.name, {
    super.key,
    this.size = 24,
    this.color,
    this.strokeWidth,
    this.semanticLabel,
  });

  /// Icon id (see [AppIcons]).
  final String name;

  final double size;
  final Color? color;

  /// Overrides every stroke layer's authored width (optical tuning at small/large sizes).
  final double? strokeWidth;

  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final data = AppIcons.dataFor(name);
    final resolved = color ?? IconTheme.of(context).color ?? context.colors.textSecondary;

    if (data == null) {
      return _MissingIcon(name: name, size: size, color: resolved, semanticLabel: semanticLabel);
    }

    final icon = SizedBox.square(
      dimension: size,
      child: RepaintBoundary(
        child: CustomPaint(
          painter: _AppIconPainter(
            data: data,
            color: resolved,
            strokeWidthOverride: strokeWidth,
          ),
        ),
      ),
    );

    if (semanticLabel == null) return ExcludeSemantics(child: icon);
    return Semantics(label: semanticLabel, image: true, child: icon);
  }
}

/// Same icon with a fixed stroke colour — handy for decorative art inside cards.
class AppIconBadge extends StatelessWidget {
  const AppIconBadge(
    this.name, {
    super.key,
    this.size = 20,
    this.containerSize,
    this.background,
    this.foreground,
    this.semanticLabel,
  });

  final String name;
  final double size;
  final double? containerSize;
  final Color? background;
  final Color? foreground;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final box = containerSize ?? size * 1.85;
    return Container(
      width: box,
      height: box,
      decoration: BoxDecoration(
        color: background ?? colors.brandSoft,
        shape: BoxShape.circle,
        border: Border.all(color: colors.glassBorder),
      ),
      alignment: Alignment.center,
      child: AppIcon(name, size: size, color: foreground ?? colors.brand, semanticLabel: semanticLabel),
    );
  }
}

class _AppIconPainter extends CustomPainter {
  _AppIconPainter({required this.data, required this.color, this.strokeWidthOverride});

  final AppIconData data;
  final Color color;
  final double? strokeWidthOverride;

  static final Map<String, Path> _pathCache = <String, Path>{};

  Path _pathFor(AppIconPathSpec spec) =>
      _pathCache.putIfAbsent('${data.name}|${spec.d}|${spec.fillRule.name}', () {
        final path = parseSvgPathData(spec.d);
        if (spec.fillRule == PathFillType.evenOdd) {
          path.fillType = PathFillType.evenOdd;
        }
        return path;
      });

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / data.viewBox;
    canvas.save();
    canvas.scale(scale);

    for (final spec in data.paths) {
      final path = _pathFor(spec);
      switch (spec.paint) {
        case AppIconPaint.fill:
          canvas.drawPath(path, Paint()..color = color..isAntiAlias = true..style = PaintingStyle.fill);
        case AppIconPaint.stroke:
          canvas.drawPath(
            path,
            Paint()
              ..color = color
              ..isAntiAlias = true
              ..style = PaintingStyle.stroke
              ..strokeWidth = strokeWidthOverride ?? spec.strokeWidth
              ..strokeCap = spec.cap
              ..strokeJoin = spec.join,
          );
      }
    }

    canvas.restore();
  }

  @override
  bool shouldRepaint(_AppIconPainter old) =>
      old.data != data || old.color != color || old.strokeWidthOverride != strokeWidthOverride;
}

/// Debug placeholder: a dashed ring with the icon id, so an incomplete icon set
/// is impossible to miss during development.
class _MissingIcon extends StatelessWidget {
  const _MissingIcon({required this.name, required this.size, required this.color, this.semanticLabel});

  final String name;
  final double size;
  final Color color;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    if (kReleaseMode) {
      return SizedBox.square(dimension: size, child: Semantics(label: semanticLabel, child: const SizedBox()));
    }
    return Tooltip(
      message: 'Missing custom SVG: $name\nAdd assets/icons_src/$name.svg and run tool/generate_icons.py',
      child: SizedBox.square(
        dimension: size,
        child: CustomPaint(painter: _PlaceholderPainter(color.withValues(alpha: 0.7))),
      ),
    );
  }
}

class _PlaceholderPainter extends CustomPainter {
  _PlaceholderPainter(this.color);

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4;
    final rect = Offset.zero & size;
    final rrect = RRect.fromRectAndRadius(rect.deflate(0.7), const Radius.circular(6));
    // Dashed ring: draw short arcs around the perimeter.
    final path = Path()..addRRect(rrect);
    for (final metric in path.computeMetrics()) {
      var distance = 0.0;
      while (distance < metric.length) {
        final next = (distance + 3).clamp(0.0, metric.length);
        canvas.drawPath(metric.extractPath(distance, next), paint);
        distance = next + 3;
      }
    }
  }

  @override
  bool shouldRepaint(_PlaceholderPainter old) => old.color != color;
}
