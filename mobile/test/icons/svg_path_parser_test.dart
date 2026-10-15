import 'dart:ui';

import 'package:andos_referral/design/icons/svg_path_parser.dart';
import 'package:flutter/material.dart' show Matrix4;
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('parseSvgPathData', () {
    test('parses absolute and relative line commands', () {
      final path = parseSvgPathData('M4 4 L20 4 l0 8 H4 V4 Z');
      final bounds = path.getBounds();
      expect(bounds.left, 4);
      expect(bounds.top, 4);
      expect(bounds.right, 20);
      expect(bounds.bottom, 12);
    });

    test('handles compact number syntax: negative, decimal and exponent', () {
      // "-.5.5" is two numbers: -0.5 and 0.5 — a classic icon-export quirk.
      final path = parseSvgPathData('M0 0l-.5.5 1e1 0');
      final bounds = path.getBounds();
      expect(bounds.left, closeTo(-0.5, 1e-9));
      expect(bounds.right, closeTo(9.5, 1e-9));
      expect(bounds.bottom, closeTo(0.5, 1e-9));
    });

    test('handles implicit line-tos after a move-to', () {
      final path = parseSvgPathData('M0 0 10 0 10 10');
      expect(path.getBounds(), const Rect.fromLTRB(0, 0, 10, 10));
    });

    test('parses cubic/quadratic curves and smooth continuations', () {
      final cubic = parseSvgPathData('M2 12 C6 6 18 6 22 12');
      expect(cubic.getBounds().width, greaterThan(19));
      final smooth = parseSvgPathData('M2 12 C6 6 18 6 22 12 S18 18 2 12');
      expect(smooth.getBounds().height, greaterThan(2));
      final quad = parseSvgPathData('M2 12 Q12 2 22 12');
      expect(quad.getBounds().height, greaterThan(4));
    });

    test('parses arcs (rx ry rotation large-arc sweep x y)', () {
      final path = parseSvgPathData('M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16Z');
      final bounds = path.getBounds();
      expect(bounds.width, closeTo(16, 0.35));
      expect(bounds.height, closeTo(16, 0.35));
    });

    test('parses arc flags in the packed form', () {
      final packed = parseSvgPathData('M4 12A8 8 0 0112 4');
      final spaced = parseSvgPathData('M4 12 A 8 8 0 0 1 12 4');
      expect(packed.getBounds().right, closeTo(spaced.getBounds().right, 1e-6));
      expect(packed.getBounds().top, closeTo(spaced.getBounds().top, 1e-6));
    });

    test('treats radii of zero as a straight line', () {
      final path = parseSvgPathData('M2 2A0 0 0 0 1 10 10');
      expect(path.getBounds(), const Rect.fromLTRB(2, 2, 10, 10));
    });

    test('produces a closed contour for Z (fillable silhouette)', () {
      final path = parseSvgPathData('M6 6h12v12z');
      final metrics = path.computeMetrics().toList();
      expect(metrics.length, 1);
      expect(metrics.first.isClosed, isTrue);
      // Triangle (6,6)-(18,6)-(18,18): inside is above the diagonal y=x.
      expect(path.contains(const Offset(16, 10)), isTrue);
      expect(path.contains(const Offset(8, 14)), isFalse);
      expect(path.contains(const Offset(2, 2)), isFalse);
    });

    test('scales and translates via Path.transform without breaking bounds', () {
      final path = parseSvgPathData('M0 0h24v24h-24z');
      final scaled = path.transform(Matrix4.identity().scaledByDouble(2.0, 2.0, 2.0, 1.0).storage);
      expect(scaled.getBounds(), const Rect.fromLTRB(0, 0, 48, 48));
    });

    test('never throws on malformed input', () {
      expect(() => parseSvgPathData(''), returnsNormally);
      expect(() => parseSvgPathData('M'), returnsNormally);
      expect(() => parseSvgPathData('hello world'), returnsNormally);
      expect(() => parseSvgPathData('M10 10 L'), returnsNormally);
    });
  });
}
