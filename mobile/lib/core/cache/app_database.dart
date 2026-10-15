import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

part 'app_database.g.dart';

/// Local mirror of the Phase-1 backend.
///
/// The app is **local-first**: the UI reads from Drift and a repository layer
/// refreshes the mirror from `/v1/...`. Tables below intentionally mirror the
/// API shapes (not the SQL schema) so the mapper stays dumb and auditable.
///
/// Money is stored as **integer paise** — the API's exact wire format — never as
/// a double, matching the backend's `BigInt` discipline.
class WalletAccounts extends Table {
  TextColumn get userId => text()();
  TextColumn get currency => text().withDefault(const Constant('INR'))();

  /// Buckets exactly as the API reports them (`pendingMinorUnits`, …).
  IntColumn get pendingMinorUnits => integer().withDefault(const Constant(0))();
  IntColumn get availableMinorUnits => integer().withDefault(const Constant(0))();
  IntColumn get reservedMinorUnits => integer().withDefault(const Constant(0))();
  IntColumn get withdrawnMinorUnits => integer().withDefault(const Constant(0))();

  DateTimeColumn get updatedAt => dateTime()();
  DateTimeColumn get serverUpdatedAt => dateTime().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {userId};
}

class LedgerEntries extends Table {
  TextColumn get id => text()();
  TextColumn get userId => text()();
  TextColumn get transactionType => text()();
  TextColumn get referenceType => text().nullable()();
  TextColumn get referenceId => text().nullable()();

  /// Positive for credits, negative for debits — both in paise.
  IntColumn get amountMinorUnits => integer()();
  TextColumn get bucket => text()();

  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {id};

  @override
  List<String> get customConstraints => ['UNIQUE (user_id, transaction_type, reference_id)'];
}

class ReferralCodes extends Table {
  TextColumn get id => text()();
  TextColumn get ownerUserId => text()();
  TextColumn get publicCode => text().unique()();
  TextColumn get shareUrl => text()();
  TextColumn get state => text()();
  BoolColumn get isActive => boolean().withDefault(const Constant(true))();
  DateTimeColumn get expiresAt => dateTime().nullable()();
  IntColumn get clickCount => integer().withDefault(const Constant(0))();
  IntColumn get uniqueClickCount => integer().withDefault(const Constant(0))();
  IntColumn get referralCount => integer().withDefault(const Constant(0))();
  IntColumn get conversionCount => integer().withDefault(const Constant(0))();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class ReferralItems extends Table {
  TextColumn get id => text()();
  TextColumn get publicCode => text()();
  TextColumn get referrerUserId => text()();
  TextColumn get referredUserId => text()();
  TextColumn get attributionStatus => text()();
  TextColumn get currentMilestone => text()();
  TextColumn get chatAccessState => text()();
  DateTimeColumn get attributedAt => dateTime()();
  DateTimeColumn get signedUpAt => dateTime().nullable()();
  DateTimeColumn get installLoginVerifiedAt => dateTime().nullable()();
  DateTimeColumn get chatUnlockedAt => dateTime().nullable()();
  DateTimeColumn get cachedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class PayoutRequests extends Table {
  TextColumn get id => text()();
  TextColumn get userId => text()();
  IntColumn get amountMinorUnits => integer()();
  TextColumn get status => text()();
  TextColumn get paymentUtr => text().nullable()();
  DateTimeColumn get requestedAt => dateTime()();
  DateTimeColumn get reviewedAt => dateTime().nullable()();
  DateTimeColumn get completedAt => dateTime().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

/// Simple key/value bag for session bits that must survive a restart
/// (selected nav tab, onboarding-seen flags, last sync cursor).
class AppPreferences extends Table {
  TextColumn get key => text()();
  TextColumn get value => text()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {key};
}

@DriftDatabase(tables: [WalletAccounts, LedgerEntries, ReferralCodes, ReferralItems, PayoutRequests, AppPreferences])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  /// In-memory constructor for tests.
  AppDatabase.forTesting(super.executor);

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) async => m.createAll(),
        beforeOpen: (details) async {
          await customStatement('PRAGMA foreign_keys = ON');
        },
      );

  static QueryExecutor _openConnection() => driftDatabase(
        name: 'andos_referral',
        native: const DriftNativeOptions(),
      );
}
