import 'package:flutter/material.dart';

/// Andos Referral — spacing scale.
///
/// Owner-locked rule: strict 8-point grid (8 / 16 / 24) with a 4 sp micro step.
/// Every gap, padding and inset in the app comes from here — no magic numbers.
///
/// ui-ux-pro-max touch rules that depend on this scale:
///  * touch targets ≥ 48 dp on Android / 44 pt on iOS (`minTouchTarget`),
///  * ≥ 8 sp clear space between adjacent targets (`gap8`),
///  * 44×44 icon buttons.
abstract final class AppSpacing {
  /// 2 sp — hairline. Deliberately **not** part of [scale]: it is an optical
  /// correction (1 px-ish borders), not a spacing step, so the 8-point grid
  /// assertion in the token test stays strict.
  static const double hairline = 2;

  /// 4 sp — micro step (inside chips, between label and value).
  static const double xs = 4;

  /// 8 sp — the base step.
  static const double gap8 = 8;

  /// 12 sp — half-step, used sparingly for dense rows.
  static const double gap12 = 12;

  /// 16 sp — default padding.
  static const double gap16 = 16;

  /// 20 sp — comfortable section padding.
  static const double gap20 = 20;

  /// 24 sp — section spacing.
  static const double gap24 = 24;

  /// 32 sp — large section spacing.
  static const double gap32 = 32;

  /// 40 sp — hero spacing.
  static const double gap40 = 40;

  /// 56 sp — page-bottom breathing room above the floating nav.
  static const double gap56 = 56;

  /// Screen gutter used by every page header and list.
  static const double screenGutter = 20;

  /// Minimum interactive edge (Android guidance).
  static const double minTouchTarget = 48;

  /// Minimum interactive edge (iOS guidance).
  static const double minTouchTargetIos = 44;

  /// Height of the floating bottom navigation bar.
  static const double navBarHeight = 68;

  /// Float gap between the nav bar and the screen edge.
  static const double navFloatGap = 12;

  /// Extra scroll padding so content clears the floating nav.
  static const double navClearance = navBarHeight + navFloatGap * 2;

  /// All values in ascending order — asserted by the token test to be 4-based.
  static const List<double> scale = [xs, gap8, gap12, gap16, gap20, gap24, gap32, gap40, gap56];
}

/// Corner radii. The app is soft-but-precise: cards 20, chips pill, sheets 28.
abstract final class AppRadii {
  static const Radius xs = Radius.circular(8);
  static const Radius sm = Radius.circular(12);
  static const Radius md = Radius.circular(16);
  static const Radius lg = Radius.circular(20);
  static const Radius xl = Radius.circular(28);
  static const Radius pill = Radius.circular(999);

  static const BorderRadius allXs = BorderRadius.all(xs);
  static const BorderRadius allSm = BorderRadius.all(sm);
  static const BorderRadius allMd = BorderRadius.all(md);
  static const BorderRadius allLg = BorderRadius.all(lg);
  static const BorderRadius allXl = BorderRadius.all(xl);
  static const BorderRadius allPill = BorderRadius.all(pill);

  /// Sheets and modals: big top corners only.
  static const BorderRadius sheet = BorderRadius.vertical(top: xl);
}
