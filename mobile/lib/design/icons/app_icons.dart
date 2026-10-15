import 'app_icon_data.dart';
import 'app_icons_registry.dart';

/// The app's icon registry.
///
/// **Zero third-party icon packages.** Every glyph is an owner-authored SVG that
/// is compiled into Dart by `tool/generate_icons.py` (run `dart run tool/icons`
/// style flow: drop SVGs in `assets/icons_src/`, then run the script).
///
/// Naming contract: the constant value === the source SVG file name (snake_case),
/// e.g. `assets/icons_src/nav_invite.svg` → `AppIcons.navInvite == 'nav_invite'`.
///
/// Until a file exists the id resolves to `null` and [AppIcon] renders a marked
/// placeholder in debug builds — the shell is fully navigable while the icon set
/// is being authored, and nothing ever falls back to a stock icon font.
abstract final class AppIcons {
  // ── Bottom navigation ─────────────────────────────────────────────────────
  static const String navInvite = 'nav_invite';
  static const String navReferrals = 'nav_referrals';
  static const String navChat = 'nav_chat';
  static const String navWallet = 'nav_wallet';
  static const String navSettings = 'nav_settings';

  // ── Navigation / chrome ───────────────────────────────────────────────────
  static const String chevronRight = 'chevron_right';
  static const String chevronLeft = 'chevron_left';
  static const String chevronDown = 'chevron_down';
  static const String close = 'close';
  static const String search = 'search';
  static const String filter = 'filter';
  static const String sort = 'sort';
  static const String more = 'more';
  static const String add = 'add';
  static const String check = 'check';
  static const String refresh = 'refresh';

  // ── Invite hub ────────────────────────────────────────────────────────────
  static const String link = 'link';
  static const String qrCode = 'qr_code';
  static const String share = 'share';
  static const String copy = 'copy';
  static const String gift = 'gift';
  static const String sparkles = 'sparkles';
  static const String eye = 'eye';
  static const String cursorTap = 'cursor_tap';
  static const String chartBars = 'chart_bars';
  static const String calendarClock = 'calendar_clock';

  // ── Referrals / attribution ───────────────────────────────────────────────
  static const String users = 'users';
  static const String userPlus = 'user_plus';
  static const String userCheck = 'user_check';
  static const String network = 'network';
  static const String flagMilestone = 'flag_milestone';
  static const String chatLocked = 'chat_locked';
  static const String chatUnlocked = 'chat_unlocked';
  static const String clockPending = 'clock_pending';

  // ── Chat ──────────────────────────────────────────────────────────────────
  static const String message = 'message';
  static const String send = 'send';
  static const String attach = 'attach';
  static const String camera = 'camera';
  static const String gallery = 'gallery';
  static const String mic = 'mic';
  static const String emoji = 'emoji';
  static const String reply = 'reply';
  static const String pin = 'pin';
  static const String trash = 'trash';
  static const String block = 'block';

  // ── Wallet / money ────────────────────────────────────────────────────────
  static const String wallet = 'wallet';
  static const String rupee = 'rupee';
  static const String arrowDownLeft = 'arrow_down_left';
  static const String arrowUpRight = 'arrow_up_right';
  static const String plusCircle = 'plus_circle';
  static const String bank = 'bank';
  static const String card = 'card';
  static const String receipt = 'receipt';
  static const String download = 'download';
  static const String lock = 'lock';
  static const String unlock = 'unlock';
  static const String hourglass = 'hourglass';
  static const String rotateCcw = 'rotate_ccw';
  static const String badgeCheck = 'badge_check';
  static const String trendingUp = 'trending_up';

  // ── Status / feedback ─────────────────────────────────────────────────────
  static const String alertTriangle = 'alert_triangle';
  static const String alertCircle = 'alert_circle';
  static const String info = 'info';
  static const String xCircle = 'x_circle';
  static const String checkCircle = 'check_circle';
  static const String inboxEmpty = 'inbox_empty';
  static const String wifiOff = 'wifi_off';

  // ── Settings / account ────────────────────────────────────────────────────
  static const String user = 'user';
  static const String bell = 'bell';
  static const String moon = 'moon';
  static const String sun = 'sun';
  static const String globe = 'globe';
  static const String shieldCheck = 'shield_check';
  static const String fileText = 'file_text';
  static const String helpCircle = 'help_circle';
  static const String star = 'star';
  static const String logOut = 'log_out';
  static const String key = 'key';
  static const String fingerprint = 'fingerprint';

  /// Every id the shell and the Phase-1 flows reference.
  ///
  /// Kept in the same order as `tool/icon_manifest.txt`; the generator reports
  /// any id that has no SVG yet, and `test/design/icon_registry_test.dart`
  /// asserts this list stays in sync with the manifest.
  static const List<String> required = <String>[
    // nav
    navInvite, navReferrals, navChat, navWallet, navSettings,
    // chrome
    chevronRight, chevronLeft, chevronDown, close, search, filter, sort, more, add, check, refresh,
    // invite hub
    link, qrCode, share, copy, gift, sparkles, eye, cursorTap, chartBars, calendarClock,
    // referrals
    users, userPlus, userCheck, network, flagMilestone, chatLocked, chatUnlocked, clockPending,
    // chat
    message, send, attach, camera, gallery, mic, emoji, reply, pin, trash, block,
    // wallet
    wallet, rupee, arrowDownLeft, arrowUpRight, plusCircle, bank, card, receipt, download, lock, unlock,
    hourglass, rotateCcw, badgeCheck, trendingUp,
    // status
    alertTriangle, alertCircle, info, xCircle, checkCircle, inboxEmpty, wifiOff,
    // settings
    user, bell, moon, sun, globe, shieldCheck, fileText, helpCircle, star, logOut, key, fingerprint,
  ];

  /// Look up an icon by id. Returns null when the SVG has not been added yet.
  static AppIconData? dataFor(String name) => kGeneratedIcons[name];

  /// True when the icon is available (a compiled SVG exists for this id).
  static bool has(String name) => kGeneratedIcons.containsKey(name);

  /// Ids that are still waiting for an SVG — used by the placeholder UI and by
  /// `tool/generate_icons.py` reporting.
  static List<String> get missingFromBundle =>
      required.where((name) => !kGeneratedIcons.containsKey(name)).toList(growable: false);

  /// Ids already compiled into the bundle.
  static List<String> get available =>
      kGeneratedIcons.keys.toList(growable: false);
}
