import 'dart:math' as math;
import 'dart:ui';

/// A dependency-free SVG `d` attribute parser → [Path].
///
/// Supports the full static-path command set that Figma / Illustrator / IconJar
/// emit for icon work: `M m L l H h V v C c S s Q q T t A a Z z`, implicit
/// line-tos after a move-to, number formats such as `-.5`, `.5.5`, `1e-3`, and
/// both absolute and relative arc flags.
///
/// Used by `AppIcon` so the app can render hand-authored SVGs without pulling in
/// an icon package or an SVG runtime.
Path parseSvgPathData(String data) {
  final path = Path();
  final _Tokenizer t = _Tokenizer(data);

  double lastX = 0, lastY = 0; // current point
  double startX = 0, startY = 0; // subpath start (for Z)
  double ctrlX = 0, ctrlY = 0; // last control point (for S/T reflection)
  String? lastCmd;

  while (true) {
    final cmd = t.nextCommand();
    if (cmd == null) break;
    final relative = cmd.toLowerCase() == cmd;
    final c = cmd.toUpperCase();

    switch (c) {
      case 'M':
        {
          var x = t.number(), y = t.number();
          if (relative) {
            x += lastX;
            y += lastY;
          }
          path.moveTo(x, y);
          lastX = x;
          lastY = y;
          startX = x;
          startY = y;
          // Implicit subsequent pairs are line-tos.
          while (t.hasNumber()) {
            var nx = t.number(), ny = t.number();
            if (relative) {
              nx += lastX;
              ny += lastY;
            }
            path.lineTo(nx, ny);
            lastX = nx;
            lastY = ny;
          }
          ctrlX = lastX;
          ctrlY = lastY;
          break;
        }

      case 'L':
        do {
          var x = t.number(), y = t.number();
          if (relative) {
            x += lastX;
            y += lastY;
          }
          path.lineTo(x, y);
          lastX = x;
          lastY = y;
        } while (t.hasNumber());
        ctrlX = lastX;
        ctrlY = lastY;
        break;

      case 'H':
        do {
          var x = t.number();
          if (relative) x += lastX;
          path.lineTo(x, lastY);
          lastX = x;
        } while (t.hasNumber());
        ctrlX = lastX;
        ctrlY = lastY;
        break;

      case 'V':
        do {
          var y = t.number();
          if (relative) y += lastY;
          path.lineTo(lastX, y);
          lastY = y;
        } while (t.hasNumber());
        ctrlX = lastX;
        ctrlY = lastY;
        break;

      case 'C':
        do {
          var x1 = t.number(), y1 = t.number(), x2 = t.number(), y2 = t.number(), x = t.number(), y = t.number();
          if (relative) {
            x1 += lastX;
            y1 += lastY;
            x2 += lastX;
            y2 += lastY;
            x += lastX;
            y += lastY;
          }
          path.cubicTo(x1, y1, x2, y2, x, y);
          ctrlX = x2;
          ctrlY = y2;
          lastX = x;
          lastY = y;
        } while (t.hasNumber());
        break;

      case 'S':
        do {
          var x2 = t.number(), y2 = t.number(), x = t.number(), y = t.number();
          if (relative) {
            x2 += lastX;
            y2 += lastY;
            x += lastX;
            y += lastY;
          }
          // Reflect the previous control point when the last command was a curve.
          final reflect = (lastCmd != null && 'CS'.contains(lastCmd.toUpperCase()));
          final x1 = reflect ? 2 * lastX - ctrlX : lastX;
          final y1 = reflect ? 2 * lastY - ctrlY : lastY;
          path.cubicTo(x1, y1, x2, y2, x, y);
          ctrlX = x2;
          ctrlY = y2;
          lastX = x;
          lastY = y;
        } while (t.hasNumber());
        break;

      case 'Q':
        do {
          var x1 = t.number(), y1 = t.number(), x = t.number(), y = t.number();
          if (relative) {
            x1 += lastX;
            y1 += lastY;
            x += lastX;
            y += lastY;
          }
          path.quadraticBezierTo(x1, y1, x, y);
          ctrlX = x1;
          ctrlY = y1;
          lastX = x;
          lastY = y;
        } while (t.hasNumber());
        break;

      case 'T':
        do {
          var x = t.number(), y = t.number();
          if (relative) {
            x += lastX;
            y += lastY;
          }
          final reflect = (lastCmd != null && 'QT'.contains(lastCmd.toUpperCase()));
          final x1 = reflect ? 2 * lastX - ctrlX : lastX;
          final y1 = reflect ? 2 * lastY - ctrlY : lastY;
          path.quadraticBezierTo(x1, y1, x, y);
          ctrlX = x1;
          ctrlY = y1;
          lastX = x;
          lastY = y;
        } while (t.hasNumber());
        break;

      case 'A':
        do {
          final rx = t.number();
          final ry = t.number();
          final rotation = t.number();
          final largeArc = t.flag();
          final sweep = t.flag();
          var x = t.number(), y = t.number();
          if (relative) {
            x += lastX;
            y += lastY;
          }
          _arcTo(path, lastX, lastY, rx, ry, rotation, largeArc, sweep, x, y);
          lastX = x;
          lastY = y;
        } while (t.hasNumber());
        ctrlX = lastX;
        ctrlY = lastY;
        break;

      case 'Z':
        path.close();
        lastX = startX;
        lastY = startY;
        ctrlX = lastX;
        ctrlY = lastY;
        break;
    }
    lastCmd = c;
  }

  return path;
}

