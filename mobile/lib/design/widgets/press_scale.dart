import 'package:flutter/material.dart';
import 'package:flutter/physics.dart';

import '../../core/haptics/app_haptics.dart';
import '../tokens/app_motion.dart';

/// Wraps any tappable surface with 2026-appropriate press feedback:
///
///  * scales down on press with a spring, returns with a spring on release,
///  * optional haptic on tap (default [AppHaptics.tap]),
///  * honours reduced-motion (scaling is skipped, opacity dip remains),
///  * keeps the hit target at ≥ 48 dp via `minimumSize`.
///
/// Used by nav items, cards, list rows and icon buttons so the whole app feels
/// like one physical object.
class PressScale extends StatefulWidget {
  const PressScale({
    super.key,
    required this.child,
    this.onTap,
    this.onLongPress,
    this.scale = 0.96,
    this.pressedOpacity = 0.92,
    this.haptic = true,
    this.semanticLabel,
    this.semanticButton = true,
    this.minimumSize = const Size(48, 48),
    this.behavior = HitTestBehavior.opaque,
  });

  final Widget child;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;

  /// How far the surface squeezes while held (0.90–0.98 reads best at 48–72 dp).
  final double scale;

  /// Slight dim under the finger — helps on low-contrast surfaces.
  final double pressedOpacity;

  /// Fire [AppHaptics.tap] when tapped.
  final bool haptic;

  final String? semanticLabel;
  final bool semanticButton;
  final Size minimumSize;
  final HitTestBehavior behavior;

  @override
  State<PressScale> createState() => _PressScaleState();
}

class _PressScaleState extends State<PressScale> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: AppMotion.fast,
    value: 0,
  );

  bool get _interactive => widget.onTap != null || widget.onLongPress != null;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _setPressed(bool pressed) {
    if (!_interactive) return;
    if (AppMotion.reduceMotion(context)) {
      _controller.value = pressed ? 1 : 0;
      return;
    }
    final spring = AppMotion.springFor(
      context,
      pressed ? AppMotion.snappy : AppMotion.release,
    );
    _controller.animateWith(SpringSimulation(spring, _controller.value, pressed ? 1 : 0, 0));
  }

  void _handleTap() {
    if (widget.haptic) AppHaptics.tap();
    widget.onTap?.call();
  }

  void _handleLongPress() {
    if (widget.haptic) AppHaptics.confirm();
    widget.onLongPress?.call();
  }

  @override
  Widget build(BuildContext context) {
    final reduce = AppMotion.reduceMotion(context);

    return Semantics(
      label: widget.semanticLabel,
      button: widget.semanticButton && _interactive,
      child: GestureDetector(
        behavior: widget.behavior,
        onTap: _interactive ? _handleTap : null,
        onLongPress: widget.onLongPress == null ? null : _handleLongPress,
        onTapDown: (_) => _setPressed(true),
        onTapUp: (_) => _setPressed(false),
        onTapCancel: () => _setPressed(false),
        child: ConstrainedBox(
          constraints: BoxConstraints(
            minWidth: widget.minimumSize.width,
            minHeight: widget.minimumSize.height,
          ),
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, child) {
              final t = _controller.value;
              return Opacity(
                opacity: 1 - (1 - widget.pressedOpacity) * t,
                child: Transform.scale(
                  scale: reduce ? 1 : 1 - (1 - widget.scale) * t,
                  child: child,
                ),
              );
            },
            child: widget.child,
          ),
        ),
      ),
    );
  }
}
