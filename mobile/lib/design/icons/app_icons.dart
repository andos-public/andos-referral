import 'app_icon_data.dart';
import 'app_icons_registry.dart';

/// The app's icon registry — the **core set for the four-tab flow**.
///
/// **Zero third-party icon packages.** Every glyph is an own-authored SVG that
/// `tool/generate_icons.py` compiles into Dart path data (drop files in
/// `assets/icons_src/`, then run the script). No Lucide, no Material, no
/// Cupertino, no icon font — a widget test asserts that no `Icon` widget is
/// ever mounted anywhere in the app.
///
/// Naming contract: the constant value === the source SVG file name
/// (snake_case), e.g. `assets/icons_src/nav_chat.svg` → [navChat] == 'nav_chat'.
///
/// The set is deliberately small: one icon per job, no near-duplicates, and
/// nothing a four-tab flow does not use. Settings are not a tab — they live in
/// `/profile`, so there is no separate settings icon set.
abstract final class AppIcons {

  // ── nav (4) ──
  static const String navChat = 'nav_chat';
  static const String navReferrals = 'nav_referrals';
  static const String navWallet = 'nav_wallet';
  static const String navProfile = 'nav_profile';

  // ── chrome (9) ──
  static const String chevronRight = 'chevron_right';
  static const String chevronLeft = 'chevron_left';
  static const String close = 'close';
  static const String search = 'search';
  static const String filter = 'filter';
  static const String more = 'more';
  static const String add = 'add';
  static const String check = 'check';
  static const String refresh = 'refresh';

  // ── network & invite (13) ──
  static const String link = 'link';
  static const String qrCode = 'qr_code';
  static const String share = 'share';
  static const String copy = 'copy';
  static const String gift = 'gift';
  static const String cursorTap = 'cursor_tap';
  static const String chartBars = 'chart_bars';
  static const String userPlus = 'user_plus';
  static const String userCheck = 'user_check';
  static const String network = 'network';
  static const String flagMilestone = 'flag_milestone';
  static const String chatLocked = 'chat_locked';
  static const String chatUnlocked = 'chat_unlocked';

  // ── chat (8) ──
  static const String send = 'send';
  static const String attach = 'attach';
  static const String mic = 'mic';
  static const String emoji = 'emoji';
  static const String reply = 'reply';
  static const String pin = 'pin';
  static const String trash = 'trash';
  static const String block = 'block';

  // ── wallet (12) ──
  static const String rupee = 'rupee';
  static const String arrowDownLeft = 'arrow_down_left';
  static const String arrowUpRight = 'arrow_up_right';
  static const String plusCircle = 'plus_circle';
  static const String bank = 'bank';
  static const String card = 'card';
  static const String receipt = 'receipt';
  static const String lock = 'lock';
  static const String hourglass = 'hourglass';
  static const String rotateCcw = 'rotate_ccw';
  static const String badgeCheck = 'badge_check';
  static const String trendingUp = 'trending_up';

  // ── status (6) ──
  static const String alertTriangle = 'alert_triangle';
  static const String info = 'info';
  static const String xCircle = 'x_circle';
  static const String checkCircle = 'check_circle';
  static const String inboxEmpty = 'inbox_empty';
  static const String wifiOff = 'wifi_off';

  // ── profile & settings (9) ──
  static const String bell = 'bell';
  static const String moon = 'moon';
  static const String sun = 'sun';
  static const String shieldCheck = 'shield_check';
  static const String fileText = 'file_text';
  static const String helpCircle = 'help_circle';
  static const String logOut = 'log_out';
  static const String fingerprint = 'fingerprint';
  static const String themeAuto = 'theme_auto';

  /// Every icon the app uses, in declaration order.
  static const List<String> required = <String>[
    // nav
    navChat, navReferrals, navWallet, navProfile,
    // chrome
    chevronRight, chevronLeft, close, search, filter, more, add, check, refresh,
    // network & invite
    link, qrCode, share, copy, gift, cursorTap, chartBars, userPlus, userCheck, network, flagMilestone, chatLocked, chatUnlocked,
    // chat
    send, attach, mic, emoji, reply, pin, trash, block,
    // wallet
    rupee, arrowDownLeft, arrowUpRight, plusCircle, bank, card, receipt, lock, hourglass, rotateCcw, badgeCheck, trendingUp,
    // status
    alertTriangle, info, xCircle, checkCircle, inboxEmpty, wifiOff,
    // profile & settings
    bell, moon, sun, shieldCheck, fileText, helpCircle, logOut, fingerprint, themeAuto,
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
  static List<String> get available => kGeneratedIcons.keys.toList(growable: false);
}
