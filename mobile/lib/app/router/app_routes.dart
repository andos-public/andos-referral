/// Route paths and names in one place.
///
/// Naming convention: `name` constants are dot-free camelCase ids used with
/// `context.goNamed(...)`, so no screen ever hardcodes a URL string.
abstract final class AppRoutes {
  // ── Shell destinations ────────────────────────────────────────────────────
  static const String invitePath = '/invite';
  static const String referralsPath = '/referrals';
  static const String chatPath = '/chat';
  static const String walletPath = '/wallet';
  static const String settingsPath = '/settings';

  static const String inviteName = 'invite';
  static const String referralsName = 'referrals';
  static const String chatName = 'chat';
  static const String walletName = 'wallet';
  static const String settingsName = 'settings';

  // ── Detail / modal routes (wired as the screens land) ─────────────────────
  static const String referralDetailPath = '$referralsPath/:id';
  static const String referralDetailName = 'referralDetail';
  static String referralDetail(String id) => '$referralsPath/$id';

  static const String chatThreadPath = '$chatPath/:id';
  static const String chatThreadName = 'chatThread';
  static String chatThread(String id) => '$chatPath/$id';

  static const String withdrawPath = '$walletPath/withdraw';
  static const String withdrawName = 'withdraw';

  static const String ledgerPath = '$walletPath/ledger';
  static const String ledgerName = 'ledger';

  static const String payoutMethodsPath = '$walletPath/methods';
  static const String payoutMethodsName = 'payoutMethods';

  static const String linkDetailPath = '$invitePath/:id';
  static const String linkDetailName = 'linkDetail';
  static String linkDetail(String id) => '$invitePath/$id';

  // ── Auth / onboarding (Phase-2 placeholders, still routed) ────────────────
  static const String splashPath = '/';
  static const String splashName = 'splash';
  static const String onboardingPath = '/onboarding';
  static const String onboardingName = 'onboarding';
  static const String signInPath = '/sign-in';
  static const String signInName = 'signIn';
  static const String deepLinkPath = '/r/:code';
  static const String deepLinkName = 'deepLink';
  static String deepLink(String code) => '/r/$code';
}
