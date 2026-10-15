import 'package:flutter/material.dart';
import 'package:flutter/physics.dart';

import 'app_colors.dart';
import 'app_shadows.dart';
import 'app_spacing.dart';
import 'app_typography.dart';

/// A `Curve` that evaluates a real spring simulation, so even Material's
/// implicit transitions move with the same physics as our touch interactions.
class AppSpringCurve extends Curve {
  const AppSpringCurve(this.spring, {this.virtualDuration = const Duration(milliseconds: 600)});

  final SpringDescription spring;

  /// The wall-clock window the dimensionless curve parameter is mapped onto.
  final Duration virtualDuration;

  @override
  double transform(double t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    final simulation = SpringSimulation(spring, 0, 1, 0);
    final seconds = virtualDuration.inMicroseconds / 1e6 * t;
    return simulation.x(seconds).clamp(0.0, 1.0);
  }
}

/// Page transition: content fades + lifts with spring physics (no iOS-style
/// full-width slide, so tab switches inside the shell stay calm).
class AppPageTransitionsBuilder extends PageTransitionsBuilder {
  const AppPageTransitionsBuilder();

  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    final reduce = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    if (reduce) {
      return FadeTransition(opacity: animation, child: child);
    }
    final curve = CurvedAnimation(
      parent: animation,
      curve: const AppSpringCurve(AppMotionSprings.page),
      reverseCurve: Curves.easeInCubic,
    );
    return FadeTransition(
      opacity: animation.drive(CurveTween(curve: const Interval(0, 0.6, curve: Curves.easeOut))),
      child: SlideTransition(
        position: Tween<Offset>(begin: const Offset(0, 0.035), end: Offset.zero).animate(curve),
        child: child,
      ),
    );
  }
}

/// Springs re-declared here to keep `AppSpringCurve` const-constructible
/// without importing the whole motion surface into every route file.
abstract final class AppMotionSprings {
  static const SpringDescription page = SpringDescription(mass: 1, stiffness: 240, damping: 28);
}

/// Builds the app's light and dark [ThemeData] from the token set.
///
/// Everything Material still needs (a colour scheme, typography, component
/// defaults) is *derived* from tokens — no widget should ever hardcode a colour
/// or a text size.
abstract final class AppTheme {
  static ThemeData dark() => _build(AppColors.dark);

  static ThemeData light() => _build(AppColors.light);

  static ThemeData _build(AppColors c) {
    final textTheme = AppTypography.textTheme(c.textPrimary, c.textSecondary, c.textTertiary);

    final colorScheme = ColorScheme(
      brightness: c.brightness,
      primary: c.brand,
      onPrimary: c.textOnBrand,
      primaryContainer: c.brandSoft,
      onPrimaryContainer: c.textPrimary,
      secondary: c.accent,
      onSecondary: Colors.white,
      secondaryContainer: c.accentSoft,
      onSecondaryContainer: c.textPrimary,
      tertiary: c.info,
      onTertiary: Colors.white,
      error: c.danger,
      onError: Colors.white,
      errorContainer: c.danger.withValues(alpha: 0.18),
      onErrorContainer: c.textPrimary,
      surface: c.surface,
      onSurface: c.textPrimary,
      onSurfaceVariant: c.textSecondary,
      surfaceContainerHighest: c.surfaceElevated,
      outline: c.border,
      outlineVariant: c.borderStrong,
      shadow: Colors.black,
      scrim: c.scrim,
      inverseSurface: c.textPrimary,
      onInverseSurface: c.bgBase,
      inversePrimary: c.brandStrong,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: c.brightness,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: c.bgBase,
      canvasColor: c.bgBase,
      splashFactory: NoSplash.splashFactory,
      highlightColor: Colors.transparent,
      hoverColor: c.surfaceElevated.withValues(alpha: 0.4),
      focusColor: c.focusRing.withValues(alpha: 0.24),
      dividerColor: c.border,
      extensions: <ThemeExtension<dynamic>>[c],
      textTheme: textTheme,
      primaryTextTheme: textTheme,
      visualDensity: VisualDensity.standard,

      // ── Chrome ────────────────────────────────────────────────────────────
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: AppTypography.h3(18, c.textPrimary),
        iconTheme: IconThemeData(color: c.textPrimary, size: 22),
        systemOverlayStyle: null, // resolved per-screen by EdgeToEdgeScaffold
      ),

      // ── Motion ────────────────────────────────────────────────────────────
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: <TargetPlatform, PageTransitionsBuilder>{
          TargetPlatform.android: AppPageTransitionsBuilder(),
          TargetPlatform.iOS: AppPageTransitionsBuilder(),
          TargetPlatform.macOS: AppPageTransitionsBuilder(),
          TargetPlatform.linux: AppPageTransitionsBuilder(),
          TargetPlatform.windows: AppPageTransitionsBuilder(),
        },
      ),

