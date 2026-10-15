import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Central haptics policy.
///
/// Owner-locked rule: **every user-initiated tap gives haptic feedback.**
/// This service keeps that honest in one place so screens never call
/// `HapticFeedback` directly and behaviour stays consistent (and testable —
/// tests override [AppHaptics.enabled] and assert the *intent*).
///
/// Intensity ladder (mirrors the platform APIs, not invented):
///   selection  — moving between tabs, picking a chip, toggling a filter
///   light      — normal button taps, list row actions
///   medium     — confirming a money/irreversible action
///   heavy      — success of a destructive-but-intended action, errors
///   vibrate    — hard failure / blocking error
///
/// Rules:
///  * Never fire on scroll, on hover, or once per frame during a gesture.
///  * Money confirmation gets `medium`; the *result* of a payout action gets
///    `success()` (a distinct double-pulse pattern).
///  * Respect the platform: no haptics on desktop/web by default.
class AppHaptics {
  AppHaptics._();

  /// Master switch — flipped by the in-app accessibility setting and by tests.
  static bool _enabled = true;

  /// Current master-switch state.
  static bool get enabled => _enabled;

  /// Enable/disable haptics app-wide (Settings screen uses this).
  static void setEnabled(bool value) => _enabled = value;

  /// Kept for tests that need to assert the internal state without the setter.
  @visibleForTesting
  static bool get enabledForTesting => _enabled;

  static bool get _supported =>
      !kIsWeb &&
      (defaultTargetPlatform == TargetPlatform.android ||
          defaultTargetPlatform == TargetPlatform.iOS ||
          defaultTargetPlatform == TargetPlatform.macOS);

  static bool get isActive => _enabled && _supported;

  static Future<void> _fire(Future<void> Function() action) async {
    if (!isActive) return;
    try {
      await action();
    } on PlatformException {
      // Haptics are a nicety: never let a device without a vibrator break a tap.
    } on MissingPluginException {
      // Same reasoning for platform channels unavailable in tests.
    }
  }

  /// Tab switches, chip selection, segmented control changes.
  static Future<void> selection() => _fire(HapticFeedback.selectionClick);

  /// Standard taps: buttons, nav items, list rows, icon buttons.
  static Future<void> tap() => _fire(HapticFeedback.lightImpact);

  /// Confirming something that moves money or is hard to undo.
  static Future<void> confirm() => _fire(HapticFeedback.mediumImpact);

  /// Reserved for destructive actions after the user explicitly commits.
  static Future<void> destructive() => _fire(HapticFeedback.heavyImpact);

  /// Blocking error: validation failure on a money form, failed payout.
  static Future<void> error() => _fire(HapticFeedback.vibrate);

  /// Success pattern for milestone moments (chat unlocked, commission released,
  /// payout completed): a short double pulse — light, then medium.
  static Future<void> success() async {
    if (!isActive) return;
    await _fire(HapticFeedback.lightImpact);
    await Future<void>.delayed(const Duration(milliseconds: 90));
    await _fire(HapticFeedback.mediumImpact);
  }
}