/// Endpoint-parameterised elliptical arc → cubic béziers (SVG spec F.6.5).
void _arcTo(
  Path path,
  double x0,
  double y0,
  double rx,
  double ry,
  double rotationDeg,
  bool largeArc,
  bool sweep,
  double x,
  double y,
) {
  if (rx == 0 || ry == 0 || (x0 == x && y0 == y)) {
    path.lineTo(x, y);
    return;
  }
  rx = rx.abs();
  ry = ry.abs();
  final phi = rotationDeg * math.pi / 180;
  final cosPhi = math.cos(phi);
  final sinPhi = math.sin(phi);

  final dx2 = (x0 - x) / 2;
  final dy2 = (y0 - y) / 2;
  final x1p = cosPhi * dx2 + sinPhi * dy2;
  final y1p = -sinPhi * dx2 + cosPhi * dy2;

  // Scale radii up if they are too small to span the endpoints.
  final lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    final s = math.sqrt(lambda);
    rx *= s;
    ry *= s;
  }

  final sign = largeArc == sweep ? -1 : 1;
  final num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  final den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  final coef = den == 0 ? 0.0 : sign * math.sqrt(math.max(0, num / den));
  final cxp = coef * (rx * y1p / ry);
  final cyp = coef * -(ry * x1p / rx);

  final cx = cosPhi * cxp - sinPhi * cyp + (x0 + x) / 2;
  final cy = sinPhi * cxp + cosPhi * cyp + (y0 + y) / 2;

  double angle(double ux, double uy, double vx, double vy) {
    final dot = ux * vx + uy * vy;
    final len = math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
    if (len == 0) return 0;
    var a = math.acos((dot / len).clamp(-1.0, 1.0));
    if (ux * vy - uy * vx < 0) a = -a;
    return a;
  }

  var theta1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  var deltaTheta = angle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!sweep && deltaTheta > 0) deltaTheta -= 2 * math.pi;
  if (sweep && deltaTheta < 0) deltaTheta += 2 * math.pi;

  // Split the sweep into ≤90° segments so each cubic stays accurate.
  final segments = math.max(1, (deltaTheta.abs() / (math.pi / 2)).ceil());
  final delta = deltaTheta / segments;
  final t = 4 / 3 * math.tan(delta / 4);

  var cosT1 = math.cos(theta1);
  var sinT1 = math.sin(theta1);

  double mapX(double ex, double ey) => cosPhi * ex - sinPhi * ey + cx;
  double mapY(double ex, double ey) => sinPhi * ex + cosPhi * ey + cy;

  for (var i = 0; i < segments; i++) {
    final theta2 = theta1 + delta;
    final cosT2 = math.cos(theta2);
    final sinT2 = math.sin(theta2);

    final endX = mapX(rx * cosT2, ry * sinT2);
    final endY = mapY(rx * cosT2, ry * sinT2);

    // Control points in the ellipse's own frame, then transformed.
    final c1x = rx * (cosT1 - t * sinT1);
    final c1y = ry * (sinT1 + t * cosT1);
    final c2x = rx * (cosT2 + t * sinT2);
    final c2y = ry * (sinT2 - t * cosT2);

    path.cubicTo(
      mapX(c1x, c1y),
      mapY(c1x, c1y),
      mapX(c2x, c2y),
      mapY(c2x, c2y),
      endX,
      endY,
    );

    theta1 = theta2;
    cosT1 = cosT2;
    sinT1 = sinT2;
  }
}

