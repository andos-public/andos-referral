import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../cache/app_database.dart';
import '../haptics/app_haptics.dart';

/// Local database (Drift). One instance per app run; tests override it with
/// `AppDatabase.forTesting(NativeDatabase.memory())`.
final appDatabaseProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(db.close);
  return db;
});

/// Theme mode — persisted later through `AppPreferences`; system default today.
final themeModeProvider = NotifierProvider<ThemeModeNotifier, ThemeMode>(ThemeModeNotifier.new);

class ThemeModeNotifier extends Notifier<ThemeMode> {
  @override
  ThemeMode build() => ThemeMode.system;

  void set(ThemeMode mode) => state = mode;

  void toggle() => state = state == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
}

/// Haptics master switch (in-app setting; also flipped off by tests).
final hapticsEnabledProvider = NotifierProvider<HapticsNotifier, bool>(HapticsNotifier.new);

class HapticsNotifier extends Notifier<bool> {
  @override
  bool build() {
    AppHaptics.setEnabled(true);
    return true;
  }

  void set(bool enabled) {
    AppHaptics.setEnabled(enabled);
    state = enabled;
  }
}
