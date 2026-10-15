import 'package:flutter/material.dart';
import 'package:flutter/physics.dart';

/// Andos Referral — motion system.
///
/// Owner-locked rule: **spring physics, not linear tweens**, everywhere a surface
/// moves because of a touch (nav indicator, press scale, sheets, cards).
/// Durations are reserved for *fades* and cross-fades where a spring has no
/// meaningful overshoot.
///
/// Accessibility: every consumer resolves its duration through
/// [AppMotion.durationFor] (or [AppMotion.springFor]) which collapses to an
/// instant transition when the OS asks for reduced motion.
abstract final class AppMotion {
  // ── Durations (fades / cross-fades only) ──────────────────────────────────
  /// 90 ms — state colour flips.
  static const Duration instant = Duration(milliseconds: 90);

  /// 160 ms — micro fades (icon colour, chip press).
  static const Duration fast = Duration(milliseconds: 160);

  /// 220 ms — standard fade / slide-in of small surfaces.
  static const Duration base = Duration(milliseconds: 220);

  /// 320 ms — larger surfaces, sheet content.
  static const Duration slow = Duration(milliseconds: 320);

  /// 420 ms — route-level transitions.
  static const Duration page = Duration(milliseconds: 420);

  // ── Spring descriptions ───────────────────────────────────────────────────
  /// Nav indicator + press release: quick settle, tiny overshoot.
  static const SpringDescription snappy = SpringDescription(mass: 0.9, stiffness: 420, damping: 32);

  /// Default UI motion: smooth, no bounce.
  static const SpringDescription gentle = SpringDescription(mass: 1, stiffness: 260, damping: 26);

  /// Playful confirmations (reward landed, chat unlocked): visible overshoot.
  static const SpringDescription bouncy = SpringDescription(mass: 0.8, stiffness: 500, damping: 22);

  /// Bottom sheets: heavier mass so it feels anchored.
  static const SpringDescription sheet = SpringDescription(mass: 1.1, stiffness: 320, damping: 30);

  /// The spring used when a finger lifts and a pressed surface returns.
  static const SpringDescription release = snappy;

  // ── Curves (for implicit animations that cannot take a spring) ─────────────
  /// Emphasised easing for enter transitions.
  static const Curve emphasized = Cubic(0.2, 0, 0, 1);

  /// Standard easing for moves within a screen.
  static const Curve standard = Cubic(0.4, 0, 0.2, 1);

  /// Decelerate — elements arriving from off-screen.
  static const Curve decelerate = Cubic(0.05, 0.7, 0.1, 1);

  /// Accelarate — elements leaving the screen.
  static const Curve accelerate = Cubic(0.3, 0, 0.8, 0.15);

  // ── Reduced-motion aware resolvers ────────────────────────────────────────

  /// True when the platform asks for reduced motion (or tests disable animations).
  static bool reduceMotion(BuildContext context) =>
      MediaQuery.maybeDisableAnimationsOf(context) ?? false;

  /// Duration that collapses to ~instant under reduced motion.
  static Duration durationFor(BuildContext context, Duration duration) =>
      reduceMotion(context) ? const Duration(milliseconds: 1) : duration;

  /// Spring that becomes a critically-damped, near-instant settle under
  /// reduced motion (still a simulation, so the widget code path is identical).
  static SpringDescription springFor(BuildContext context, SpringDescription spring) => reduceMotion(context)
      ? const SpringDescription(mass: 1, stiffness: 900, damping: 90)
      : spring;

  /// Convenience: run [controller] to [value] with [spring].
  static void animateTo(
    AnimationController controller,
    double value,
    SpringDescription spring, {
    double velocity = 0,
  }) {
    controller.animateWith(SpringSimulation(spring, controller.value, value, velocity / 1000));
  }
}