/// Minimal scanner for SVG path data.
class _Tokenizer {
  _Tokenizer(this.src);

  final String src;
  int _i = 0;

  void _skipSeparators() {
    while (_i < src.length) {
      final c = src.codeUnitAt(_i);
      if (c == 0x20 || c == 0x2C || c == 0x0A || c == 0x0D || c == 0x09) {
        _i++;
      } else {
        break;
      }
    }
  }

  /// Next command letter, or null when the input is exhausted (or holds
  /// something that is not a command — path data never starts a number at the
  /// top level, so that is treated as the end).
  String? nextCommand() {
    _skipSeparators();
    if (_i >= src.length) return null;
    final ch = src[_i];
    final c = ch.codeUnitAt(0);
    final isLetter = (c >= 0x41 && c <= 0x5A) || (c >= 0x61 && c <= 0x7A);
    // 'e'/'E' are only ever part of an exponent, never a command.
    if (isLetter && ch != 'e' && ch != 'E') {
      _i++;
      return ch;
    }
    return null;
  }

  bool _isDigit(int c) => c >= 0x30 && c <= 0x39;

  bool _startsNumber() {
    if (_i >= src.length) return false;
    final c = src.codeUnitAt(_i);
    final ch = src[_i];
    return _isDigit(c) || ch == '-' || ch == '+' || ch == '.';
  }

  /// True when another number can be read at the cursor.
  bool hasNumber() {
    final save = _i;
    _skipSeparators();
    final ok = _startsNumber();
    _i = save;
    return ok;
  }

  /// Reads one number: `[-+]? (digits [. digits?] | . digits) ([eE] [-+]? digits)?`
  ///
  /// Handles the compact forms icon exporters emit, e.g. `-.5`, `.5.5` (two
  /// numbers), `1e-3`, and `12-3` (12 then -3).
  double number() {
    _skipSeparators();
    final start = _i;
    if (_i < src.length && (src[_i] == '-' || src[_i] == '+')) _i++;
    var sawDigit = false;
    while (_i < src.length && _isDigit(src.codeUnitAt(_i))) {
      _i++;
      sawDigit = true;
    }
    if (_i < src.length && src[_i] == '.') {
      _i++;
      while (_i < src.length && _isDigit(src.codeUnitAt(_i))) {
        _i++;
        sawDigit = true;
      }
    }
    if (!sawDigit) {
      // Nothing numeric here — rewind rather than consuming separators.
      _i = start;
      return 0;
    }
    if (_i < src.length && (src[_i] == 'e' || src[_i] == 'E')) {
      final expStart = _i;
      _i++;
      if (_i < src.length && (src[_i] == '-' || src[_i] == '+')) _i++;
      if (_i < src.length && _isDigit(src.codeUnitAt(_i))) {
        while (_i < src.length && _isDigit(src.codeUnitAt(_i))) {
          _i++;
        }
      } else {
        _i = expStart; // not a real exponent
      }
    }
    return double.tryParse(src.substring(start, _i)) ?? 0;
  }

  /// Arc flag: a single 0/1 character (may be packed like `0 0 0` or `001`).
  bool flag() {
    _skipSeparators();
    if (_i >= src.length) return false;
    final ch = src[_i];
    if (ch == '0' || ch == '1') {
      _i++;
      return ch == '1';
    }
    // Defensive: some exporters emit "0.0"/"1.0" for flags.
    final value = number();
    return value >= 0.5;
  }
}