      // ── Surfaces ──────────────────────────────────────────────────────────
      cardTheme: CardThemeData(
        color: c.surface,
        surfaceTintColor: Colors.transparent,
        shadowColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(borderRadius: AppRadii.allLg, side: BorderSide(color: c.border)),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        modalBackgroundColor: Colors.transparent,
        shape: const RoundedRectangleBorder(borderRadius: AppRadii.sheet),
        dragHandleColor: c.borderStrong,
        showDragHandle: false,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: c.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: AppRadii.allXl, side: BorderSide(color: c.border)),
        titleTextStyle: AppTypography.h2(19, c.textPrimary),
        contentTextStyle: AppTypography.body(14, c.textSecondary),
      ),
      dividerTheme: DividerThemeData(color: c.border, thickness: 1, space: 1),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: c.surfaceElevated,
        contentTextStyle: AppTypography.body(14, c.textPrimary),
        actionTextColor: c.brand,
        shape: RoundedRectangleBorder(borderRadius: AppRadii.allMd, side: BorderSide(color: c.border)),
        elevation: 0,
      ),
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(color: c.surfaceElevated, borderRadius: AppRadii.allSm, border: Border.all(color: c.border)),
        textStyle: AppTypography.caption(12, c.textPrimary),
      ),

      // ── Inputs ────────────────────────────────────────────────────────────
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.surfaceMuted,
        contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.gap16, vertical: AppSpacing.gap16),
        hintStyle: AppTypography.body(15, c.textTertiary),
        labelStyle: AppTypography.label(13, c.textSecondary),
        errorStyle: AppTypography.caption(12, c.danger),
        border: OutlineInputBorder(borderRadius: AppRadii.allMd, borderSide: BorderSide(color: c.border)),
        enabledBorder: OutlineInputBorder(borderRadius: AppRadii.allMd, borderSide: BorderSide(color: c.border)),
        focusedBorder: OutlineInputBorder(borderRadius: AppRadii.allMd, borderSide: BorderSide(color: c.brand, width: 1.6)),
        errorBorder: OutlineInputBorder(borderRadius: AppRadii.allMd, borderSide: BorderSide(color: c.danger)),
        focusedErrorBorder: OutlineInputBorder(borderRadius: AppRadii.allMd, borderSide: BorderSide(color: c.danger, width: 1.6)),
      ),

      // ── Buttons (styled for completeness; the app ships AppButton on top) ──
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: c.brand,
          foregroundColor: c.textOnBrand,
          minimumSize: const Size(0, AppSpacing.minTouchTarget),
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.gap20),
          shape: RoundedRectangleBorder(borderRadius: AppRadii.allMd),
          textStyle: AppTypography.bodyStrong(15, c.textOnBrand),
          elevation: 0,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: c.textPrimary,
          minimumSize: const Size(0, AppSpacing.minTouchTarget),
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.gap20),
          side: BorderSide(color: c.border),
          shape: RoundedRectangleBorder(borderRadius: AppRadii.allMd),
          textStyle: AppTypography.bodyStrong(15, c.textPrimary),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: c.textPrimary,
          minimumSize: const Size(0, AppSpacing.minTouchTargetIos),
          textStyle: AppTypography.bodyStrong(15, c.textPrimary),
          shape: RoundedRectangleBorder(borderRadius: AppRadii.allSm),
        ),
      ),

      // ── Controls ──────────────────────────────────────────────────────────
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected) ? c.textOnBrand : c.surface,
        ),
        trackColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected) ? c.brand : c.surfaceMuted,
        ),
        trackOutlineColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected) ? Colors.transparent : c.border,
        ),
      ),
      sliderTheme: SliderThemeData(
        activeTrackColor: c.brand,
        inactiveTrackColor: c.surfaceMuted,
        thumbColor: c.brandStrong,
        overlayColor: c.brandSoft,
        trackHeight: 4,
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(color: c.brand, linearTrackColor: c.surfaceMuted),
      chipTheme: ChipThemeData(
        backgroundColor: c.surfaceMuted,
        selectedColor: c.brandSoft,
        side: BorderSide(color: c.border),
        labelStyle: AppTypography.label(13, c.textPrimary),
        secondaryLabelStyle: AppTypography.label(13, c.textSecondary),
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.gap12, vertical: AppSpacing.gap8),
        shape: const RoundedRectangleBorder(borderRadius: AppRadii.allPill),
      ),
      listTileTheme: ListTileThemeData(
        tileColor: Colors.transparent,
        selectedTileColor: c.brandSoft,
        iconColor: c.textSecondary,
        titleTextStyle: AppTypography.bodyStrong(15, c.textPrimary),
        subtitleTextStyle: AppTypography.body(13, c.textSecondary),
        contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.gap16),
        minVerticalPadding: AppSpacing.gap12,
      ),
      iconTheme: IconThemeData(color: c.textSecondary, size: 22),
      textSelectionTheme: TextSelectionThemeData(cursorColor: c.brand, selectionColor: c.brandSoft, selectionHandleColor: c.brand),
      scrollbarTheme: ScrollbarThemeData(
        thumbColor: WidgetStatePropertyAll(c.borderStrong),
        thickness: const WidgetStatePropertyAll(3),
        radius: AppRadii.pill,
      ),
    );
  }

  /// Convenience for tests/widgets that need the palette without a context.
  static AppColors colorsFor(Brightness brightness) =>
      brightness == Brightness.dark ? AppColors.dark : AppColors.light;

  /// Shadows are palette-aware; exposed here so widgets import one file.
  static List<BoxShadow> cardShadow(AppColors colors) => AppShadows.card(colors);
}
