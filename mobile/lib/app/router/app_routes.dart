/// Route paths and names in one place.
///
/// Naming convention: `name` constants are dot-free camelCase ids used with
/// `context.goNamed(...)`, so no screen hardcodes a URL string.
///
/// The bottom navigation is **four tabs** (owner decision, 15 Oct):
///   0 `/chat`      → referral-chat list — the default home tab
///   1 `/referrals` → all-in-one network & invite hub (links + milestone progress)
///   2 `/wallet`    → earnings, 7-day hold, ledger, withdrawals
///   3 `/profile`   → profile, referral stats and every setting
abstract final class AppRoutes {
  // ── Shell destinations (order == bottom-nav order == branch index) ────────
  static const String chatPath = '/chat';
  static const String referralsPath = '/referrals';
  static const String walletPath = '/wallet';
  static const String profilePath = '/profile';

  static const String chatName = 'chat';
  static const String referralsName = 'referrals';
  static const String walletName = 'wallet';
  static const String profileName = 'profile';

  // ── Detail routes ─────────────────────────────────────────────────────────
  static const String chatThreadPath = '$chatPath/:id';
  static const String chatThreadName = 'chatThread';
  static String chatThread(String id) => '$chatPath/$id';

  static const String referralDetailPath = '$referralsPath/:id';
  static const String referralDetailName = 'referralDetail';
  static String referralDetail(String id) => '$referralsPath/$id';

  static const String withdrawPath = '$walletPath/withdraw';
  static const String withdrawName = 'withdraw';

  static const String ledgerPath = '$walletPath/ledger';
  static const String ledgerName = 'ledger';

  static const String payoutMethodsPath = '$walletPath/methods';
  static const String payoutMethodsName = 'payoutMethods';

  static const String withdrawalHistoryPath = '$profilePath/withdrawals';
  static const String withdrawalHistoryName = 'withdrawalHistory';

  static const String securityPath = '$profilePath/security';
  static const String securityName = 'security';

  // ── Public deep link + app entry ─────────────────────────────────────────
  /// `/r/<code>` — the link the main app shares; lands on the Referrals tab
  /// with the code prefilled.
  static const String deepLinkPath = '/r/:code';
  static const String deepLinkName = 'deepLink';
  static String deepLink(String code) => '/r/$code';

  static const String splashPath = '/';
  static const String splashName = 'splash';
  static const String onboardingPath = '/onboarding';
  static const String onboardingName = 'onboarding';
  static const String signInPath = '/sign-in';
  static const String signInName = 'signIn';
}
