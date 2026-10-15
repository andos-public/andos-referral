// COMPILED ICON REGISTRY — do not edit by hand.
//
// Source of truth:  assets/icons_src/*.svg   (owner-authored, hand-tuned SVGs)
// Regenerate with:  python3 tool/generate_icons.py
//
// This file is intentionally NOT named `*.g.dart`: build_runner treats those as
// its own outputs and prunes them. Icons are compiled here into plain Dart so the
// app ships no icon font and no third-party icon package — every glyph is painted
// by `AppIcon` from the path data below.

import 'app_icon_data.dart';

/// Compiled icons, keyed by icon id (== source file name, snake_case).
const Map<String, AppIconData> kGeneratedIcons = <String, AppIconData>{
  'add': AppIconData(
    name: 'add',
    paths: [
      AppIconPathSpec(
        d: 'M12 5.6v12.8M5.6 12h12.8',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'alert_triangle': AppIconData(
    name: 'alert_triangle',
    duotone: true,
    paths: [
      AppIconPathSpec(
        d: 'M13.3 4.7a1.7 1.7 0 0 0-2.6 0L3.4 17.4a1.7 1.7 0 0 0 1.3 2.5h14.6a1.7 1.7 0 0 0 1.3-2.5z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M12 9.6v4.2',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M11.05 16.9A0.95 0.95 0 1 0 12.95 16.9A0.95 0.95 0 1 0 11.05 16.9Z',
        paint: AppIconPaint.fill,
      ),
    ],
  ),
  'arrow_down_left': AppIconData(
    name: 'arrow_down_left',
    paths: [
      AppIconPathSpec(
        d: 'M18.4 5.6 6.6 17.4',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M11.6 17.4H6.6V12.4',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'arrow_up_right': AppIconData(
    name: 'arrow_up_right',
    paths: [
      AppIconPathSpec(
        d: 'M5.6 18.4 17.4 6.6',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M12.4 6.6h5v5',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'attach': AppIconData(
    name: 'attach',
    paths: [
      AppIconPathSpec(
        d: 'M17.9 11.2 11 18.1a4.2 4.2 0 0 1-5.9-5.9l7.6-7.6a2.9 2.9 0 0 1 4.1 4.1l-7.2 7.2a1.5 1.5 0 0 1-2.1-2.1l6.5-6.5',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'badge_check': AppIconData(
    name: 'badge_check',
    paths: [
      AppIconPathSpec(
        d: 'M6.4 9.9A5.6 5.6 0 1 0 17.6 9.9A5.6 5.6 0 1 0 6.4 9.9Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M8.4 14.6 6.8 21l5.2-2.3 5.2 2.3-1.6-6.4',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M9.9 9.9l1.6 1.6 3-3.3',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'bank': AppIconData(
    name: 'bank',
    paths: [
      AppIconPathSpec(
        d: 'M3.9 9.5 12 4.5l8.1 5z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M6.4 9.5v8M10.2 9.5v8M13.8 9.5v8M17.6 9.5v8',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M4.4 19.6h15.2',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'bell': AppIconData(
    name: 'bell',
    paths: [
      AppIconPathSpec(
        d: 'M6.4 17.4V10.2a5.6 5.6 0 0 1 11.2 0v7.2',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M4.6 17.4h14.8',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M10.2 20.2a2.1 2.1 0 0 0 3.6 0',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'block': AppIconData(
    name: 'block',
    paths: [
      AppIconPathSpec(
        d: 'M3.5999999999999996 12.0A8.4 8.4 0 1 0 20.4 12.0A8.4 8.4 0 1 0 3.5999999999999996 12.0Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M6.1 17.9 17.9 6.1',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'card': AppIconData(
    name: 'card',
    paths: [
      AppIconPathSpec(
        d: 'M5.6 5.4H18.400000000000002A3.0 3.0 0 0 1 21.400000000000002 8.4V15.600000000000001A3.0 3.0 0 0 1 18.400000000000002 18.6H5.6A3.0 3.0 0 0 1 2.6 15.600000000000001V8.4A3.0 3.0 0 0 1 5.6 5.4Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M2.6 10h18.8',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M6.9 12.8H8.9A0.9 0.9 0 0 1 9.8 13.700000000000001V14.3A0.9 0.9 0 0 1 8.9 15.200000000000001H6.9A0.9 0.9 0 0 1 6.0 14.3V13.700000000000001A0.9 0.9 0 0 1 6.9 12.8Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'chart_bars': AppIconData(
    name: 'chart_bars',
    paths: [
      AppIconPathSpec(
        d: 'M6.0 13.2H7.200000000000001A1.6 1.6 0 0 1 8.8 14.799999999999999V18.0A1.6 1.6 0 0 1 7.200000000000001 19.6H6.0A1.6 1.6 0 0 1 4.4 18.0V14.799999999999999A1.6 1.6 0 0 1 6.0 13.2Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M11.4 9.2H12.600000000000001A1.6 1.6 0 0 1 14.200000000000001 10.799999999999999V18.0A1.6 1.6 0 0 1 12.600000000000001 19.6H11.4A1.6 1.6 0 0 1 9.8 18.0V10.799999999999999A1.6 1.6 0 0 1 11.4 9.2Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M16.8 5.2H18.0A1.6 1.6 0 0 1 19.6 6.800000000000001V18.0A1.6 1.6 0 0 1 18.0 19.6H16.8A1.6 1.6 0 0 1 15.2 18.0V6.800000000000001A1.6 1.6 0 0 1 16.8 5.2Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'chat_locked': AppIconData(
    name: 'chat_locked',
    paths: [
      AppIconPathSpec(
        d: 'M3.4 10.2V7.2a3.2 3.2 0 0 1 3.2-3.2h6a3.2 3.2 0 0 1 3.2 3.2v3a3.2 3.2 0 0 1-3.2 3.2H8.2L5.6 15.6v-2.4a3.2 3.2 0 0 1-2.2-3Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M14.2 18.4v-1a1.9 1.9 0 0 1 3.8 0v1',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M14.1 18.4H17.900000000000002A1.2 1.2 0 0 1 19.1 19.599999999999998V20.8A1.2 1.2 0 0 1 17.900000000000002 22.0H14.1A1.2 1.2 0 0 1 12.9 20.8V19.599999999999998A1.2 1.2 0 0 1 14.1 18.4Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'chat_unlocked': AppIconData(
    name: 'chat_unlocked',
    paths: [
      AppIconPathSpec(
        d: 'M3.4 10.2V7.2a3.2 3.2 0 0 1 3.2-3.2h6a3.2 3.2 0 0 1 3.2 3.2v3a3.2 3.2 0 0 1-3.2 3.2H8.2L5.6 15.6v-2.4a3.2 3.2 0 0 1-2.2-3Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M14.2 17.6v-1.5a1.9 1.9 0 0 1 3.5-1.1',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M14.1 17.6H17.900000000000002A1.2 1.2 0 0 1 19.1 18.8V20.000000000000004A1.2 1.2 0 0 1 17.900000000000002 21.200000000000003H14.1A1.2 1.2 0 0 1 12.9 20.000000000000004V18.8A1.2 1.2 0 0 1 14.1 17.6Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'check': AppIconData(
    name: 'check',
    paths: [
      AppIconPathSpec(
        d: 'M5.4 12.6 10.1 17.3 18.6 7.5',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'check_circle': AppIconData(
    name: 'check_circle',
    paths: [
      AppIconPathSpec(
        d: 'M3.5999999999999996 12.0A8.4 8.4 0 1 0 20.4 12.0A8.4 8.4 0 1 0 3.5999999999999996 12.0Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M8.3 12.3l2.6 2.6 4.9-5.5',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'chevron_left': AppIconData(
    name: 'chevron_left',
    paths: [
      AppIconPathSpec(
        d: 'M14.4 5.6 8.6 12 14.4 18.4',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'chevron_right': AppIconData(
    name: 'chevron_right',
    paths: [
      AppIconPathSpec(
        d: 'M9.6 5.6 15.4 12 9.6 18.4',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'close': AppIconData(
    name: 'close',
    paths: [
      AppIconPathSpec(
        d: 'M6.4 6.4 17.6 17.6M17.6 6.4 6.4 17.6',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'copy': AppIconData(
    name: 'copy',
    paths: [
      AppIconPathSpec(
        d: 'M9 3.6h9.4a2.4 2.4 0 0 1 2.4 2.4V15.4',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M6.0 8.4H13.0A2.6 2.6 0 0 1 15.6 11.0V18.0A2.6 2.6 0 0 1 13.0 20.6H6.0A2.6 2.6 0 0 1 3.4 18.0V11.0A2.6 2.6 0 0 1 6.0 8.4Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'cursor_tap': AppIconData(
    name: 'cursor_tap',
    duotone: true,
    paths: [
      AppIconPathSpec(
        d: 'M6.2 4.2 16.4 11.6 11.7 12.7 9.5 17.4z',
        paint: AppIconPaint.fill,
      ),
      AppIconPathSpec(
        d: 'M14.4 3.6v2.6M19.8 8.6h-2.6',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'emoji': AppIconData(
    name: 'emoji',
    duotone: true,
    paths: [
      AppIconPathSpec(
        d: 'M3.5999999999999996 12.0A8.4 8.4 0 1 0 20.4 12.0A8.4 8.4 0 1 0 3.5999999999999996 12.0Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M8.3 9.8A1.0 1.0 0 1 0 10.3 9.8A1.0 1.0 0 1 0 8.3 9.8Z',
        paint: AppIconPaint.fill,
      ),
      AppIconPathSpec(
        d: 'M13.7 9.8A1.0 1.0 0 1 0 15.7 9.8A1.0 1.0 0 1 0 13.7 9.8Z',
        paint: AppIconPaint.fill,
      ),
      AppIconPathSpec(
        d: 'M8.7 14.3a4.4 4.4 0 0 0 6.6 0',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'file_text': AppIconData(
    name: 'file_text',
    paths: [
      AppIconPathSpec(
        d: 'M13.6 3.6H7.6a2.4 2.4 0 0 0-2.4 2.4v12a2.4 2.4 0 0 0 2.4 2.4h8.8a2.4 2.4 0 0 0 2.4-2.4V8.6z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M13.6 3.6v3.6a1.4 1.4 0 0 0 1.4 1.4h3.8',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M9 12.6h6M9 15.8h4',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'filter': AppIconData(
    name: 'filter',
    paths: [
      AppIconPathSpec(
        d: 'M3.9 5.9h16.2l-6.4 7.6v4.8l-3.4 2.1v-6.9z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'fingerprint': AppIconData(
    name: 'fingerprint',
    paths: [
      AppIconPathSpec(
        d: 'M4.9 11.2a7.2 7.2 0 0 1 14.2 0',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M7.6 13.2a4.5 4.5 0 0 1 8.8 0',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M12 12.4v4.4',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M9.3 18.6a4.4 4.4 0 0 0 5.4-.2',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M6.9 15.8a4.4 4.4 0 0 0 .6 1.9',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'flag_milestone': AppIconData(
    name: 'flag_milestone',
    duotone: true,
    paths: [
      AppIconPathSpec(
        d: 'M6 20.4V3.8',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M6 4.6h10.9c1.1 0 1.7 1.3 1 2.2l-2.3 2.7 2.3 2.7c.7.9.1 2.2-1 2.2H6',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M5.0 20.4A1.0 1.0 0 1 0 7.0 20.4A1.0 1.0 0 1 0 5.0 20.4Z',
        paint: AppIconPaint.fill,
      ),
    ],
  ),
  'gift': AppIconData(
    name: 'gift',
    paths: [
      AppIconPathSpec(
        d: 'M5.3 8.4H18.7A1.5 1.5 0 0 1 20.2 9.9V10.7A1.5 1.5 0 0 1 18.7 12.2H5.3A1.5 1.5 0 0 1 3.8 10.7V9.9A1.5 1.5 0 0 1 5.3 8.4Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M5.6 12.2h12.8v5.6a2.4 2.4 0 0 1-2.4 2.4H8a2.4 2.4 0 0 1-2.4-2.4z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M12 8.4v11.8',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M12 8.3c-.8-2.4-2.1-3.6-3.4-3.6a1.85 1.85 0 0 0 0 3.7H12',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M12 8.3c.8-2.4 2.1-3.6 3.4-3.6a1.85 1.85 0 0 1 0 3.7H12',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'help_circle': AppIconData(
    name: 'help_circle',
    duotone: true,
    paths: [
      AppIconPathSpec(
        d: 'M3.5999999999999996 12.0A8.4 8.4 0 1 0 20.4 12.0A8.4 8.4 0 1 0 3.5999999999999996 12.0Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M9.5 9.7a2.7 2.7 0 0 1 5.2.9c0 1.8-2.6 2.2-2.6 3.9',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M11.05 17.2A0.95 0.95 0 1 0 12.95 17.2A0.95 0.95 0 1 0 11.05 17.2Z',
        paint: AppIconPaint.fill,
      ),
    ],
  ),
  'hourglass': AppIconData(
    name: 'hourglass',
    paths: [
      AppIconPathSpec(
        d: 'M6.6 3.8h10.8M6.6 20.2h10.8',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M7.8 3.8h8.4L12 10.8z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M7.8 20.2h8.4L12 13.2z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'inbox_empty': AppIconData(
    name: 'inbox_empty',
    paths: [
      AppIconPathSpec(
        d: 'M2.8 13.6v4.2A2.2 2.2 0 0 0 5 20h14a2.2 2.2 0 0 0 2.2-2.2v-4.2',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M4.6 13.6 7 5.3a1.6 1.6 0 0 1 1.5-1.1h7a1.6 1.6 0 0 1 1.5 1.1l2.4 8.3',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M2.8 13.6h4.6l1.3 2.6h6.6l1.3-2.6h4.6',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'info': AppIconData(
    name: 'info',
    duotone: true,
    paths: [
      AppIconPathSpec(
        d: 'M3.5999999999999996 12.0A8.4 8.4 0 1 0 20.4 12.0A8.4 8.4 0 1 0 3.5999999999999996 12.0Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M12 11.2v5.2',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M11.05 7.8A0.95 0.95 0 1 0 12.95 7.8A0.95 0.95 0 1 0 11.05 7.8Z',
        paint: AppIconPaint.fill,
      ),
    ],
  ),
  'link': AppIconData(
    name: 'link',
    paths: [
      AppIconPathSpec(
        d: 'M10.6 8.4H9a3.6 3.6 0 0 0 0 7.2h1.6',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M13.4 8.4H15a3.6 3.6 0 0 1 0 7.2h-1.6',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M8.4 12h7.2',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'lock': AppIconData(
    name: 'lock',
    duotone: true,
    paths: [
      AppIconPathSpec(
        d: 'M7.199999999999999 10.4H16.799999999999997A2.6 2.6 0 0 1 19.4 13.0V17.4A2.6 2.6 0 0 1 16.799999999999997 20.0H7.199999999999999A2.6 2.6 0 0 1 4.6 17.4V13.0A2.6 2.6 0 0 1 7.199999999999999 10.4Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M8.4 10.4V8a3.6 3.6 0 0 1 7.2 0v2.4',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M10.7 15.2A1.3 1.3 0 1 0 13.3 15.2A1.3 1.3 0 1 0 10.7 15.2Z',
        paint: AppIconPaint.fill,
      ),
    ],
  ),
  'log_out': AppIconData(
    name: 'log_out',
    paths: [
      AppIconPathSpec(
        d: 'M9.4 4.6H6.6a2.2 2.2 0 0 0-2.2 2.2v10.4a2.2 2.2 0 0 0 2.2 2.2h2.8',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M15 8.4 18.6 12 15 15.6',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M9.4 12h9.2',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'mic': AppIconData(
    name: 'mic',
    paths: [
      AppIconPathSpec(
        d: 'M12.0 3.4H12.0A2.2 2.2 0 0 1 14.200000000000001 5.6V11.600000000000001A2.2 2.2 0 0 1 12.0 13.8H12.0A2.2 2.2 0 0 1 9.8 11.600000000000001V5.6A2.2 2.2 0 0 1 12.0 3.4Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M6.4 11.4v.6a5.6 5.6 0 0 0 11.2 0v-.6',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M12 17.6v3',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'moon': AppIconData(
    name: 'moon',
    paths: [
      AppIconPathSpec(
        d: 'M20.2 14.6A8.6 8.6 0 1 1 9.4 3.8a6.8 6.8 0 0 0 10.8 10.8z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'more': AppIconData(
    name: 'more',
    paths: [
      AppIconPathSpec(
        d: 'M4.65 12.0A1.35 1.35 0 1 0 7.35 12.0A1.35 1.35 0 1 0 4.65 12.0Z',
        paint: AppIconPaint.fill,
      ),
      AppIconPathSpec(
        d: 'M10.65 12.0A1.35 1.35 0 1 0 13.35 12.0A1.35 1.35 0 1 0 10.65 12.0Z',
        paint: AppIconPaint.fill,
      ),
      AppIconPathSpec(
        d: 'M16.65 12.0A1.35 1.35 0 1 0 19.35 12.0A1.35 1.35 0 1 0 16.65 12.0Z',
        paint: AppIconPaint.fill,
      ),
    ],
  ),
  'nav_chat': AppIconData(
    name: 'nav_chat',
    duotone: true,
    paths: [
      AppIconPathSpec(
        d: 'M4.4 12.6V7.9a3.5 3.5 0 0 1 3.5-3.5h8.2a3.5 3.5 0 0 1 3.5 3.5v4.7a3.5 3.5 0 0 1-3.5 3.5h-4.5L7.9 19.9v-3.8a3.5 3.5 0 0 1-3.5-3.5Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M8.5 10.2A0.9 0.9 0 1 0 10.3 10.2A0.9 0.9 0 1 0 8.5 10.2Z',
        paint: AppIconPaint.fill,
      ),
      AppIconPathSpec(
        d: 'M11.1 10.2A0.9 0.9 0 1 0 12.9 10.2A0.9 0.9 0 1 0 11.1 10.2Z',
        paint: AppIconPaint.fill,
      ),
      AppIconPathSpec(
        d: 'M13.7 10.2A0.9 0.9 0 1 0 15.5 10.2A0.9 0.9 0 1 0 13.7 10.2Z',
        paint: AppIconPaint.fill,
      ),
    ],
  ),
  'nav_profile': AppIconData(
    name: 'nav_profile',
    paths: [
      AppIconPathSpec(
        d: 'M8.1 8.2A3.9 3.9 0 1 0 15.9 8.2A3.9 3.9 0 1 0 8.1 8.2Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M4.6 20.2c0-4.1 3.3-6.9 7.4-6.9s7.4 2.8 7.4 6.9',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'nav_referrals': AppIconData(
    name: 'nav_referrals',
    paths: [
      AppIconPathSpec(
        d: 'M5.3999999999999995 8.6A3.2 3.2 0 1 0 11.8 8.6A3.2 3.2 0 1 0 5.3999999999999995 8.6Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M2.8 19.6c0-3.1 2.6-5.6 5.8-5.6s5.8 2.5 5.8 5.6',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M15.8 5.6a3.2 3.2 0 0 1 0 6.3',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M17.4 14.4c2.2.6 3.8 2.5 3.8 5.2',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'nav_wallet': AppIconData(
    name: 'nav_wallet',
    duotone: true,
    paths: [
      AppIconPathSpec(
        d: 'M5.6 6.8h13.2a3.2 3.2 0 0 1 3.2 3.2v6a3.2 3.2 0 0 1-3.2 3.2H5.6A3.2 3.2 0 0 1 2.4 16v-6a3.2 3.2 0 0 1 3.2-3.2Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M21.6 10.4h-4.6a2.6 2.6 0 0 0 0 5.2h4.6',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M16.05 13.0A1.15 1.15 0 1 0 18.349999999999998 13.0A1.15 1.15 0 1 0 16.05 13.0Z',
        paint: AppIconPaint.fill,
      ),
    ],
  ),
  'network': AppIconData(
    name: 'network',
    paths: [
      AppIconPathSpec(
        d: 'M9.3 12.0A2.7 2.7 0 1 0 14.7 12.0A2.7 2.7 0 1 0 9.3 12.0Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M9.8 4.4A2.2 2.2 0 1 0 14.2 4.4A2.2 2.2 0 1 0 9.8 4.4Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M3.0 17.8A2.2 2.2 0 1 0 7.4 17.8A2.2 2.2 0 1 0 3.0 17.8Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M16.6 17.8A2.2 2.2 0 1 0 21.0 17.8A2.2 2.2 0 1 0 16.6 17.8Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M12 9.3V6.6M10.4 14.2 7.1 16.2M13.6 14.2l3.3 2',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'pin': AppIconData(
    name: 'pin',
    paths: [
      AppIconPathSpec(
        d: 'M9.2 3.8h5.6',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M9.9 3.8v2.8l-2.3 3.2h8.8l-2.3-3.2V3.8',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M12 9.8v10.4',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'plus_circle': AppIconData(
    name: 'plus_circle',
    paths: [
      AppIconPathSpec(
        d: 'M3.5999999999999996 12.0A8.4 8.4 0 1 0 20.4 12.0A8.4 8.4 0 1 0 3.5999999999999996 12.0Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M12 8.2v7.6M8.2 12h7.6',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'qr_code': AppIconData(
    name: 'qr_code',
    duotone: true,
    paths: [
      AppIconPathSpec(
        d: 'M5.3 3.6H8.100000000000001A1.7 1.7 0 0 1 9.8 5.3V8.100000000000001A1.7 1.7 0 0 1 8.100000000000001 9.8H5.3A1.7 1.7 0 0 1 3.6 8.100000000000001V5.3A1.7 1.7 0 0 1 5.3 3.6Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M6.1 5.6H7.3A0.5 0.5 0 0 1 7.8 6.1V7.3A0.5 0.5 0 0 1 7.3 7.8H6.1A0.5 0.5 0 0 1 5.6 7.3V6.1A0.5 0.5 0 0 1 6.1 5.6Z',
        paint: AppIconPaint.fill,
      ),
      AppIconPathSpec(
        d: 'M15.899999999999999 3.6H18.7A1.7 1.7 0 0 1 20.4 5.3V8.100000000000001A1.7 1.7 0 0 1 18.7 9.8H15.899999999999999A1.7 1.7 0 0 1 14.2 8.100000000000001V5.3A1.7 1.7 0 0 1 15.899999999999999 3.6Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M16.7 5.6H17.9A0.5 0.5 0 0 1 18.4 6.1V7.3A0.5 0.5 0 0 1 17.9 7.8H16.7A0.5 0.5 0 0 1 16.2 7.3V6.1A0.5 0.5 0 0 1 16.7 5.6Z',
        paint: AppIconPaint.fill,
      ),
      AppIconPathSpec(
        d: 'M5.3 14.2H8.100000000000001A1.7 1.7 0 0 1 9.8 15.899999999999999V18.7A1.7 1.7 0 0 1 8.100000000000001 20.4H5.3A1.7 1.7 0 0 1 3.6 18.7V15.899999999999999A1.7 1.7 0 0 1 5.3 14.2Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M6.1 16.2H7.3A0.5 0.5 0 0 1 7.8 16.7V17.9A0.5 0.5 0 0 1 7.3 18.4H6.1A0.5 0.5 0 0 1 5.6 17.9V16.7A0.5 0.5 0 0 1 6.1 16.2Z',
        paint: AppIconPaint.fill,
      ),
      AppIconPathSpec(
        d: 'M14.899999999999999 14.2H15.899999999999999A0.7 0.7 0 0 1 16.599999999999998 14.899999999999999V15.899999999999999A0.7 0.7 0 0 1 15.899999999999999 16.599999999999998H14.899999999999999A0.7 0.7 0 0 1 14.2 15.899999999999999V14.899999999999999A0.7 0.7 0 0 1 14.899999999999999 14.2Z',
        paint: AppIconPaint.fill,
      ),
      AppIconPathSpec(
        d: 'M18.9 14.2H19.9A0.7 0.7 0 0 1 20.599999999999998 14.899999999999999V15.899999999999999A0.7 0.7 0 0 1 19.9 16.599999999999998H18.9A0.7 0.7 0 0 1 18.2 15.899999999999999V14.899999999999999A0.7 0.7 0 0 1 18.9 14.2Z',
        paint: AppIconPaint.fill,
      ),
      AppIconPathSpec(
        d: 'M14.899999999999999 18.2H15.899999999999999A0.7 0.7 0 0 1 16.599999999999998 18.9V19.9A0.7 0.7 0 0 1 15.899999999999999 20.599999999999998H14.899999999999999A0.7 0.7 0 0 1 14.2 19.9V18.9A0.7 0.7 0 0 1 14.899999999999999 18.2Z',
        paint: AppIconPaint.fill,
      ),
      AppIconPathSpec(
        d: 'M18.2 19.4A1.2 1.2 0 1 0 20.599999999999998 19.4A1.2 1.2 0 1 0 18.2 19.4Z',
        paint: AppIconPaint.fill,
      ),
    ],
  ),
  'receipt': AppIconData(
    name: 'receipt',
    paths: [
      AppIconPathSpec(
        d: 'M5.6 3.8h12.8v16.4l-2.1-1.6-2.2 1.6-2.1-1.6-2.2 1.6-2.1-1.6-2.1 1.6z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M8.8 8.4h6.4M8.8 12h6.4',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'refresh': AppIconData(
    name: 'refresh',
    duotone: true,
    paths: [
      AppIconPathSpec(
        d: 'M12 4.5A7.5 7.5 0 1 0 19.5 12',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M9.6 2.4 15.2 4.8l-4.4 3z',
        paint: AppIconPaint.fill,
      ),
    ],
  ),
  'reply': AppIconData(
    name: 'reply',
    paths: [
      AppIconPathSpec(
        d: 'M9.6 7.4 5.2 11.8l4.4 4.4',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M5.2 11.8h9.4a5.4 5.4 0 0 1 5.4 5.4v.8',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'rotate_ccw': AppIconData(
    name: 'rotate_ccw',
    paths: [
      AppIconPathSpec(
        d: 'M4.8 10.4 9.2 6.2M4.8 10.4 9.2 14.6',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M5.4 10.4h7a4.8 4.8 0 0 1 0 9.6H9.6',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'rupee': AppIconData(
    name: 'rupee',
    paths: [
      AppIconPathSpec(
        d: 'M7 4.2h10M7 8.8h10',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M12.4 4.2c2.6 0 4.2 1.4 4.2 3.4s-1.6 3.4-4.2 3.4H7',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M8.6 11 16.4 20.4',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'search': AppIconData(
    name: 'search',
    paths: [
      AppIconPathSpec(
        d: 'M4.4 10.8A6.4 6.4 0 1 0 17.200000000000003 10.8A6.4 6.4 0 1 0 4.4 10.8Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M15.5 15.5 20 20',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'send': AppIconData(
    name: 'send',
    paths: [
      AppIconPathSpec(
        d: 'M20.8 4.2 3.9 10.5l6.5 2.4 2.5 6.9z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M20.8 4.2 10.4 12.9',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'share': AppIconData(
    name: 'share',
    paths: [
      AppIconPathSpec(
        d: 'M15.000000000000002 6.0A2.6 2.6 0 1 0 20.200000000000003 6.0A2.6 2.6 0 1 0 15.000000000000002 6.0Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M3.8000000000000003 12.0A2.6 2.6 0 1 0 9.0 12.0A2.6 2.6 0 1 0 3.8000000000000003 12.0Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M15.000000000000002 18.0A2.6 2.6 0 1 0 20.200000000000003 18.0A2.6 2.6 0 1 0 15.000000000000002 18.0Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M8.7 10.7 15.3 7.3M8.7 13.3 15.3 16.7',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'shield_check': AppIconData(
    name: 'shield_check',
    paths: [
      AppIconPathSpec(
        d: 'M12 3.4 19.4 6v5.6c0 4.4-3 7.7-7.4 9.1-4.4-1.4-7.4-4.7-7.4-9.1V6z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M9.4 11.9l1.9 1.9 3.5-3.8',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'sun': AppIconData(
    name: 'sun',
    paths: [
      AppIconPathSpec(
        d: 'M7.6 12.0A4.4 4.4 0 1 0 16.4 12.0A4.4 4.4 0 1 0 7.6 12.0Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M18.6 12h2M12 18.6v2M5.4 12h-2M12 5.4v-2',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M16.67 16.67l1.41 1.41M7.33 7.33 5.92 5.92M16.67 7.33l1.41-1.41M7.33 16.67l-1.41 1.41',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'theme_auto': AppIconData(
    name: 'theme_auto',
    duotone: true,
    paths: [
      AppIconPathSpec(
        d: 'M3.8000000000000007 12.0A8.2 8.2 0 1 0 20.2 12.0A8.2 8.2 0 1 0 3.8000000000000007 12.0Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M12 3.8a8.2 8.2 0 0 1 0 16.4z',
        paint: AppIconPaint.fill,
      ),
    ],
  ),
  'trash': AppIconData(
    name: 'trash',
    paths: [
      AppIconPathSpec(
        d: 'M4.6 7.4h14.8',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M9.6 7.4V5.8a1.4 1.4 0 0 1 1.4-1.4h2a1.4 1.4 0 0 1 1.4 1.4v1.6',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M6.6 7.4l.9 11.2a1.8 1.8 0 0 0 1.8 1.6h5.4a1.8 1.8 0 0 0 1.8-1.6l.9-11.2',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M10.2 11v5.4M13.8 11v5.4',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'trending_up': AppIconData(
    name: 'trending_up',
    paths: [
      AppIconPathSpec(
        d: 'M3.6 17.6 9.2 12l3.4 3.4L19 8.8',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M15.6 8.8H19v3.4',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'user_check': AppIconData(
    name: 'user_check',
    paths: [
      AppIconPathSpec(
        d: 'M6.0 8.6A3.4 3.4 0 1 0 12.8 8.6A3.4 3.4 0 1 0 6.0 8.6Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M3.2 19.8c0-3.4 2.8-6.2 6.2-6.2 1 0 2 .24 2.9.67',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M15.4 15.4l2.2 2.2 4-4.3',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'user_plus': AppIconData(
    name: 'user_plus',
    paths: [
      AppIconPathSpec(
        d: 'M6.199999999999999 8.6A3.4 3.4 0 1 0 13.0 8.6A3.4 3.4 0 1 0 6.199999999999999 8.6Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M3.4 19.8c0-3.4 2.8-6.2 6.2-6.2s6.2 2.8 6.2 6.2',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M18.2 8.2v5M15.7 10.7h5',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'wifi_off': AppIconData(
    name: 'wifi_off',
    duotone: true,
    paths: [
      AppIconPathSpec(
        d: 'M4.8 9.2a10 10 0 0 1 14.4 0',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M7.8 12.4a6 6 0 0 1 8.4 0',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M10.85 16.2A1.15 1.15 0 1 0 13.15 16.2A1.15 1.15 0 1 0 10.85 16.2Z',
        paint: AppIconPaint.fill,
      ),
      AppIconPathSpec(
        d: 'M4.4 4.4 19.6 19.6',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
  'x_circle': AppIconData(
    name: 'x_circle',
    paths: [
      AppIconPathSpec(
        d: 'M3.5999999999999996 12.0A8.4 8.4 0 1 0 20.4 12.0A8.4 8.4 0 1 0 3.5999999999999996 12.0Z',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
      AppIconPathSpec(
        d: 'M9.2 9.2 14.8 14.8M14.8 9.2 9.2 14.8',
        paint: AppIconPaint.stroke,
        strokeWidth: 1.6,
      ),
    ],
  ),
};

/// Manifest the generator reports against.
const String kIconManifestName = 'tool/icon_manifest.txt';
