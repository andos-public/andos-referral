import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../tokens/app_colors.dart';
import '../tokens/app_spacing.dart';
import '../tokens/app_typography.dart';

/// True edge-to-edge page chrome.
///
/// * The page background (gradient or flat) paints **behind** the status bar and
///   the gesture area — content is inset by padding, never by a coloured band.
/// * System overlay icon brightness follows the theme, so the clock/battery keep
///   contrast through the notch and the gesture pill.
/// * `title` renders in our own header row (no Material AppBar chrome), with an
///   optional leading back button and trailing actions.
///
/// Screens that need content *under* the bars (chat thread, hero wallet) use
/// `extendBodyBehindAppBar`-style behaviour by simply not passing `title` and
/// giving their first sliver its own top padding via `MediaQuery.viewPaddingOf`.
class EdgeToEdgeScaffold extends StatelessWidget {
  const EdgeToEdgeScaffold({
    super.key,
    this.title,
    this.subtitle,
    this.body,
    this.leading,
    this.actions = const <Widget>[],
    this.bottomNav,
    this.gradient = true,
    this.paddedBody = false,
    this.resizeToAvoidBottomInset = true,
    this.bottomSheet,
    this.floatingActionButton,
  });

  /// Header text. Pass null for a fully immersive page (chat thread, onboarding).
  final String? title;
  final String? subtitle;

  final Widget? body;
  final Widget? leading;
  final List<Widget> actions;

  /// Floating nav bar (the shell supplies it). Painted above the body.
  final Widget? bottomNav;

  /// Whether the page paints the diagonal hero gradient or a flat surface.
  final bool gradient;

  /// Adds the standard screen gutter around [body].
  final bool paddedBody;

  final bool resizeToAvoidBottomInset;
  final Widget? bottomSheet;
  final Widget? floatingActionButton;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final viewPadding = MediaQuery.viewPaddingOf(context);
    final hasHeader = title != null || subtitle != null || leading != null || actions.isNotEmpty;

    // Keep status-bar icons legible against our own background.
    final overlayStyle = colors.isDark
        ? SystemUiOverlayStyle.light.copyWith(
            statusBarColor: Colors.transparent,
            systemNavigationBarColor: Colors.transparent,
            systemNavigationBarIconBrightness: Brightness.light,
            statusBarIconBrightness: Brightness.light,
          )
        : SystemUiOverlayStyle.dark.copyWith(
            statusBarColor: Colors.transparent,
            systemNavigationBarColor: Colors.transparent,
            systemNavigationBarIconBrightness: Brightness.dark,
            statusBarIconBrightness: Brightness.dark,
          );

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: overlayStyle,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: colors.bgBase,
          gradient: gradient
              ? colors.heroGradient
              : null,
        ),
        child: Scaffold(
          backgroundColor: Colors.transparent,
          resizeToAvoidBottomInset: resizeToAvoidBottomInset,
          extendBody: true, // content flows under the floating nav
          extendBodyBehindAppBar: true,
          body: Stack(
            children: [
              Positioned.fill(
                child: Padding(
                  padding: EdgeInsets.only(
                    top: hasHeader ? viewPadding.top + AppSpacing.gap8 : 0,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (hasHeader)
                        Padding(
                          padding: EdgeInsets.fromLTRB(
                            AppSpacing.screenGutter,
                            AppSpacing.gap8,
                            AppSpacing.screenGutter,
                            AppSpacing.gap16,
                          ),
                          child: _Header(title: title, subtitle: subtitle, leading: leading, actions: actions),
                        ),
                      Expanded(
                        child: Padding(
                          padding: paddedBody
                              ? const EdgeInsets.symmetric(horizontal: AppSpacing.screenGutter)
                              : EdgeInsets.zero,
                          child: body ?? const SizedBox.shrink(),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (bottomNav != null)
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: bottomNav!,
                ),
            ],
          ),
          bottomSheet: bottomSheet,
          floatingActionButton: floatingActionButton,
          floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({this.title, this.subtitle, this.leading, this.actions = const <Widget>[]});

  final String? title;
  final String? subtitle;
  final Widget? leading;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        if (leading != null) ...[
          leading!,
          const SizedBox(width: AppSpacing.gap8),
        ],
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (title != null)
                Text(
                  title!,
                  style: AppTypography.h1(23, colors.textPrimary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              if (subtitle != null)
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Text(
                    subtitle!,
                    style: AppTypography.caption(12.5, colors.textTertiary),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
            ],
          ),
        ),
        if (actions.isNotEmpty) ...[
          const SizedBox(width: AppSpacing.gap8),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (var i = 0; i < actions.length; i++) ...[
                if (i > 0) const SizedBox(width: AppSpacing.gap8),
                actions[i],
              ],
            ],
          ),
        ],
      ],
    );
  }
}
