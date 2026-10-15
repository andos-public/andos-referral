// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $WalletAccountsTable extends WalletAccounts
    with TableInfo<$WalletAccountsTable, WalletAccount> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $WalletAccountsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _userIdMeta = const VerificationMeta('userId');
  @override
  late final GeneratedColumn<String> userId = GeneratedColumn<String>(
    'user_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _currencyMeta = const VerificationMeta(
    'currency',
  );
  @override
  late final GeneratedColumn<String> currency = GeneratedColumn<String>(
    'currency',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('INR'),
  );
  static const VerificationMeta _pendingMinorUnitsMeta = const VerificationMeta(
    'pendingMinorUnits',
  );
  @override
  late final GeneratedColumn<int> pendingMinorUnits = GeneratedColumn<int>(
    'pending_minor_units',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _availableMinorUnitsMeta =
      const VerificationMeta('availableMinorUnits');
  @override
  late final GeneratedColumn<int> availableMinorUnits = GeneratedColumn<int>(
    'available_minor_units',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _reservedMinorUnitsMeta =
      const VerificationMeta('reservedMinorUnits');
  @override
  late final GeneratedColumn<int> reservedMinorUnits = GeneratedColumn<int>(
    'reserved_minor_units',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _withdrawnMinorUnitsMeta =
      const VerificationMeta('withdrawnMinorUnits');
  @override
  late final GeneratedColumn<int> withdrawnMinorUnits = GeneratedColumn<int>(
    'withdrawn_minor_units',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _serverUpdatedAtMeta = const VerificationMeta(
    'serverUpdatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> serverUpdatedAt =
      GeneratedColumn<DateTime>(
        'server_updated_at',
        aliasedName,
        true,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  @override
  List<GeneratedColumn> get $columns => [
    userId,
    currency,
    pendingMinorUnits,
    availableMinorUnits,
    reservedMinorUnits,
    withdrawnMinorUnits,
    updatedAt,
    serverUpdatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'wallet_accounts';
  @override
  VerificationContext validateIntegrity(
    Insertable<WalletAccount> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('user_id')) {
      context.handle(
        _userIdMeta,
        userId.isAcceptableOrUnknown(data['user_id']!, _userIdMeta),
      );
    } else if (isInserting) {
      context.missing(_userIdMeta);
    }
    if (data.containsKey('currency')) {
      context.handle(
        _currencyMeta,
        currency.isAcceptableOrUnknown(data['currency']!, _currencyMeta),
      );
    }
    if (data.containsKey('pending_minor_units')) {
      context.handle(
        _pendingMinorUnitsMeta,
        pendingMinorUnits.isAcceptableOrUnknown(
          data['pending_minor_units']!,
          _pendingMinorUnitsMeta,
        ),
      );
    }
    if (data.containsKey('available_minor_units')) {
      context.handle(
        _availableMinorUnitsMeta,
        availableMinorUnits.isAcceptableOrUnknown(
          data['available_minor_units']!,
          _availableMinorUnitsMeta,
        ),
      );
    }
    if (data.containsKey('reserved_minor_units')) {
      context.handle(
        _reservedMinorUnitsMeta,
        reservedMinorUnits.isAcceptableOrUnknown(
          data['reserved_minor_units']!,
          _reservedMinorUnitsMeta,
        ),
      );
    }
    if (data.containsKey('withdrawn_minor_units')) {
      context.handle(
        _withdrawnMinorUnitsMeta,
        withdrawnMinorUnits.isAcceptableOrUnknown(
          data['withdrawn_minor_units']!,
          _withdrawnMinorUnitsMeta,
        ),
      );
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    if (data.containsKey('server_updated_at')) {
      context.handle(
        _serverUpdatedAtMeta,
        serverUpdatedAt.isAcceptableOrUnknown(
          data['server_updated_at']!,
          _serverUpdatedAtMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {userId};
  @override
  WalletAccount map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return WalletAccount(
      userId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}user_id'],
      )!,
      currency: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}currency'],
      )!,
      pendingMinorUnits: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}pending_minor_units'],
      )!,
      availableMinorUnits: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}available_minor_units'],
      )!,
      reservedMinorUnits: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}reserved_minor_units'],
      )!,
      withdrawnMinorUnits: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}withdrawn_minor_units'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
      serverUpdatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}server_updated_at'],
      ),
    );
  }

  @override
  $WalletAccountsTable createAlias(String alias) {
    return $WalletAccountsTable(attachedDatabase, alias);
  }
}

class WalletAccount extends DataClass implements Insertable<WalletAccount> {
  final String userId;
  final String currency;

  /// Buckets exactly as the API reports them (`pendingMinorUnits`, …).
  final int pendingMinorUnits;
  final int availableMinorUnits;
  final int reservedMinorUnits;
  final int withdrawnMinorUnits;
  final DateTime updatedAt;
  final DateTime? serverUpdatedAt;
  const WalletAccount({
    required this.userId,
    required this.currency,
    required this.pendingMinorUnits,
    required this.availableMinorUnits,
    required this.reservedMinorUnits,
    required this.withdrawnMinorUnits,
    required this.updatedAt,
    this.serverUpdatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['user_id'] = Variable<String>(userId);
    map['currency'] = Variable<String>(currency);
    map['pending_minor_units'] = Variable<int>(pendingMinorUnits);
    map['available_minor_units'] = Variable<int>(availableMinorUnits);
    map['reserved_minor_units'] = Variable<int>(reservedMinorUnits);
    map['withdrawn_minor_units'] = Variable<int>(withdrawnMinorUnits);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    if (!nullToAbsent || serverUpdatedAt != null) {
      map['server_updated_at'] = Variable<DateTime>(serverUpdatedAt);
    }
    return map;
  }

  WalletAccountsCompanion toCompanion(bool nullToAbsent) {
    return WalletAccountsCompanion(
      userId: Value(userId),
      currency: Value(currency),
      pendingMinorUnits: Value(pendingMinorUnits),
      availableMinorUnits: Value(availableMinorUnits),
      reservedMinorUnits: Value(reservedMinorUnits),
      withdrawnMinorUnits: Value(withdrawnMinorUnits),
      updatedAt: Value(updatedAt),
      serverUpdatedAt: serverUpdatedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(serverUpdatedAt),
    );
  }

  factory WalletAccount.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return WalletAccount(
      userId: serializer.fromJson<String>(json['userId']),
      currency: serializer.fromJson<String>(json['currency']),
      pendingMinorUnits: serializer.fromJson<int>(json['pendingMinorUnits']),
      availableMinorUnits: serializer.fromJson<int>(
        json['availableMinorUnits'],
      ),
      reservedMinorUnits: serializer.fromJson<int>(json['reservedMinorUnits']),
      withdrawnMinorUnits: serializer.fromJson<int>(
        json['withdrawnMinorUnits'],
      ),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      serverUpdatedAt: serializer.fromJson<DateTime?>(json['serverUpdatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'userId': serializer.toJson<String>(userId),
      'currency': serializer.toJson<String>(currency),
      'pendingMinorUnits': serializer.toJson<int>(pendingMinorUnits),
      'availableMinorUnits': serializer.toJson<int>(availableMinorUnits),
      'reservedMinorUnits': serializer.toJson<int>(reservedMinorUnits),
      'withdrawnMinorUnits': serializer.toJson<int>(withdrawnMinorUnits),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'serverUpdatedAt': serializer.toJson<DateTime?>(serverUpdatedAt),
    };
  }

  WalletAccount copyWith({
    String? userId,
    String? currency,
    int? pendingMinorUnits,
    int? availableMinorUnits,
    int? reservedMinorUnits,
    int? withdrawnMinorUnits,
    DateTime? updatedAt,
    Value<DateTime?> serverUpdatedAt = const Value.absent(),
  }) => WalletAccount(
    userId: userId ?? this.userId,
    currency: currency ?? this.currency,
    pendingMinorUnits: pendingMinorUnits ?? this.pendingMinorUnits,
    availableMinorUnits: availableMinorUnits ?? this.availableMinorUnits,
    reservedMinorUnits: reservedMinorUnits ?? this.reservedMinorUnits,
    withdrawnMinorUnits: withdrawnMinorUnits ?? this.withdrawnMinorUnits,
    updatedAt: updatedAt ?? this.updatedAt,
    serverUpdatedAt: serverUpdatedAt.present
        ? serverUpdatedAt.value
        : this.serverUpdatedAt,
  );
  WalletAccount copyWithCompanion(WalletAccountsCompanion data) {
    return WalletAccount(
      userId: data.userId.present ? data.userId.value : this.userId,
      currency: data.currency.present ? data.currency.value : this.currency,
      pendingMinorUnits: data.pendingMinorUnits.present
          ? data.pendingMinorUnits.value
          : this.pendingMinorUnits,
      availableMinorUnits: data.availableMinorUnits.present
          ? data.availableMinorUnits.value
          : this.availableMinorUnits,
      reservedMinorUnits: data.reservedMinorUnits.present
          ? data.reservedMinorUnits.value
          : this.reservedMinorUnits,
      withdrawnMinorUnits: data.withdrawnMinorUnits.present
          ? data.withdrawnMinorUnits.value
          : this.withdrawnMinorUnits,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      serverUpdatedAt: data.serverUpdatedAt.present
          ? data.serverUpdatedAt.value
          : this.serverUpdatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('WalletAccount(')
          ..write('userId: $userId, ')
          ..write('currency: $currency, ')
          ..write('pendingMinorUnits: $pendingMinorUnits, ')
          ..write('availableMinorUnits: $availableMinorUnits, ')
          ..write('reservedMinorUnits: $reservedMinorUnits, ')
          ..write('withdrawnMinorUnits: $withdrawnMinorUnits, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('serverUpdatedAt: $serverUpdatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    userId,
    currency,
    pendingMinorUnits,
    availableMinorUnits,
    reservedMinorUnits,
    withdrawnMinorUnits,
    updatedAt,
    serverUpdatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is WalletAccount &&
          other.userId == this.userId &&
          other.currency == this.currency &&
          other.pendingMinorUnits == this.pendingMinorUnits &&
          other.availableMinorUnits == this.availableMinorUnits &&
          other.reservedMinorUnits == this.reservedMinorUnits &&
          other.withdrawnMinorUnits == this.withdrawnMinorUnits &&
          other.updatedAt == this.updatedAt &&
          other.serverUpdatedAt == this.serverUpdatedAt);
}

class WalletAccountsCompanion extends UpdateCompanion<WalletAccount> {
  final Value<String> userId;
  final Value<String> currency;
  final Value<int> pendingMinorUnits;
  final Value<int> availableMinorUnits;
  final Value<int> reservedMinorUnits;
  final Value<int> withdrawnMinorUnits;
  final Value<DateTime> updatedAt;
  final Value<DateTime?> serverUpdatedAt;
  final Value<int> rowid;
  const WalletAccountsCompanion({
    this.userId = const Value.absent(),
    this.currency = const Value.absent(),
    this.pendingMinorUnits = const Value.absent(),
    this.availableMinorUnits = const Value.absent(),
    this.reservedMinorUnits = const Value.absent(),
    this.withdrawnMinorUnits = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.serverUpdatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  WalletAccountsCompanion.insert({
    required String userId,
    this.currency = const Value.absent(),
    this.pendingMinorUnits = const Value.absent(),
    this.availableMinorUnits = const Value.absent(),
    this.reservedMinorUnits = const Value.absent(),
    this.withdrawnMinorUnits = const Value.absent(),
    required DateTime updatedAt,
    this.serverUpdatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : userId = Value(userId),
       updatedAt = Value(updatedAt);
  static Insertable<WalletAccount> custom({
    Expression<String>? userId,
    Expression<String>? currency,
    Expression<int>? pendingMinorUnits,
    Expression<int>? availableMinorUnits,
    Expression<int>? reservedMinorUnits,
    Expression<int>? withdrawnMinorUnits,
    Expression<DateTime>? updatedAt,
    Expression<DateTime>? serverUpdatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (userId != null) 'user_id': userId,
      if (currency != null) 'currency': currency,
      if (pendingMinorUnits != null) 'pending_minor_units': pendingMinorUnits,
      if (availableMinorUnits != null)
        'available_minor_units': availableMinorUnits,
      if (reservedMinorUnits != null)
        'reserved_minor_units': reservedMinorUnits,
      if (withdrawnMinorUnits != null)
        'withdrawn_minor_units': withdrawnMinorUnits,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (serverUpdatedAt != null) 'server_updated_at': serverUpdatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  WalletAccountsCompanion copyWith({
    Value<String>? userId,
    Value<String>? currency,
    Value<int>? pendingMinorUnits,
    Value<int>? availableMinorUnits,
    Value<int>? reservedMinorUnits,
    Value<int>? withdrawnMinorUnits,
    Value<DateTime>? updatedAt,
    Value<DateTime?>? serverUpdatedAt,
    Value<int>? rowid,
  }) {
    return WalletAccountsCompanion(
      userId: userId ?? this.userId,
      currency: currency ?? this.currency,
      pendingMinorUnits: pendingMinorUnits ?? this.pendingMinorUnits,
      availableMinorUnits: availableMinorUnits ?? this.availableMinorUnits,
      reservedMinorUnits: reservedMinorUnits ?? this.reservedMinorUnits,
      withdrawnMinorUnits: withdrawnMinorUnits ?? this.withdrawnMinorUnits,
      updatedAt: updatedAt ?? this.updatedAt,
      serverUpdatedAt: serverUpdatedAt ?? this.serverUpdatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (userId.present) {
      map['user_id'] = Variable<String>(userId.value);
    }
    if (currency.present) {
      map['currency'] = Variable<String>(currency.value);
    }
    if (pendingMinorUnits.present) {
      map['pending_minor_units'] = Variable<int>(pendingMinorUnits.value);
    }
    if (availableMinorUnits.present) {
      map['available_minor_units'] = Variable<int>(availableMinorUnits.value);
    }
    if (reservedMinorUnits.present) {
      map['reserved_minor_units'] = Variable<int>(reservedMinorUnits.value);
    }
    if (withdrawnMinorUnits.present) {
      map['withdrawn_minor_units'] = Variable<int>(withdrawnMinorUnits.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (serverUpdatedAt.present) {
      map['server_updated_at'] = Variable<DateTime>(serverUpdatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('WalletAccountsCompanion(')
          ..write('userId: $userId, ')
          ..write('currency: $currency, ')
          ..write('pendingMinorUnits: $pendingMinorUnits, ')
          ..write('availableMinorUnits: $availableMinorUnits, ')
          ..write('reservedMinorUnits: $reservedMinorUnits, ')
          ..write('withdrawnMinorUnits: $withdrawnMinorUnits, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('serverUpdatedAt: $serverUpdatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LedgerEntriesTable extends LedgerEntries
    with TableInfo<$LedgerEntriesTable, LedgerEntry> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LedgerEntriesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _userIdMeta = const VerificationMeta('userId');
  @override
  late final GeneratedColumn<String> userId = GeneratedColumn<String>(
    'user_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _transactionTypeMeta = const VerificationMeta(
    'transactionType',
  );
  @override
  late final GeneratedColumn<String> transactionType = GeneratedColumn<String>(
    'transaction_type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _referenceTypeMeta = const VerificationMeta(
    'referenceType',
  );
  @override
  late final GeneratedColumn<String> referenceType = GeneratedColumn<String>(
    'reference_type',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _referenceIdMeta = const VerificationMeta(
    'referenceId',
  );
  @override
  late final GeneratedColumn<String> referenceId = GeneratedColumn<String>(
    'reference_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _amountMinorUnitsMeta = const VerificationMeta(
    'amountMinorUnits',
  );
  @override
  late final GeneratedColumn<int> amountMinorUnits = GeneratedColumn<int>(
    'amount_minor_units',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _bucketMeta = const VerificationMeta('bucket');
  @override
  late final GeneratedColumn<String> bucket = GeneratedColumn<String>(
    'bucket',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    userId,
    transactionType,
    referenceType,
    referenceId,
    amountMinorUnits,
    bucket,
    createdAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'ledger_entries';
  @override
  VerificationContext validateIntegrity(
    Insertable<LedgerEntry> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('user_id')) {
      context.handle(
        _userIdMeta,
        userId.isAcceptableOrUnknown(data['user_id']!, _userIdMeta),
      );
    } else if (isInserting) {
      context.missing(_userIdMeta);
    }
    if (data.containsKey('transaction_type')) {
      context.handle(
        _transactionTypeMeta,
        transactionType.isAcceptableOrUnknown(
          data['transaction_type']!,
          _transactionTypeMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_transactionTypeMeta);
    }
    if (data.containsKey('reference_type')) {
      context.handle(
        _referenceTypeMeta,
        referenceType.isAcceptableOrUnknown(
          data['reference_type']!,
          _referenceTypeMeta,
        ),
      );
    }
    if (data.containsKey('reference_id')) {
      context.handle(
        _referenceIdMeta,
        referenceId.isAcceptableOrUnknown(
          data['reference_id']!,
          _referenceIdMeta,
        ),
      );
    }
    if (data.containsKey('amount_minor_units')) {
      context.handle(
        _amountMinorUnitsMeta,
        amountMinorUnits.isAcceptableOrUnknown(
          data['amount_minor_units']!,
          _amountMinorUnitsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_amountMinorUnitsMeta);
    }
    if (data.containsKey('bucket')) {
      context.handle(
        _bucketMeta,
        bucket.isAcceptableOrUnknown(data['bucket']!, _bucketMeta),
      );
    } else if (isInserting) {
      context.missing(_bucketMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LedgerEntry map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LedgerEntry(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      userId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}user_id'],
      )!,
      transactionType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}transaction_type'],
      )!,
      referenceType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}reference_type'],
      ),
      referenceId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}reference_id'],
      ),
      amountMinorUnits: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}amount_minor_units'],
      )!,
      bucket: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}bucket'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
    );
  }

  @override
  $LedgerEntriesTable createAlias(String alias) {
    return $LedgerEntriesTable(attachedDatabase, alias);
  }
}

class LedgerEntry extends DataClass implements Insertable<LedgerEntry> {
  final String id;
  final String userId;
  final String transactionType;
  final String? referenceType;
  final String? referenceId;

  /// Positive for credits, negative for debits — both in paise.
  final int amountMinorUnits;
  final String bucket;
  final DateTime createdAt;
  const LedgerEntry({
    required this.id,
    required this.userId,
    required this.transactionType,
    this.referenceType,
    this.referenceId,
    required this.amountMinorUnits,
    required this.bucket,
    required this.createdAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['user_id'] = Variable<String>(userId);
    map['transaction_type'] = Variable<String>(transactionType);
    if (!nullToAbsent || referenceType != null) {
      map['reference_type'] = Variable<String>(referenceType);
    }
    if (!nullToAbsent || referenceId != null) {
      map['reference_id'] = Variable<String>(referenceId);
    }
    map['amount_minor_units'] = Variable<int>(amountMinorUnits);
    map['bucket'] = Variable<String>(bucket);
    map['created_at'] = Variable<DateTime>(createdAt);
    return map;
  }

  LedgerEntriesCompanion toCompanion(bool nullToAbsent) {
    return LedgerEntriesCompanion(
      id: Value(id),
      userId: Value(userId),
      transactionType: Value(transactionType),
      referenceType: referenceType == null && nullToAbsent
          ? const Value.absent()
          : Value(referenceType),
      referenceId: referenceId == null && nullToAbsent
          ? const Value.absent()
          : Value(referenceId),
      amountMinorUnits: Value(amountMinorUnits),
      bucket: Value(bucket),
      createdAt: Value(createdAt),
    );
  }

  factory LedgerEntry.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LedgerEntry(
      id: serializer.fromJson<String>(json['id']),
      userId: serializer.fromJson<String>(json['userId']),
      transactionType: serializer.fromJson<String>(json['transactionType']),
      referenceType: serializer.fromJson<String?>(json['referenceType']),
      referenceId: serializer.fromJson<String?>(json['referenceId']),
      amountMinorUnits: serializer.fromJson<int>(json['amountMinorUnits']),
      bucket: serializer.fromJson<String>(json['bucket']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'userId': serializer.toJson<String>(userId),
      'transactionType': serializer.toJson<String>(transactionType),
      'referenceType': serializer.toJson<String?>(referenceType),
      'referenceId': serializer.toJson<String?>(referenceId),
      'amountMinorUnits': serializer.toJson<int>(amountMinorUnits),
      'bucket': serializer.toJson<String>(bucket),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  LedgerEntry copyWith({
    String? id,
    String? userId,
    String? transactionType,
    Value<String?> referenceType = const Value.absent(),
    Value<String?> referenceId = const Value.absent(),
    int? amountMinorUnits,
    String? bucket,
    DateTime? createdAt,
  }) => LedgerEntry(
    id: id ?? this.id,
    userId: userId ?? this.userId,
    transactionType: transactionType ?? this.transactionType,
    referenceType: referenceType.present
        ? referenceType.value
        : this.referenceType,
    referenceId: referenceId.present ? referenceId.value : this.referenceId,
    amountMinorUnits: amountMinorUnits ?? this.amountMinorUnits,
    bucket: bucket ?? this.bucket,
    createdAt: createdAt ?? this.createdAt,
  );
  LedgerEntry copyWithCompanion(LedgerEntriesCompanion data) {
    return LedgerEntry(
      id: data.id.present ? data.id.value : this.id,
      userId: data.userId.present ? data.userId.value : this.userId,
      transactionType: data.transactionType.present
          ? data.transactionType.value
          : this.transactionType,
      referenceType: data.referenceType.present
          ? data.referenceType.value
          : this.referenceType,
      referenceId: data.referenceId.present
          ? data.referenceId.value
          : this.referenceId,
      amountMinorUnits: data.amountMinorUnits.present
          ? data.amountMinorUnits.value
          : this.amountMinorUnits,
      bucket: data.bucket.present ? data.bucket.value : this.bucket,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LedgerEntry(')
          ..write('id: $id, ')
          ..write('userId: $userId, ')
          ..write('transactionType: $transactionType, ')
          ..write('referenceType: $referenceType, ')
          ..write('referenceId: $referenceId, ')
          ..write('amountMinorUnits: $amountMinorUnits, ')
          ..write('bucket: $bucket, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    userId,
    transactionType,
    referenceType,
    referenceId,
    amountMinorUnits,
    bucket,
    createdAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LedgerEntry &&
          other.id == this.id &&
          other.userId == this.userId &&
          other.transactionType == this.transactionType &&
          other.referenceType == this.referenceType &&
          other.referenceId == this.referenceId &&
          other.amountMinorUnits == this.amountMinorUnits &&
          other.bucket == this.bucket &&
          other.createdAt == this.createdAt);
}

class LedgerEntriesCompanion extends UpdateCompanion<LedgerEntry> {
  final Value<String> id;
  final Value<String> userId;
  final Value<String> transactionType;
  final Value<String?> referenceType;
  final Value<String?> referenceId;
  final Value<int> amountMinorUnits;
  final Value<String> bucket;
  final Value<DateTime> createdAt;
  final Value<int> rowid;
  const LedgerEntriesCompanion({
    this.id = const Value.absent(),
    this.userId = const Value.absent(),
    this.transactionType = const Value.absent(),
    this.referenceType = const Value.absent(),
    this.referenceId = const Value.absent(),
    this.amountMinorUnits = const Value.absent(),
    this.bucket = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LedgerEntriesCompanion.insert({
    required String id,
    required String userId,
    required String transactionType,
    this.referenceType = const Value.absent(),
    this.referenceId = const Value.absent(),
    required int amountMinorUnits,
    required String bucket,
    required DateTime createdAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       userId = Value(userId),
       transactionType = Value(transactionType),
       amountMinorUnits = Value(amountMinorUnits),
       bucket = Value(bucket),
       createdAt = Value(createdAt);
  static Insertable<LedgerEntry> custom({
    Expression<String>? id,
    Expression<String>? userId,
    Expression<String>? transactionType,
    Expression<String>? referenceType,
    Expression<String>? referenceId,
    Expression<int>? amountMinorUnits,
    Expression<String>? bucket,
    Expression<DateTime>? createdAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (userId != null) 'user_id': userId,
      if (transactionType != null) 'transaction_type': transactionType,
      if (referenceType != null) 'reference_type': referenceType,
      if (referenceId != null) 'reference_id': referenceId,
      if (amountMinorUnits != null) 'amount_minor_units': amountMinorUnits,
      if (bucket != null) 'bucket': bucket,
      if (createdAt != null) 'created_at': createdAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LedgerEntriesCompanion copyWith({
    Value<String>? id,
    Value<String>? userId,
    Value<String>? transactionType,
    Value<String?>? referenceType,
    Value<String?>? referenceId,
    Value<int>? amountMinorUnits,
    Value<String>? bucket,
    Value<DateTime>? createdAt,
    Value<int>? rowid,
  }) {
    return LedgerEntriesCompanion(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      transactionType: transactionType ?? this.transactionType,
      referenceType: referenceType ?? this.referenceType,
      referenceId: referenceId ?? this.referenceId,
      amountMinorUnits: amountMinorUnits ?? this.amountMinorUnits,
      bucket: bucket ?? this.bucket,
      createdAt: createdAt ?? this.createdAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (userId.present) {
      map['user_id'] = Variable<String>(userId.value);
    }
    if (transactionType.present) {
      map['transaction_type'] = Variable<String>(transactionType.value);
    }
    if (referenceType.present) {
      map['reference_type'] = Variable<String>(referenceType.value);
    }
    if (referenceId.present) {
      map['reference_id'] = Variable<String>(referenceId.value);
    }
    if (amountMinorUnits.present) {
      map['amount_minor_units'] = Variable<int>(amountMinorUnits.value);
    }
    if (bucket.present) {
      map['bucket'] = Variable<String>(bucket.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LedgerEntriesCompanion(')
          ..write('id: $id, ')
          ..write('userId: $userId, ')
          ..write('transactionType: $transactionType, ')
          ..write('referenceType: $referenceType, ')
          ..write('referenceId: $referenceId, ')
          ..write('amountMinorUnits: $amountMinorUnits, ')
          ..write('bucket: $bucket, ')
          ..write('createdAt: $createdAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $ReferralCodesTable extends ReferralCodes
    with TableInfo<$ReferralCodesTable, ReferralCode> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $ReferralCodesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _ownerUserIdMeta = const VerificationMeta(
    'ownerUserId',
  );
  @override
  late final GeneratedColumn<String> ownerUserId = GeneratedColumn<String>(
    'owner_user_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _publicCodeMeta = const VerificationMeta(
    'publicCode',
  );
  @override
  late final GeneratedColumn<String> publicCode = GeneratedColumn<String>(
    'public_code',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways('UNIQUE'),
  );
  static const VerificationMeta _shareUrlMeta = const VerificationMeta(
    'shareUrl',
  );
  @override
  late final GeneratedColumn<String> shareUrl = GeneratedColumn<String>(
    'share_url',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _stateMeta = const VerificationMeta('state');
  @override
  late final GeneratedColumn<String> state = GeneratedColumn<String>(
    'state',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _isActiveMeta = const VerificationMeta(
    'isActive',
  );
  @override
  late final GeneratedColumn<bool> isActive = GeneratedColumn<bool>(
    'is_active',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_active" IN (0, 1))',
    ),
    defaultValue: const Constant(true),
  );
  static const VerificationMeta _expiresAtMeta = const VerificationMeta(
    'expiresAt',
  );
  @override
  late final GeneratedColumn<DateTime> expiresAt = GeneratedColumn<DateTime>(
    'expires_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _clickCountMeta = const VerificationMeta(
    'clickCount',
  );
  @override
  late final GeneratedColumn<int> clickCount = GeneratedColumn<int>(
    'click_count',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _uniqueClickCountMeta = const VerificationMeta(
    'uniqueClickCount',
  );
  @override
  late final GeneratedColumn<int> uniqueClickCount = GeneratedColumn<int>(
    'unique_click_count',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _referralCountMeta = const VerificationMeta(
    'referralCount',
  );
  @override
  late final GeneratedColumn<int> referralCount = GeneratedColumn<int>(
    'referral_count',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _conversionCountMeta = const VerificationMeta(
    'conversionCount',
  );
  @override
  late final GeneratedColumn<int> conversionCount = GeneratedColumn<int>(
    'conversion_count',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    ownerUserId,
    publicCode,
    shareUrl,
    state,
    isActive,
    expiresAt,
    clickCount,
    uniqueClickCount,
    referralCount,
    conversionCount,
    createdAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'referral_codes';
  @override
  VerificationContext validateIntegrity(
    Insertable<ReferralCode> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('owner_user_id')) {
      context.handle(
        _ownerUserIdMeta,
        ownerUserId.isAcceptableOrUnknown(
          data['owner_user_id']!,
          _ownerUserIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_ownerUserIdMeta);
    }
    if (data.containsKey('public_code')) {
      context.handle(
        _publicCodeMeta,
        publicCode.isAcceptableOrUnknown(data['public_code']!, _publicCodeMeta),
      );
    } else if (isInserting) {
      context.missing(_publicCodeMeta);
    }
    if (data.containsKey('share_url')) {
      context.handle(
        _shareUrlMeta,
        shareUrl.isAcceptableOrUnknown(data['share_url']!, _shareUrlMeta),
      );
    } else if (isInserting) {
      context.missing(_shareUrlMeta);
    }
    if (data.containsKey('state')) {
      context.handle(
        _stateMeta,
        state.isAcceptableOrUnknown(data['state']!, _stateMeta),
      );
    } else if (isInserting) {
      context.missing(_stateMeta);
    }
    if (data.containsKey('is_active')) {
      context.handle(
        _isActiveMeta,
        isActive.isAcceptableOrUnknown(data['is_active']!, _isActiveMeta),
      );
    }
    if (data.containsKey('expires_at')) {
      context.handle(
        _expiresAtMeta,
        expiresAt.isAcceptableOrUnknown(data['expires_at']!, _expiresAtMeta),
      );
    }
    if (data.containsKey('click_count')) {
      context.handle(
        _clickCountMeta,
        clickCount.isAcceptableOrUnknown(data['click_count']!, _clickCountMeta),
      );
    }
    if (data.containsKey('unique_click_count')) {
      context.handle(
        _uniqueClickCountMeta,
        uniqueClickCount.isAcceptableOrUnknown(
          data['unique_click_count']!,
          _uniqueClickCountMeta,
        ),
      );
    }
    if (data.containsKey('referral_count')) {
      context.handle(
        _referralCountMeta,
        referralCount.isAcceptableOrUnknown(
          data['referral_count']!,
          _referralCountMeta,
        ),
      );
    }
    if (data.containsKey('conversion_count')) {
      context.handle(
        _conversionCountMeta,
        conversionCount.isAcceptableOrUnknown(
          data['conversion_count']!,
          _conversionCountMeta,
        ),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  ReferralCode map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return ReferralCode(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      ownerUserId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}owner_user_id'],
      )!,
      publicCode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}public_code'],
      )!,
      shareUrl: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}share_url'],
      )!,
      state: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}state'],
      )!,
      isActive: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_active'],
      )!,
      expiresAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}expires_at'],
      ),
      clickCount: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}click_count'],
      )!,
      uniqueClickCount: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}unique_click_count'],
      )!,
      referralCount: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}referral_count'],
      )!,
      conversionCount: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}conversion_count'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
    );
  }

  @override
  $ReferralCodesTable createAlias(String alias) {
    return $ReferralCodesTable(attachedDatabase, alias);
  }
}

class ReferralCode extends DataClass implements Insertable<ReferralCode> {
  final String id;
  final String ownerUserId;
  final String publicCode;
  final String shareUrl;
  final String state;
  final bool isActive;
  final DateTime? expiresAt;
  final int clickCount;
  final int uniqueClickCount;
  final int referralCount;
  final int conversionCount;
  final DateTime createdAt;
  const ReferralCode({
    required this.id,
    required this.ownerUserId,
    required this.publicCode,
    required this.shareUrl,
    required this.state,
    required this.isActive,
    this.expiresAt,
    required this.clickCount,
    required this.uniqueClickCount,
    required this.referralCount,
    required this.conversionCount,
    required this.createdAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['owner_user_id'] = Variable<String>(ownerUserId);
    map['public_code'] = Variable<String>(publicCode);
    map['share_url'] = Variable<String>(shareUrl);
    map['state'] = Variable<String>(state);
    map['is_active'] = Variable<bool>(isActive);
    if (!nullToAbsent || expiresAt != null) {
      map['expires_at'] = Variable<DateTime>(expiresAt);
    }
    map['click_count'] = Variable<int>(clickCount);
    map['unique_click_count'] = Variable<int>(uniqueClickCount);
    map['referral_count'] = Variable<int>(referralCount);
    map['conversion_count'] = Variable<int>(conversionCount);
    map['created_at'] = Variable<DateTime>(createdAt);
    return map;
  }

  ReferralCodesCompanion toCompanion(bool nullToAbsent) {
    return ReferralCodesCompanion(
      id: Value(id),
      ownerUserId: Value(ownerUserId),
      publicCode: Value(publicCode),
      shareUrl: Value(shareUrl),
      state: Value(state),
      isActive: Value(isActive),
      expiresAt: expiresAt == null && nullToAbsent
          ? const Value.absent()
          : Value(expiresAt),
      clickCount: Value(clickCount),
      uniqueClickCount: Value(uniqueClickCount),
      referralCount: Value(referralCount),
      conversionCount: Value(conversionCount),
      createdAt: Value(createdAt),
    );
  }

  factory ReferralCode.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return ReferralCode(
      id: serializer.fromJson<String>(json['id']),
      ownerUserId: serializer.fromJson<String>(json['ownerUserId']),
      publicCode: serializer.fromJson<String>(json['publicCode']),
      shareUrl: serializer.fromJson<String>(json['shareUrl']),
      state: serializer.fromJson<String>(json['state']),
      isActive: serializer.fromJson<bool>(json['isActive']),
      expiresAt: serializer.fromJson<DateTime?>(json['expiresAt']),
      clickCount: serializer.fromJson<int>(json['clickCount']),
      uniqueClickCount: serializer.fromJson<int>(json['uniqueClickCount']),
      referralCount: serializer.fromJson<int>(json['referralCount']),
      conversionCount: serializer.fromJson<int>(json['conversionCount']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'ownerUserId': serializer.toJson<String>(ownerUserId),
      'publicCode': serializer.toJson<String>(publicCode),
      'shareUrl': serializer.toJson<String>(shareUrl),
      'state': serializer.toJson<String>(state),
      'isActive': serializer.toJson<bool>(isActive),
      'expiresAt': serializer.toJson<DateTime?>(expiresAt),
      'clickCount': serializer.toJson<int>(clickCount),
      'uniqueClickCount': serializer.toJson<int>(uniqueClickCount),
      'referralCount': serializer.toJson<int>(referralCount),
      'conversionCount': serializer.toJson<int>(conversionCount),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  ReferralCode copyWith({
    String? id,
    String? ownerUserId,
    String? publicCode,
    String? shareUrl,
    String? state,
    bool? isActive,
    Value<DateTime?> expiresAt = const Value.absent(),
    int? clickCount,
    int? uniqueClickCount,
    int? referralCount,
    int? conversionCount,
    DateTime? createdAt,
  }) => ReferralCode(
    id: id ?? this.id,
    ownerUserId: ownerUserId ?? this.ownerUserId,
    publicCode: publicCode ?? this.publicCode,
    shareUrl: shareUrl ?? this.shareUrl,
    state: state ?? this.state,
    isActive: isActive ?? this.isActive,
    expiresAt: expiresAt.present ? expiresAt.value : this.expiresAt,
    clickCount: clickCount ?? this.clickCount,
    uniqueClickCount: uniqueClickCount ?? this.uniqueClickCount,
    referralCount: referralCount ?? this.referralCount,
    conversionCount: conversionCount ?? this.conversionCount,
    createdAt: createdAt ?? this.createdAt,
  );
  ReferralCode copyWithCompanion(ReferralCodesCompanion data) {
    return ReferralCode(
      id: data.id.present ? data.id.value : this.id,
      ownerUserId: data.ownerUserId.present
          ? data.ownerUserId.value
          : this.ownerUserId,
      publicCode: data.publicCode.present
          ? data.publicCode.value
          : this.publicCode,
      shareUrl: data.shareUrl.present ? data.shareUrl.value : this.shareUrl,
      state: data.state.present ? data.state.value : this.state,
      isActive: data.isActive.present ? data.isActive.value : this.isActive,
      expiresAt: data.expiresAt.present ? data.expiresAt.value : this.expiresAt,
      clickCount: data.clickCount.present
          ? data.clickCount.value
          : this.clickCount,
      uniqueClickCount: data.uniqueClickCount.present
          ? data.uniqueClickCount.value
          : this.uniqueClickCount,
      referralCount: data.referralCount.present
          ? data.referralCount.value
          : this.referralCount,
      conversionCount: data.conversionCount.present
          ? data.conversionCount.value
          : this.conversionCount,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('ReferralCode(')
          ..write('id: $id, ')
          ..write('ownerUserId: $ownerUserId, ')
          ..write('publicCode: $publicCode, ')
          ..write('shareUrl: $shareUrl, ')
          ..write('state: $state, ')
          ..write('isActive: $isActive, ')
          ..write('expiresAt: $expiresAt, ')
          ..write('clickCount: $clickCount, ')
          ..write('uniqueClickCount: $uniqueClickCount, ')
          ..write('referralCount: $referralCount, ')
          ..write('conversionCount: $conversionCount, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    ownerUserId,
    publicCode,
    shareUrl,
    state,
    isActive,
    expiresAt,
    clickCount,
    uniqueClickCount,
    referralCount,
    conversionCount,
    createdAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is ReferralCode &&
          other.id == this.id &&
          other.ownerUserId == this.ownerUserId &&
          other.publicCode == this.publicCode &&
          other.shareUrl == this.shareUrl &&
          other.state == this.state &&
          other.isActive == this.isActive &&
          other.expiresAt == this.expiresAt &&
          other.clickCount == this.clickCount &&
          other.uniqueClickCount == this.uniqueClickCount &&
          other.referralCount == this.referralCount &&
          other.conversionCount == this.conversionCount &&
          other.createdAt == this.createdAt);
}

class ReferralCodesCompanion extends UpdateCompanion<ReferralCode> {
  final Value<String> id;
  final Value<String> ownerUserId;
  final Value<String> publicCode;
  final Value<String> shareUrl;
  final Value<String> state;
  final Value<bool> isActive;
  final Value<DateTime?> expiresAt;
  final Value<int> clickCount;
  final Value<int> uniqueClickCount;
  final Value<int> referralCount;
  final Value<int> conversionCount;
  final Value<DateTime> createdAt;
  final Value<int> rowid;
  const ReferralCodesCompanion({
    this.id = const Value.absent(),
    this.ownerUserId = const Value.absent(),
    this.publicCode = const Value.absent(),
    this.shareUrl = const Value.absent(),
    this.state = const Value.absent(),
    this.isActive = const Value.absent(),
    this.expiresAt = const Value.absent(),
    this.clickCount = const Value.absent(),
    this.uniqueClickCount = const Value.absent(),
    this.referralCount = const Value.absent(),
    this.conversionCount = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  ReferralCodesCompanion.insert({
    required String id,
    required String ownerUserId,
    required String publicCode,
    required String shareUrl,
    required String state,
    this.isActive = const Value.absent(),
    this.expiresAt = const Value.absent(),
    this.clickCount = const Value.absent(),
    this.uniqueClickCount = const Value.absent(),
    this.referralCount = const Value.absent(),
    this.conversionCount = const Value.absent(),
    required DateTime createdAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       ownerUserId = Value(ownerUserId),
       publicCode = Value(publicCode),
       shareUrl = Value(shareUrl),
       state = Value(state),
       createdAt = Value(createdAt);
  static Insertable<ReferralCode> custom({
    Expression<String>? id,
    Expression<String>? ownerUserId,
    Expression<String>? publicCode,
    Expression<String>? shareUrl,
    Expression<String>? state,
    Expression<bool>? isActive,
    Expression<DateTime>? expiresAt,
    Expression<int>? clickCount,
    Expression<int>? uniqueClickCount,
    Expression<int>? referralCount,
    Expression<int>? conversionCount,
    Expression<DateTime>? createdAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (ownerUserId != null) 'owner_user_id': ownerUserId,
      if (publicCode != null) 'public_code': publicCode,
      if (shareUrl != null) 'share_url': shareUrl,
      if (state != null) 'state': state,
      if (isActive != null) 'is_active': isActive,
      if (expiresAt != null) 'expires_at': expiresAt,
      if (clickCount != null) 'click_count': clickCount,
      if (uniqueClickCount != null) 'unique_click_count': uniqueClickCount,
      if (referralCount != null) 'referral_count': referralCount,
      if (conversionCount != null) 'conversion_count': conversionCount,
      if (createdAt != null) 'created_at': createdAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  ReferralCodesCompanion copyWith({
    Value<String>? id,
    Value<String>? ownerUserId,
    Value<String>? publicCode,
    Value<String>? shareUrl,
    Value<String>? state,
    Value<bool>? isActive,
    Value<DateTime?>? expiresAt,
    Value<int>? clickCount,
    Value<int>? uniqueClickCount,
    Value<int>? referralCount,
    Value<int>? conversionCount,
    Value<DateTime>? createdAt,
    Value<int>? rowid,
  }) {
    return ReferralCodesCompanion(
      id: id ?? this.id,
      ownerUserId: ownerUserId ?? this.ownerUserId,
      publicCode: publicCode ?? this.publicCode,
      shareUrl: shareUrl ?? this.shareUrl,
      state: state ?? this.state,
      isActive: isActive ?? this.isActive,
      expiresAt: expiresAt ?? this.expiresAt,
      clickCount: clickCount ?? this.clickCount,
      uniqueClickCount: uniqueClickCount ?? this.uniqueClickCount,
      referralCount: referralCount ?? this.referralCount,
      conversionCount: conversionCount ?? this.conversionCount,
      createdAt: createdAt ?? this.createdAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (ownerUserId.present) {
      map['owner_user_id'] = Variable<String>(ownerUserId.value);
    }
    if (publicCode.present) {
      map['public_code'] = Variable<String>(publicCode.value);
    }
    if (shareUrl.present) {
      map['share_url'] = Variable<String>(shareUrl.value);
    }
    if (state.present) {
      map['state'] = Variable<String>(state.value);
    }
    if (isActive.present) {
      map['is_active'] = Variable<bool>(isActive.value);
    }
    if (expiresAt.present) {
      map['expires_at'] = Variable<DateTime>(expiresAt.value);
    }
    if (clickCount.present) {
      map['click_count'] = Variable<int>(clickCount.value);
    }
    if (uniqueClickCount.present) {
      map['unique_click_count'] = Variable<int>(uniqueClickCount.value);
    }
    if (referralCount.present) {
      map['referral_count'] = Variable<int>(referralCount.value);
    }
    if (conversionCount.present) {
      map['conversion_count'] = Variable<int>(conversionCount.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('ReferralCodesCompanion(')
          ..write('id: $id, ')
          ..write('ownerUserId: $ownerUserId, ')
          ..write('publicCode: $publicCode, ')
          ..write('shareUrl: $shareUrl, ')
          ..write('state: $state, ')
          ..write('isActive: $isActive, ')
          ..write('expiresAt: $expiresAt, ')
          ..write('clickCount: $clickCount, ')
          ..write('uniqueClickCount: $uniqueClickCount, ')
          ..write('referralCount: $referralCount, ')
          ..write('conversionCount: $conversionCount, ')
          ..write('createdAt: $createdAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $ReferralItemsTable extends ReferralItems
    with TableInfo<$ReferralItemsTable, ReferralItem> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $ReferralItemsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _publicCodeMeta = const VerificationMeta(
    'publicCode',
  );
  @override
  late final GeneratedColumn<String> publicCode = GeneratedColumn<String>(
    'public_code',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _referrerUserIdMeta = const VerificationMeta(
    'referrerUserId',
  );
  @override
  late final GeneratedColumn<String> referrerUserId = GeneratedColumn<String>(
    'referrer_user_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _referredUserIdMeta = const VerificationMeta(
    'referredUserId',
  );
  @override
  late final GeneratedColumn<String> referredUserId = GeneratedColumn<String>(
    'referred_user_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _attributionStatusMeta = const VerificationMeta(
    'attributionStatus',
  );
  @override
  late final GeneratedColumn<String> attributionStatus =
      GeneratedColumn<String>(
        'attribution_status',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _currentMilestoneMeta = const VerificationMeta(
    'currentMilestone',
  );
  @override
  late final GeneratedColumn<String> currentMilestone = GeneratedColumn<String>(
    'current_milestone',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _chatAccessStateMeta = const VerificationMeta(
    'chatAccessState',
  );
  @override
  late final GeneratedColumn<String> chatAccessState = GeneratedColumn<String>(
    'chat_access_state',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _attributedAtMeta = const VerificationMeta(
    'attributedAt',
  );
  @override
  late final GeneratedColumn<DateTime> attributedAt = GeneratedColumn<DateTime>(
    'attributed_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _signedUpAtMeta = const VerificationMeta(
    'signedUpAt',
  );
  @override
  late final GeneratedColumn<DateTime> signedUpAt = GeneratedColumn<DateTime>(
    'signed_up_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _installLoginVerifiedAtMeta =
      const VerificationMeta('installLoginVerifiedAt');
  @override
  late final GeneratedColumn<DateTime> installLoginVerifiedAt =
      GeneratedColumn<DateTime>(
        'install_login_verified_at',
        aliasedName,
        true,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _chatUnlockedAtMeta = const VerificationMeta(
    'chatUnlockedAt',
  );
  @override
  late final GeneratedColumn<DateTime> chatUnlockedAt =
      GeneratedColumn<DateTime>(
        'chat_unlocked_at',
        aliasedName,
        true,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _cachedAtMeta = const VerificationMeta(
    'cachedAt',
  );
  @override
  late final GeneratedColumn<DateTime> cachedAt = GeneratedColumn<DateTime>(
    'cached_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    publicCode,
    referrerUserId,
    referredUserId,
    attributionStatus,
    currentMilestone,
    chatAccessState,
    attributedAt,
    signedUpAt,
    installLoginVerifiedAt,
    chatUnlockedAt,
    cachedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'referral_items';
  @override
  VerificationContext validateIntegrity(
    Insertable<ReferralItem> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('public_code')) {
      context.handle(
        _publicCodeMeta,
        publicCode.isAcceptableOrUnknown(data['public_code']!, _publicCodeMeta),
      );
    } else if (isInserting) {
      context.missing(_publicCodeMeta);
    }
    if (data.containsKey('referrer_user_id')) {
      context.handle(
        _referrerUserIdMeta,
        referrerUserId.isAcceptableOrUnknown(
          data['referrer_user_id']!,
          _referrerUserIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_referrerUserIdMeta);
    }
    if (data.containsKey('referred_user_id')) {
      context.handle(
        _referredUserIdMeta,
        referredUserId.isAcceptableOrUnknown(
          data['referred_user_id']!,
          _referredUserIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_referredUserIdMeta);
    }
    if (data.containsKey('attribution_status')) {
      context.handle(
        _attributionStatusMeta,
        attributionStatus.isAcceptableOrUnknown(
          data['attribution_status']!,
          _attributionStatusMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_attributionStatusMeta);
    }
    if (data.containsKey('current_milestone')) {
      context.handle(
        _currentMilestoneMeta,
        currentMilestone.isAcceptableOrUnknown(
          data['current_milestone']!,
          _currentMilestoneMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_currentMilestoneMeta);
    }
    if (data.containsKey('chat_access_state')) {
      context.handle(
        _chatAccessStateMeta,
        chatAccessState.isAcceptableOrUnknown(
          data['chat_access_state']!,
          _chatAccessStateMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_chatAccessStateMeta);
    }
    if (data.containsKey('attributed_at')) {
      context.handle(
        _attributedAtMeta,
        attributedAt.isAcceptableOrUnknown(
          data['attributed_at']!,
          _attributedAtMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_attributedAtMeta);
    }
    if (data.containsKey('signed_up_at')) {
      context.handle(
        _signedUpAtMeta,
        signedUpAt.isAcceptableOrUnknown(
          data['signed_up_at']!,
          _signedUpAtMeta,
        ),
      );
    }
    if (data.containsKey('install_login_verified_at')) {
      context.handle(
        _installLoginVerifiedAtMeta,
        installLoginVerifiedAt.isAcceptableOrUnknown(
          data['install_login_verified_at']!,
          _installLoginVerifiedAtMeta,
        ),
      );
    }
    if (data.containsKey('chat_unlocked_at')) {
      context.handle(
        _chatUnlockedAtMeta,
        chatUnlockedAt.isAcceptableOrUnknown(
          data['chat_unlocked_at']!,
          _chatUnlockedAtMeta,
        ),
      );
    }
    if (data.containsKey('cached_at')) {
      context.handle(
        _cachedAtMeta,
        cachedAt.isAcceptableOrUnknown(data['cached_at']!, _cachedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_cachedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  ReferralItem map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return ReferralItem(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      publicCode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}public_code'],
      )!,
      referrerUserId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}referrer_user_id'],
      )!,
      referredUserId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}referred_user_id'],
      )!,
      attributionStatus: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}attribution_status'],
      )!,
      currentMilestone: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}current_milestone'],
      )!,
      chatAccessState: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}chat_access_state'],
      )!,
      attributedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}attributed_at'],
      )!,
      signedUpAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}signed_up_at'],
      ),
      installLoginVerifiedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}install_login_verified_at'],
      ),
      chatUnlockedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}chat_unlocked_at'],
      ),
      cachedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}cached_at'],
      )!,
    );
  }

  @override
  $ReferralItemsTable createAlias(String alias) {
    return $ReferralItemsTable(attachedDatabase, alias);
  }
}

class ReferralItem extends DataClass implements Insertable<ReferralItem> {
  final String id;
  final String publicCode;
  final String referrerUserId;
  final String referredUserId;
  final String attributionStatus;
  final String currentMilestone;
  final String chatAccessState;
  final DateTime attributedAt;
  final DateTime? signedUpAt;
  final DateTime? installLoginVerifiedAt;
  final DateTime? chatUnlockedAt;
  final DateTime cachedAt;
  const ReferralItem({
    required this.id,
    required this.publicCode,
    required this.referrerUserId,
    required this.referredUserId,
    required this.attributionStatus,
    required this.currentMilestone,
    required this.chatAccessState,
    required this.attributedAt,
    this.signedUpAt,
    this.installLoginVerifiedAt,
    this.chatUnlockedAt,
    required this.cachedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['public_code'] = Variable<String>(publicCode);
    map['referrer_user_id'] = Variable<String>(referrerUserId);
    map['referred_user_id'] = Variable<String>(referredUserId);
    map['attribution_status'] = Variable<String>(attributionStatus);
    map['current_milestone'] = Variable<String>(currentMilestone);
    map['chat_access_state'] = Variable<String>(chatAccessState);
    map['attributed_at'] = Variable<DateTime>(attributedAt);
    if (!nullToAbsent || signedUpAt != null) {
      map['signed_up_at'] = Variable<DateTime>(signedUpAt);
    }
    if (!nullToAbsent || installLoginVerifiedAt != null) {
      map['install_login_verified_at'] = Variable<DateTime>(
        installLoginVerifiedAt,
      );
    }
    if (!nullToAbsent || chatUnlockedAt != null) {
      map['chat_unlocked_at'] = Variable<DateTime>(chatUnlockedAt);
    }
    map['cached_at'] = Variable<DateTime>(cachedAt);
    return map;
  }

  ReferralItemsCompanion toCompanion(bool nullToAbsent) {
    return ReferralItemsCompanion(
      id: Value(id),
      publicCode: Value(publicCode),
      referrerUserId: Value(referrerUserId),
      referredUserId: Value(referredUserId),
      attributionStatus: Value(attributionStatus),
      currentMilestone: Value(currentMilestone),
      chatAccessState: Value(chatAccessState),
      attributedAt: Value(attributedAt),
      signedUpAt: signedUpAt == null && nullToAbsent
          ? const Value.absent()
          : Value(signedUpAt),
      installLoginVerifiedAt: installLoginVerifiedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(installLoginVerifiedAt),
      chatUnlockedAt: chatUnlockedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(chatUnlockedAt),
      cachedAt: Value(cachedAt),
    );
  }

  factory ReferralItem.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return ReferralItem(
      id: serializer.fromJson<String>(json['id']),
      publicCode: serializer.fromJson<String>(json['publicCode']),
      referrerUserId: serializer.fromJson<String>(json['referrerUserId']),
      referredUserId: serializer.fromJson<String>(json['referredUserId']),
      attributionStatus: serializer.fromJson<String>(json['attributionStatus']),
      currentMilestone: serializer.fromJson<String>(json['currentMilestone']),
      chatAccessState: serializer.fromJson<String>(json['chatAccessState']),
      attributedAt: serializer.fromJson<DateTime>(json['attributedAt']),
      signedUpAt: serializer.fromJson<DateTime?>(json['signedUpAt']),
      installLoginVerifiedAt: serializer.fromJson<DateTime?>(
        json['installLoginVerifiedAt'],
      ),
      chatUnlockedAt: serializer.fromJson<DateTime?>(json['chatUnlockedAt']),
      cachedAt: serializer.fromJson<DateTime>(json['cachedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'publicCode': serializer.toJson<String>(publicCode),
      'referrerUserId': serializer.toJson<String>(referrerUserId),
      'referredUserId': serializer.toJson<String>(referredUserId),
      'attributionStatus': serializer.toJson<String>(attributionStatus),
      'currentMilestone': serializer.toJson<String>(currentMilestone),
      'chatAccessState': serializer.toJson<String>(chatAccessState),
      'attributedAt': serializer.toJson<DateTime>(attributedAt),
      'signedUpAt': serializer.toJson<DateTime?>(signedUpAt),
      'installLoginVerifiedAt': serializer.toJson<DateTime?>(
        installLoginVerifiedAt,
      ),
      'chatUnlockedAt': serializer.toJson<DateTime?>(chatUnlockedAt),
      'cachedAt': serializer.toJson<DateTime>(cachedAt),
    };
  }

  ReferralItem copyWith({
    String? id,
    String? publicCode,
    String? referrerUserId,
    String? referredUserId,
    String? attributionStatus,
    String? currentMilestone,
    String? chatAccessState,
    DateTime? attributedAt,
    Value<DateTime?> signedUpAt = const Value.absent(),
    Value<DateTime?> installLoginVerifiedAt = const Value.absent(),
    Value<DateTime?> chatUnlockedAt = const Value.absent(),
    DateTime? cachedAt,
  }) => ReferralItem(
    id: id ?? this.id,
    publicCode: publicCode ?? this.publicCode,
    referrerUserId: referrerUserId ?? this.referrerUserId,
    referredUserId: referredUserId ?? this.referredUserId,
    attributionStatus: attributionStatus ?? this.attributionStatus,
    currentMilestone: currentMilestone ?? this.currentMilestone,
    chatAccessState: chatAccessState ?? this.chatAccessState,
    attributedAt: attributedAt ?? this.attributedAt,
    signedUpAt: signedUpAt.present ? signedUpAt.value : this.signedUpAt,
    installLoginVerifiedAt: installLoginVerifiedAt.present
        ? installLoginVerifiedAt.value
        : this.installLoginVerifiedAt,
    chatUnlockedAt: chatUnlockedAt.present
        ? chatUnlockedAt.value
        : this.chatUnlockedAt,
    cachedAt: cachedAt ?? this.cachedAt,
  );
  ReferralItem copyWithCompanion(ReferralItemsCompanion data) {
    return ReferralItem(
      id: data.id.present ? data.id.value : this.id,
      publicCode: data.publicCode.present
          ? data.publicCode.value
          : this.publicCode,
      referrerUserId: data.referrerUserId.present
          ? data.referrerUserId.value
          : this.referrerUserId,
      referredUserId: data.referredUserId.present
          ? data.referredUserId.value
          : this.referredUserId,
      attributionStatus: data.attributionStatus.present
          ? data.attributionStatus.value
          : this.attributionStatus,
      currentMilestone: data.currentMilestone.present
          ? data.currentMilestone.value
          : this.currentMilestone,
      chatAccessState: data.chatAccessState.present
          ? data.chatAccessState.value
          : this.chatAccessState,
      attributedAt: data.attributedAt.present
          ? data.attributedAt.value
          : this.attributedAt,
      signedUpAt: data.signedUpAt.present
          ? data.signedUpAt.value
          : this.signedUpAt,
      installLoginVerifiedAt: data.installLoginVerifiedAt.present
          ? data.installLoginVerifiedAt.value
          : this.installLoginVerifiedAt,
      chatUnlockedAt: data.chatUnlockedAt.present
          ? data.chatUnlockedAt.value
          : this.chatUnlockedAt,
      cachedAt: data.cachedAt.present ? data.cachedAt.value : this.cachedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('ReferralItem(')
          ..write('id: $id, ')
          ..write('publicCode: $publicCode, ')
          ..write('referrerUserId: $referrerUserId, ')
          ..write('referredUserId: $referredUserId, ')
          ..write('attributionStatus: $attributionStatus, ')
          ..write('currentMilestone: $currentMilestone, ')
          ..write('chatAccessState: $chatAccessState, ')
          ..write('attributedAt: $attributedAt, ')
          ..write('signedUpAt: $signedUpAt, ')
          ..write('installLoginVerifiedAt: $installLoginVerifiedAt, ')
          ..write('chatUnlockedAt: $chatUnlockedAt, ')
          ..write('cachedAt: $cachedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    publicCode,
    referrerUserId,
    referredUserId,
    attributionStatus,
    currentMilestone,
    chatAccessState,
    attributedAt,
    signedUpAt,
    installLoginVerifiedAt,
    chatUnlockedAt,
    cachedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is ReferralItem &&
          other.id == this.id &&
          other.publicCode == this.publicCode &&
          other.referrerUserId == this.referrerUserId &&
          other.referredUserId == this.referredUserId &&
          other.attributionStatus == this.attributionStatus &&
          other.currentMilestone == this.currentMilestone &&
          other.chatAccessState == this.chatAccessState &&
          other.attributedAt == this.attributedAt &&
          other.signedUpAt == this.signedUpAt &&
          other.installLoginVerifiedAt == this.installLoginVerifiedAt &&
          other.chatUnlockedAt == this.chatUnlockedAt &&
          other.cachedAt == this.cachedAt);
}

class ReferralItemsCompanion extends UpdateCompanion<ReferralItem> {
  final Value<String> id;
  final Value<String> publicCode;
  final Value<String> referrerUserId;
  final Value<String> referredUserId;
  final Value<String> attributionStatus;
  final Value<String> currentMilestone;
  final Value<String> chatAccessState;
  final Value<DateTime> attributedAt;
  final Value<DateTime?> signedUpAt;
  final Value<DateTime?> installLoginVerifiedAt;
  final Value<DateTime?> chatUnlockedAt;
  final Value<DateTime> cachedAt;
  final Value<int> rowid;
  const ReferralItemsCompanion({
    this.id = const Value.absent(),
    this.publicCode = const Value.absent(),
    this.referrerUserId = const Value.absent(),
    this.referredUserId = const Value.absent(),
    this.attributionStatus = const Value.absent(),
    this.currentMilestone = const Value.absent(),
    this.chatAccessState = const Value.absent(),
    this.attributedAt = const Value.absent(),
    this.signedUpAt = const Value.absent(),
    this.installLoginVerifiedAt = const Value.absent(),
    this.chatUnlockedAt = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  ReferralItemsCompanion.insert({
    required String id,
    required String publicCode,
    required String referrerUserId,
    required String referredUserId,
    required String attributionStatus,
    required String currentMilestone,
    required String chatAccessState,
    required DateTime attributedAt,
    this.signedUpAt = const Value.absent(),
    this.installLoginVerifiedAt = const Value.absent(),
    this.chatUnlockedAt = const Value.absent(),
    required DateTime cachedAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       publicCode = Value(publicCode),
       referrerUserId = Value(referrerUserId),
       referredUserId = Value(referredUserId),
       attributionStatus = Value(attributionStatus),
       currentMilestone = Value(currentMilestone),
       chatAccessState = Value(chatAccessState),
       attributedAt = Value(attributedAt),
       cachedAt = Value(cachedAt);
  static Insertable<ReferralItem> custom({
    Expression<String>? id,
    Expression<String>? publicCode,
    Expression<String>? referrerUserId,
    Expression<String>? referredUserId,
    Expression<String>? attributionStatus,
    Expression<String>? currentMilestone,
    Expression<String>? chatAccessState,
    Expression<DateTime>? attributedAt,
    Expression<DateTime>? signedUpAt,
    Expression<DateTime>? installLoginVerifiedAt,
    Expression<DateTime>? chatUnlockedAt,
    Expression<DateTime>? cachedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (publicCode != null) 'public_code': publicCode,
      if (referrerUserId != null) 'referrer_user_id': referrerUserId,
      if (referredUserId != null) 'referred_user_id': referredUserId,
      if (attributionStatus != null) 'attribution_status': attributionStatus,
      if (currentMilestone != null) 'current_milestone': currentMilestone,
      if (chatAccessState != null) 'chat_access_state': chatAccessState,
      if (attributedAt != null) 'attributed_at': attributedAt,
      if (signedUpAt != null) 'signed_up_at': signedUpAt,
      if (installLoginVerifiedAt != null)
        'install_login_verified_at': installLoginVerifiedAt,
      if (chatUnlockedAt != null) 'chat_unlocked_at': chatUnlockedAt,
      if (cachedAt != null) 'cached_at': cachedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  ReferralItemsCompanion copyWith({
    Value<String>? id,
    Value<String>? publicCode,
    Value<String>? referrerUserId,
    Value<String>? referredUserId,
    Value<String>? attributionStatus,
    Value<String>? currentMilestone,
    Value<String>? chatAccessState,
    Value<DateTime>? attributedAt,
    Value<DateTime?>? signedUpAt,
    Value<DateTime?>? installLoginVerifiedAt,
    Value<DateTime?>? chatUnlockedAt,
    Value<DateTime>? cachedAt,
    Value<int>? rowid,
  }) {
    return ReferralItemsCompanion(
      id: id ?? this.id,
      publicCode: publicCode ?? this.publicCode,
      referrerUserId: referrerUserId ?? this.referrerUserId,
      referredUserId: referredUserId ?? this.referredUserId,
      attributionStatus: attributionStatus ?? this.attributionStatus,
      currentMilestone: currentMilestone ?? this.currentMilestone,
      chatAccessState: chatAccessState ?? this.chatAccessState,
      attributedAt: attributedAt ?? this.attributedAt,
      signedUpAt: signedUpAt ?? this.signedUpAt,
      installLoginVerifiedAt:
          installLoginVerifiedAt ?? this.installLoginVerifiedAt,
      chatUnlockedAt: chatUnlockedAt ?? this.chatUnlockedAt,
      cachedAt: cachedAt ?? this.cachedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (publicCode.present) {
      map['public_code'] = Variable<String>(publicCode.value);
    }
    if (referrerUserId.present) {
      map['referrer_user_id'] = Variable<String>(referrerUserId.value);
    }
    if (referredUserId.present) {
      map['referred_user_id'] = Variable<String>(referredUserId.value);
    }
    if (attributionStatus.present) {
      map['attribution_status'] = Variable<String>(attributionStatus.value);
    }
    if (currentMilestone.present) {
      map['current_milestone'] = Variable<String>(currentMilestone.value);
    }
    if (chatAccessState.present) {
      map['chat_access_state'] = Variable<String>(chatAccessState.value);
    }
    if (attributedAt.present) {
      map['attributed_at'] = Variable<DateTime>(attributedAt.value);
    }
    if (signedUpAt.present) {
      map['signed_up_at'] = Variable<DateTime>(signedUpAt.value);
    }
    if (installLoginVerifiedAt.present) {
      map['install_login_verified_at'] = Variable<DateTime>(
        installLoginVerifiedAt.value,
      );
    }
    if (chatUnlockedAt.present) {
      map['chat_unlocked_at'] = Variable<DateTime>(chatUnlockedAt.value);
    }
    if (cachedAt.present) {
      map['cached_at'] = Variable<DateTime>(cachedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('ReferralItemsCompanion(')
          ..write('id: $id, ')
          ..write('publicCode: $publicCode, ')
          ..write('referrerUserId: $referrerUserId, ')
          ..write('referredUserId: $referredUserId, ')
          ..write('attributionStatus: $attributionStatus, ')
          ..write('currentMilestone: $currentMilestone, ')
          ..write('chatAccessState: $chatAccessState, ')
          ..write('attributedAt: $attributedAt, ')
          ..write('signedUpAt: $signedUpAt, ')
          ..write('installLoginVerifiedAt: $installLoginVerifiedAt, ')
          ..write('chatUnlockedAt: $chatUnlockedAt, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $PayoutRequestsTable extends PayoutRequests
    with TableInfo<$PayoutRequestsTable, PayoutRequest> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $PayoutRequestsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _userIdMeta = const VerificationMeta('userId');
  @override
  late final GeneratedColumn<String> userId = GeneratedColumn<String>(
    'user_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _amountMinorUnitsMeta = const VerificationMeta(
    'amountMinorUnits',
  );
  @override
  late final GeneratedColumn<int> amountMinorUnits = GeneratedColumn<int>(
    'amount_minor_units',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _paymentUtrMeta = const VerificationMeta(
    'paymentUtr',
  );
  @override
  late final GeneratedColumn<String> paymentUtr = GeneratedColumn<String>(
    'payment_utr',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _requestedAtMeta = const VerificationMeta(
    'requestedAt',
  );
  @override
  late final GeneratedColumn<DateTime> requestedAt = GeneratedColumn<DateTime>(
    'requested_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _reviewedAtMeta = const VerificationMeta(
    'reviewedAt',
  );
  @override
  late final GeneratedColumn<DateTime> reviewedAt = GeneratedColumn<DateTime>(
    'reviewed_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _completedAtMeta = const VerificationMeta(
    'completedAt',
  );
  @override
  late final GeneratedColumn<DateTime> completedAt = GeneratedColumn<DateTime>(
    'completed_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    userId,
    amountMinorUnits,
    status,
    paymentUtr,
    requestedAt,
    reviewedAt,
    completedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'payout_requests';
  @override
  VerificationContext validateIntegrity(
    Insertable<PayoutRequest> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('user_id')) {
      context.handle(
        _userIdMeta,
        userId.isAcceptableOrUnknown(data['user_id']!, _userIdMeta),
      );
    } else if (isInserting) {
      context.missing(_userIdMeta);
    }
    if (data.containsKey('amount_minor_units')) {
      context.handle(
        _amountMinorUnitsMeta,
        amountMinorUnits.isAcceptableOrUnknown(
          data['amount_minor_units']!,
          _amountMinorUnitsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_amountMinorUnitsMeta);
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    } else if (isInserting) {
      context.missing(_statusMeta);
    }
    if (data.containsKey('payment_utr')) {
      context.handle(
        _paymentUtrMeta,
        paymentUtr.isAcceptableOrUnknown(data['payment_utr']!, _paymentUtrMeta),
      );
    }
    if (data.containsKey('requested_at')) {
      context.handle(
        _requestedAtMeta,
        requestedAt.isAcceptableOrUnknown(
          data['requested_at']!,
          _requestedAtMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_requestedAtMeta);
    }
    if (data.containsKey('reviewed_at')) {
      context.handle(
        _reviewedAtMeta,
        reviewedAt.isAcceptableOrUnknown(data['reviewed_at']!, _reviewedAtMeta),
      );
    }
    if (data.containsKey('completed_at')) {
      context.handle(
        _completedAtMeta,
        completedAt.isAcceptableOrUnknown(
          data['completed_at']!,
          _completedAtMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  PayoutRequest map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return PayoutRequest(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      userId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}user_id'],
      )!,
      amountMinorUnits: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}amount_minor_units'],
      )!,
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      paymentUtr: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}payment_utr'],
      ),
      requestedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}requested_at'],
      )!,
      reviewedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}reviewed_at'],
      ),
      completedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}completed_at'],
      ),
    );
  }

  @override
  $PayoutRequestsTable createAlias(String alias) {
    return $PayoutRequestsTable(attachedDatabase, alias);
  }
}

class PayoutRequest extends DataClass implements Insertable<PayoutRequest> {
  final String id;
  final String userId;
  final int amountMinorUnits;
  final String status;
  final String? paymentUtr;
  final DateTime requestedAt;
  final DateTime? reviewedAt;
  final DateTime? completedAt;
  const PayoutRequest({
    required this.id,
    required this.userId,
    required this.amountMinorUnits,
    required this.status,
    this.paymentUtr,
    required this.requestedAt,
    this.reviewedAt,
    this.completedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['user_id'] = Variable<String>(userId);
    map['amount_minor_units'] = Variable<int>(amountMinorUnits);
    map['status'] = Variable<String>(status);
    if (!nullToAbsent || paymentUtr != null) {
      map['payment_utr'] = Variable<String>(paymentUtr);
    }
    map['requested_at'] = Variable<DateTime>(requestedAt);
    if (!nullToAbsent || reviewedAt != null) {
      map['reviewed_at'] = Variable<DateTime>(reviewedAt);
    }
    if (!nullToAbsent || completedAt != null) {
      map['completed_at'] = Variable<DateTime>(completedAt);
    }
    return map;
  }

  PayoutRequestsCompanion toCompanion(bool nullToAbsent) {
    return PayoutRequestsCompanion(
      id: Value(id),
      userId: Value(userId),
      amountMinorUnits: Value(amountMinorUnits),
      status: Value(status),
      paymentUtr: paymentUtr == null && nullToAbsent
          ? const Value.absent()
          : Value(paymentUtr),
      requestedAt: Value(requestedAt),
      reviewedAt: reviewedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(reviewedAt),
      completedAt: completedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(completedAt),
    );
  }

  factory PayoutRequest.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return PayoutRequest(
      id: serializer.fromJson<String>(json['id']),
      userId: serializer.fromJson<String>(json['userId']),
      amountMinorUnits: serializer.fromJson<int>(json['amountMinorUnits']),
      status: serializer.fromJson<String>(json['status']),
      paymentUtr: serializer.fromJson<String?>(json['paymentUtr']),
      requestedAt: serializer.fromJson<DateTime>(json['requestedAt']),
      reviewedAt: serializer.fromJson<DateTime?>(json['reviewedAt']),
      completedAt: serializer.fromJson<DateTime?>(json['completedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'userId': serializer.toJson<String>(userId),
      'amountMinorUnits': serializer.toJson<int>(amountMinorUnits),
      'status': serializer.toJson<String>(status),
      'paymentUtr': serializer.toJson<String?>(paymentUtr),
      'requestedAt': serializer.toJson<DateTime>(requestedAt),
      'reviewedAt': serializer.toJson<DateTime?>(reviewedAt),
      'completedAt': serializer.toJson<DateTime?>(completedAt),
    };
  }

  PayoutRequest copyWith({
    String? id,
    String? userId,
    int? amountMinorUnits,
    String? status,
    Value<String?> paymentUtr = const Value.absent(),
    DateTime? requestedAt,
    Value<DateTime?> reviewedAt = const Value.absent(),
    Value<DateTime?> completedAt = const Value.absent(),
  }) => PayoutRequest(
    id: id ?? this.id,
    userId: userId ?? this.userId,
    amountMinorUnits: amountMinorUnits ?? this.amountMinorUnits,
    status: status ?? this.status,
    paymentUtr: paymentUtr.present ? paymentUtr.value : this.paymentUtr,
    requestedAt: requestedAt ?? this.requestedAt,
    reviewedAt: reviewedAt.present ? reviewedAt.value : this.reviewedAt,
    completedAt: completedAt.present ? completedAt.value : this.completedAt,
  );
  PayoutRequest copyWithCompanion(PayoutRequestsCompanion data) {
    return PayoutRequest(
      id: data.id.present ? data.id.value : this.id,
      userId: data.userId.present ? data.userId.value : this.userId,
      amountMinorUnits: data.amountMinorUnits.present
          ? data.amountMinorUnits.value
          : this.amountMinorUnits,
      status: data.status.present ? data.status.value : this.status,
      paymentUtr: data.paymentUtr.present
          ? data.paymentUtr.value
          : this.paymentUtr,
      requestedAt: data.requestedAt.present
          ? data.requestedAt.value
          : this.requestedAt,
      reviewedAt: data.reviewedAt.present
          ? data.reviewedAt.value
          : this.reviewedAt,
      completedAt: data.completedAt.present
          ? data.completedAt.value
          : this.completedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('PayoutRequest(')
          ..write('id: $id, ')
          ..write('userId: $userId, ')
          ..write('amountMinorUnits: $amountMinorUnits, ')
          ..write('status: $status, ')
          ..write('paymentUtr: $paymentUtr, ')
          ..write('requestedAt: $requestedAt, ')
          ..write('reviewedAt: $reviewedAt, ')
          ..write('completedAt: $completedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    userId,
    amountMinorUnits,
    status,
    paymentUtr,
    requestedAt,
    reviewedAt,
    completedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is PayoutRequest &&
          other.id == this.id &&
          other.userId == this.userId &&
          other.amountMinorUnits == this.amountMinorUnits &&
          other.status == this.status &&
          other.paymentUtr == this.paymentUtr &&
          other.requestedAt == this.requestedAt &&
          other.reviewedAt == this.reviewedAt &&
          other.completedAt == this.completedAt);
}

class PayoutRequestsCompanion extends UpdateCompanion<PayoutRequest> {
  final Value<String> id;
  final Value<String> userId;
  final Value<int> amountMinorUnits;
  final Value<String> status;
  final Value<String?> paymentUtr;
  final Value<DateTime> requestedAt;
  final Value<DateTime?> reviewedAt;
  final Value<DateTime?> completedAt;
  final Value<int> rowid;
  const PayoutRequestsCompanion({
    this.id = const Value.absent(),
    this.userId = const Value.absent(),
    this.amountMinorUnits = const Value.absent(),
    this.status = const Value.absent(),
    this.paymentUtr = const Value.absent(),
    this.requestedAt = const Value.absent(),
    this.reviewedAt = const Value.absent(),
    this.completedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  PayoutRequestsCompanion.insert({
    required String id,
    required String userId,
    required int amountMinorUnits,
    required String status,
    this.paymentUtr = const Value.absent(),
    required DateTime requestedAt,
    this.reviewedAt = const Value.absent(),
    this.completedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       userId = Value(userId),
       amountMinorUnits = Value(amountMinorUnits),
       status = Value(status),
       requestedAt = Value(requestedAt);
  static Insertable<PayoutRequest> custom({
    Expression<String>? id,
    Expression<String>? userId,
    Expression<int>? amountMinorUnits,
    Expression<String>? status,
    Expression<String>? paymentUtr,
    Expression<DateTime>? requestedAt,
    Expression<DateTime>? reviewedAt,
    Expression<DateTime>? completedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (userId != null) 'user_id': userId,
      if (amountMinorUnits != null) 'amount_minor_units': amountMinorUnits,
      if (status != null) 'status': status,
      if (paymentUtr != null) 'payment_utr': paymentUtr,
      if (requestedAt != null) 'requested_at': requestedAt,
      if (reviewedAt != null) 'reviewed_at': reviewedAt,
      if (completedAt != null) 'completed_at': completedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  PayoutRequestsCompanion copyWith({
    Value<String>? id,
    Value<String>? userId,
    Value<int>? amountMinorUnits,
    Value<String>? status,
    Value<String?>? paymentUtr,
    Value<DateTime>? requestedAt,
    Value<DateTime?>? reviewedAt,
    Value<DateTime?>? completedAt,
    Value<int>? rowid,
  }) {
    return PayoutRequestsCompanion(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      amountMinorUnits: amountMinorUnits ?? this.amountMinorUnits,
      status: status ?? this.status,
      paymentUtr: paymentUtr ?? this.paymentUtr,
      requestedAt: requestedAt ?? this.requestedAt,
      reviewedAt: reviewedAt ?? this.reviewedAt,
      completedAt: completedAt ?? this.completedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (userId.present) {
      map['user_id'] = Variable<String>(userId.value);
    }
    if (amountMinorUnits.present) {
      map['amount_minor_units'] = Variable<int>(amountMinorUnits.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (paymentUtr.present) {
      map['payment_utr'] = Variable<String>(paymentUtr.value);
    }
    if (requestedAt.present) {
      map['requested_at'] = Variable<DateTime>(requestedAt.value);
    }
    if (reviewedAt.present) {
      map['reviewed_at'] = Variable<DateTime>(reviewedAt.value);
    }
    if (completedAt.present) {
      map['completed_at'] = Variable<DateTime>(completedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('PayoutRequestsCompanion(')
          ..write('id: $id, ')
          ..write('userId: $userId, ')
          ..write('amountMinorUnits: $amountMinorUnits, ')
          ..write('status: $status, ')
          ..write('paymentUtr: $paymentUtr, ')
          ..write('requestedAt: $requestedAt, ')
          ..write('reviewedAt: $reviewedAt, ')
          ..write('completedAt: $completedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $AppPreferencesTable extends AppPreferences
    with TableInfo<$AppPreferencesTable, AppPreference> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $AppPreferencesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _keyMeta = const VerificationMeta('key');
  @override
  late final GeneratedColumn<String> key = GeneratedColumn<String>(
    'key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _valueMeta = const VerificationMeta('value');
  @override
  late final GeneratedColumn<String> value = GeneratedColumn<String>(
    'value',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [key, value, updatedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'app_preferences';
  @override
  VerificationContext validateIntegrity(
    Insertable<AppPreference> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('key')) {
      context.handle(
        _keyMeta,
        key.isAcceptableOrUnknown(data['key']!, _keyMeta),
      );
    } else if (isInserting) {
      context.missing(_keyMeta);
    }
    if (data.containsKey('value')) {
      context.handle(
        _valueMeta,
        value.isAcceptableOrUnknown(data['value']!, _valueMeta),
      );
    } else if (isInserting) {
      context.missing(_valueMeta);
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {key};
  @override
  AppPreference map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return AppPreference(
      key: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}key'],
      )!,
      value: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}value'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $AppPreferencesTable createAlias(String alias) {
    return $AppPreferencesTable(attachedDatabase, alias);
  }
}

class AppPreference extends DataClass implements Insertable<AppPreference> {
  final String key;
  final String value;
  final DateTime updatedAt;
  const AppPreference({
    required this.key,
    required this.value,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['key'] = Variable<String>(key);
    map['value'] = Variable<String>(value);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  AppPreferencesCompanion toCompanion(bool nullToAbsent) {
    return AppPreferencesCompanion(
      key: Value(key),
      value: Value(value),
      updatedAt: Value(updatedAt),
    );
  }

  factory AppPreference.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return AppPreference(
      key: serializer.fromJson<String>(json['key']),
      value: serializer.fromJson<String>(json['value']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'key': serializer.toJson<String>(key),
      'value': serializer.toJson<String>(value),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  AppPreference copyWith({String? key, String? value, DateTime? updatedAt}) =>
      AppPreference(
        key: key ?? this.key,
        value: value ?? this.value,
        updatedAt: updatedAt ?? this.updatedAt,
      );
  AppPreference copyWithCompanion(AppPreferencesCompanion data) {
    return AppPreference(
      key: data.key.present ? data.key.value : this.key,
      value: data.value.present ? data.value.value : this.value,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('AppPreference(')
          ..write('key: $key, ')
          ..write('value: $value, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(key, value, updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is AppPreference &&
          other.key == this.key &&
          other.value == this.value &&
          other.updatedAt == this.updatedAt);
}

class AppPreferencesCompanion extends UpdateCompanion<AppPreference> {
  final Value<String> key;
  final Value<String> value;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const AppPreferencesCompanion({
    this.key = const Value.absent(),
    this.value = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  AppPreferencesCompanion.insert({
    required String key,
    required String value,
    required DateTime updatedAt,
    this.rowid = const Value.absent(),
  }) : key = Value(key),
       value = Value(value),
       updatedAt = Value(updatedAt);
  static Insertable<AppPreference> custom({
    Expression<String>? key,
    Expression<String>? value,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (key != null) 'key': key,
      if (value != null) 'value': value,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  AppPreferencesCompanion copyWith({
    Value<String>? key,
    Value<String>? value,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return AppPreferencesCompanion(
      key: key ?? this.key,
      value: value ?? this.value,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (key.present) {
      map['key'] = Variable<String>(key.value);
    }
    if (value.present) {
      map['value'] = Variable<String>(value.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('AppPreferencesCompanion(')
          ..write('key: $key, ')
          ..write('value: $value, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $WalletAccountsTable walletAccounts = $WalletAccountsTable(this);
  late final $LedgerEntriesTable ledgerEntries = $LedgerEntriesTable(this);
  late final $ReferralCodesTable referralCodes = $ReferralCodesTable(this);
  late final $ReferralItemsTable referralItems = $ReferralItemsTable(this);
  late final $PayoutRequestsTable payoutRequests = $PayoutRequestsTable(this);
  late final $AppPreferencesTable appPreferences = $AppPreferencesTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    walletAccounts,
    ledgerEntries,
    referralCodes,
    referralItems,
    payoutRequests,
    appPreferences,
  ];
}

typedef $$WalletAccountsTableCreateCompanionBuilder =
    WalletAccountsCompanion Function({
      required String userId,
      Value<String> currency,
      Value<int> pendingMinorUnits,
      Value<int> availableMinorUnits,
      Value<int> reservedMinorUnits,
      Value<int> withdrawnMinorUnits,
      required DateTime updatedAt,
      Value<DateTime?> serverUpdatedAt,
      Value<int> rowid,
    });
typedef $$WalletAccountsTableUpdateCompanionBuilder =
    WalletAccountsCompanion Function({
      Value<String> userId,
      Value<String> currency,
      Value<int> pendingMinorUnits,
      Value<int> availableMinorUnits,
      Value<int> reservedMinorUnits,
      Value<int> withdrawnMinorUnits,
      Value<DateTime> updatedAt,
      Value<DateTime?> serverUpdatedAt,
      Value<int> rowid,
    });

class $$WalletAccountsTableFilterComposer
    extends Composer<_$AppDatabase, $WalletAccountsTable> {
  $$WalletAccountsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get userId => $composableBuilder(
    column: $table.userId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get currency => $composableBuilder(
    column: $table.currency,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get pendingMinorUnits => $composableBuilder(
    column: $table.pendingMinorUnits,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get availableMinorUnits => $composableBuilder(
    column: $table.availableMinorUnits,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get reservedMinorUnits => $composableBuilder(
    column: $table.reservedMinorUnits,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get withdrawnMinorUnits => $composableBuilder(
    column: $table.withdrawnMinorUnits,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get serverUpdatedAt => $composableBuilder(
    column: $table.serverUpdatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$WalletAccountsTableOrderingComposer
    extends Composer<_$AppDatabase, $WalletAccountsTable> {
  $$WalletAccountsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get userId => $composableBuilder(
    column: $table.userId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get currency => $composableBuilder(
    column: $table.currency,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get pendingMinorUnits => $composableBuilder(
    column: $table.pendingMinorUnits,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get availableMinorUnits => $composableBuilder(
    column: $table.availableMinorUnits,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get reservedMinorUnits => $composableBuilder(
    column: $table.reservedMinorUnits,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get withdrawnMinorUnits => $composableBuilder(
    column: $table.withdrawnMinorUnits,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get serverUpdatedAt => $composableBuilder(
    column: $table.serverUpdatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$WalletAccountsTableAnnotationComposer
    extends Composer<_$AppDatabase, $WalletAccountsTable> {
  $$WalletAccountsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get userId =>
      $composableBuilder(column: $table.userId, builder: (column) => column);

  GeneratedColumn<String> get currency =>
      $composableBuilder(column: $table.currency, builder: (column) => column);

  GeneratedColumn<int> get pendingMinorUnits => $composableBuilder(
    column: $table.pendingMinorUnits,
    builder: (column) => column,
  );

  GeneratedColumn<int> get availableMinorUnits => $composableBuilder(
    column: $table.availableMinorUnits,
    builder: (column) => column,
  );

  GeneratedColumn<int> get reservedMinorUnits => $composableBuilder(
    column: $table.reservedMinorUnits,
    builder: (column) => column,
  );

  GeneratedColumn<int> get withdrawnMinorUnits => $composableBuilder(
    column: $table.withdrawnMinorUnits,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  GeneratedColumn<DateTime> get serverUpdatedAt => $composableBuilder(
    column: $table.serverUpdatedAt,
    builder: (column) => column,
  );
}

class $$WalletAccountsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $WalletAccountsTable,
          WalletAccount,
          $$WalletAccountsTableFilterComposer,
          $$WalletAccountsTableOrderingComposer,
          $$WalletAccountsTableAnnotationComposer,
          $$WalletAccountsTableCreateCompanionBuilder,
          $$WalletAccountsTableUpdateCompanionBuilder,
          (
            WalletAccount,
            BaseReferences<_$AppDatabase, $WalletAccountsTable, WalletAccount>,
          ),
          WalletAccount,
          PrefetchHooks Function()
        > {
  $$WalletAccountsTableTableManager(
    _$AppDatabase db,
    $WalletAccountsTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$WalletAccountsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$WalletAccountsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$WalletAccountsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> userId = const Value.absent(),
                Value<String> currency = const Value.absent(),
                Value<int> pendingMinorUnits = const Value.absent(),
                Value<int> availableMinorUnits = const Value.absent(),
                Value<int> reservedMinorUnits = const Value.absent(),
                Value<int> withdrawnMinorUnits = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<DateTime?> serverUpdatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => WalletAccountsCompanion(
                userId: userId,
                currency: currency,
                pendingMinorUnits: pendingMinorUnits,
                availableMinorUnits: availableMinorUnits,
                reservedMinorUnits: reservedMinorUnits,
                withdrawnMinorUnits: withdrawnMinorUnits,
                updatedAt: updatedAt,
                serverUpdatedAt: serverUpdatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String userId,
                Value<String> currency = const Value.absent(),
                Value<int> pendingMinorUnits = const Value.absent(),
                Value<int> availableMinorUnits = const Value.absent(),
                Value<int> reservedMinorUnits = const Value.absent(),
                Value<int> withdrawnMinorUnits = const Value.absent(),
                required DateTime updatedAt,
                Value<DateTime?> serverUpdatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => WalletAccountsCompanion.insert(
                userId: userId,
                currency: currency,
                pendingMinorUnits: pendingMinorUnits,
                availableMinorUnits: availableMinorUnits,
                reservedMinorUnits: reservedMinorUnits,
                withdrawnMinorUnits: withdrawnMinorUnits,
                updatedAt: updatedAt,
                serverUpdatedAt: serverUpdatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$WalletAccountsTable, WalletAccount>(table),
                  BaseReferences<
                    _$AppDatabase,
                    $WalletAccountsTable,
                    WalletAccount
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$WalletAccountsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $WalletAccountsTable,
      WalletAccount,
      $$WalletAccountsTableFilterComposer,
      $$WalletAccountsTableOrderingComposer,
      $$WalletAccountsTableAnnotationComposer,
      $$WalletAccountsTableCreateCompanionBuilder,
      $$WalletAccountsTableUpdateCompanionBuilder,
      (
        WalletAccount,
        BaseReferences<_$AppDatabase, $WalletAccountsTable, WalletAccount>,
      ),
      WalletAccount,
      PrefetchHooks Function()
    >;
typedef $$LedgerEntriesTableCreateCompanionBuilder =
    LedgerEntriesCompanion Function({
      required String id,
      required String userId,
      required String transactionType,
      Value<String?> referenceType,
      Value<String?> referenceId,
      required int amountMinorUnits,
      required String bucket,
      required DateTime createdAt,
      Value<int> rowid,
    });
typedef $$LedgerEntriesTableUpdateCompanionBuilder =
    LedgerEntriesCompanion Function({
      Value<String> id,
      Value<String> userId,
      Value<String> transactionType,
      Value<String?> referenceType,
      Value<String?> referenceId,
      Value<int> amountMinorUnits,
      Value<String> bucket,
      Value<DateTime> createdAt,
      Value<int> rowid,
    });

class $$LedgerEntriesTableFilterComposer
    extends Composer<_$AppDatabase, $LedgerEntriesTable> {
  $$LedgerEntriesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get userId => $composableBuilder(
    column: $table.userId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get transactionType => $composableBuilder(
    column: $table.transactionType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get referenceType => $composableBuilder(
    column: $table.referenceType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get referenceId => $composableBuilder(
    column: $table.referenceId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get amountMinorUnits => $composableBuilder(
    column: $table.amountMinorUnits,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get bucket => $composableBuilder(
    column: $table.bucket,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LedgerEntriesTableOrderingComposer
    extends Composer<_$AppDatabase, $LedgerEntriesTable> {
  $$LedgerEntriesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get userId => $composableBuilder(
    column: $table.userId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get transactionType => $composableBuilder(
    column: $table.transactionType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get referenceType => $composableBuilder(
    column: $table.referenceType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get referenceId => $composableBuilder(
    column: $table.referenceId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get amountMinorUnits => $composableBuilder(
    column: $table.amountMinorUnits,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get bucket => $composableBuilder(
    column: $table.bucket,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LedgerEntriesTableAnnotationComposer
    extends Composer<_$AppDatabase, $LedgerEntriesTable> {
  $$LedgerEntriesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get userId =>
      $composableBuilder(column: $table.userId, builder: (column) => column);

  GeneratedColumn<String> get transactionType => $composableBuilder(
    column: $table.transactionType,
    builder: (column) => column,
  );

  GeneratedColumn<String> get referenceType => $composableBuilder(
    column: $table.referenceType,
    builder: (column) => column,
  );

  GeneratedColumn<String> get referenceId => $composableBuilder(
    column: $table.referenceId,
    builder: (column) => column,
  );

  GeneratedColumn<int> get amountMinorUnits => $composableBuilder(
    column: $table.amountMinorUnits,
    builder: (column) => column,
  );

  GeneratedColumn<String> get bucket =>
      $composableBuilder(column: $table.bucket, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);
}

class $$LedgerEntriesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LedgerEntriesTable,
          LedgerEntry,
          $$LedgerEntriesTableFilterComposer,
          $$LedgerEntriesTableOrderingComposer,
          $$LedgerEntriesTableAnnotationComposer,
          $$LedgerEntriesTableCreateCompanionBuilder,
          $$LedgerEntriesTableUpdateCompanionBuilder,
          (
            LedgerEntry,
            BaseReferences<_$AppDatabase, $LedgerEntriesTable, LedgerEntry>,
          ),
          LedgerEntry,
          PrefetchHooks Function()
        > {
  $$LedgerEntriesTableTableManager(_$AppDatabase db, $LedgerEntriesTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LedgerEntriesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LedgerEntriesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LedgerEntriesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> userId = const Value.absent(),
                Value<String> transactionType = const Value.absent(),
                Value<String?> referenceType = const Value.absent(),
                Value<String?> referenceId = const Value.absent(),
                Value<int> amountMinorUnits = const Value.absent(),
                Value<String> bucket = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LedgerEntriesCompanion(
                id: id,
                userId: userId,
                transactionType: transactionType,
                referenceType: referenceType,
                referenceId: referenceId,
                amountMinorUnits: amountMinorUnits,
                bucket: bucket,
                createdAt: createdAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String userId,
                required String transactionType,
                Value<String?> referenceType = const Value.absent(),
                Value<String?> referenceId = const Value.absent(),
                required int amountMinorUnits,
                required String bucket,
                required DateTime createdAt,
                Value<int> rowid = const Value.absent(),
              }) => LedgerEntriesCompanion.insert(
                id: id,
                userId: userId,
                transactionType: transactionType,
                referenceType: referenceType,
                referenceId: referenceId,
                amountMinorUnits: amountMinorUnits,
                bucket: bucket,
                createdAt: createdAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$LedgerEntriesTable, LedgerEntry>(table),
                  BaseReferences<
                    _$AppDatabase,
                    $LedgerEntriesTable,
                    LedgerEntry
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LedgerEntriesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LedgerEntriesTable,
      LedgerEntry,
      $$LedgerEntriesTableFilterComposer,
      $$LedgerEntriesTableOrderingComposer,
      $$LedgerEntriesTableAnnotationComposer,
      $$LedgerEntriesTableCreateCompanionBuilder,
      $$LedgerEntriesTableUpdateCompanionBuilder,
      (
        LedgerEntry,
        BaseReferences<_$AppDatabase, $LedgerEntriesTable, LedgerEntry>,
      ),
      LedgerEntry,
      PrefetchHooks Function()
    >;
typedef $$ReferralCodesTableCreateCompanionBuilder =
    ReferralCodesCompanion Function({
      required String id,
      required String ownerUserId,
      required String publicCode,
      required String shareUrl,
      required String state,
      Value<bool> isActive,
      Value<DateTime?> expiresAt,
      Value<int> clickCount,
      Value<int> uniqueClickCount,
      Value<int> referralCount,
      Value<int> conversionCount,
      required DateTime createdAt,
      Value<int> rowid,
    });
typedef $$ReferralCodesTableUpdateCompanionBuilder =
    ReferralCodesCompanion Function({
      Value<String> id,
      Value<String> ownerUserId,
      Value<String> publicCode,
      Value<String> shareUrl,
      Value<String> state,
      Value<bool> isActive,
      Value<DateTime?> expiresAt,
      Value<int> clickCount,
      Value<int> uniqueClickCount,
      Value<int> referralCount,
      Value<int> conversionCount,
      Value<DateTime> createdAt,
      Value<int> rowid,
    });

class $$ReferralCodesTableFilterComposer
    extends Composer<_$AppDatabase, $ReferralCodesTable> {
  $$ReferralCodesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get ownerUserId => $composableBuilder(
    column: $table.ownerUserId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get publicCode => $composableBuilder(
    column: $table.publicCode,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get shareUrl => $composableBuilder(
    column: $table.shareUrl,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get state => $composableBuilder(
    column: $table.state,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isActive => $composableBuilder(
    column: $table.isActive,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get expiresAt => $composableBuilder(
    column: $table.expiresAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get clickCount => $composableBuilder(
    column: $table.clickCount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get uniqueClickCount => $composableBuilder(
    column: $table.uniqueClickCount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get referralCount => $composableBuilder(
    column: $table.referralCount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get conversionCount => $composableBuilder(
    column: $table.conversionCount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$ReferralCodesTableOrderingComposer
    extends Composer<_$AppDatabase, $ReferralCodesTable> {
  $$ReferralCodesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get ownerUserId => $composableBuilder(
    column: $table.ownerUserId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get publicCode => $composableBuilder(
    column: $table.publicCode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get shareUrl => $composableBuilder(
    column: $table.shareUrl,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get state => $composableBuilder(
    column: $table.state,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isActive => $composableBuilder(
    column: $table.isActive,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get expiresAt => $composableBuilder(
    column: $table.expiresAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get clickCount => $composableBuilder(
    column: $table.clickCount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get uniqueClickCount => $composableBuilder(
    column: $table.uniqueClickCount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get referralCount => $composableBuilder(
    column: $table.referralCount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get conversionCount => $composableBuilder(
    column: $table.conversionCount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$ReferralCodesTableAnnotationComposer
    extends Composer<_$AppDatabase, $ReferralCodesTable> {
  $$ReferralCodesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get ownerUserId => $composableBuilder(
    column: $table.ownerUserId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get publicCode => $composableBuilder(
    column: $table.publicCode,
    builder: (column) => column,
  );

  GeneratedColumn<String> get shareUrl =>
      $composableBuilder(column: $table.shareUrl, builder: (column) => column);

  GeneratedColumn<String> get state =>
      $composableBuilder(column: $table.state, builder: (column) => column);

  GeneratedColumn<bool> get isActive =>
      $composableBuilder(column: $table.isActive, builder: (column) => column);

  GeneratedColumn<DateTime> get expiresAt =>
      $composableBuilder(column: $table.expiresAt, builder: (column) => column);

  GeneratedColumn<int> get clickCount => $composableBuilder(
    column: $table.clickCount,
    builder: (column) => column,
  );

  GeneratedColumn<int> get uniqueClickCount => $composableBuilder(
    column: $table.uniqueClickCount,
    builder: (column) => column,
  );

  GeneratedColumn<int> get referralCount => $composableBuilder(
    column: $table.referralCount,
    builder: (column) => column,
  );

  GeneratedColumn<int> get conversionCount => $composableBuilder(
    column: $table.conversionCount,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);
}

class $$ReferralCodesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $ReferralCodesTable,
          ReferralCode,
          $$ReferralCodesTableFilterComposer,
          $$ReferralCodesTableOrderingComposer,
          $$ReferralCodesTableAnnotationComposer,
          $$ReferralCodesTableCreateCompanionBuilder,
          $$ReferralCodesTableUpdateCompanionBuilder,
          (
            ReferralCode,
            BaseReferences<_$AppDatabase, $ReferralCodesTable, ReferralCode>,
          ),
          ReferralCode,
          PrefetchHooks Function()
        > {
  $$ReferralCodesTableTableManager(_$AppDatabase db, $ReferralCodesTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$ReferralCodesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$ReferralCodesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$ReferralCodesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> ownerUserId = const Value.absent(),
                Value<String> publicCode = const Value.absent(),
                Value<String> shareUrl = const Value.absent(),
                Value<String> state = const Value.absent(),
                Value<bool> isActive = const Value.absent(),
                Value<DateTime?> expiresAt = const Value.absent(),
                Value<int> clickCount = const Value.absent(),
                Value<int> uniqueClickCount = const Value.absent(),
                Value<int> referralCount = const Value.absent(),
                Value<int> conversionCount = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => ReferralCodesCompanion(
                id: id,
                ownerUserId: ownerUserId,
                publicCode: publicCode,
                shareUrl: shareUrl,
                state: state,
                isActive: isActive,
                expiresAt: expiresAt,
                clickCount: clickCount,
                uniqueClickCount: uniqueClickCount,
                referralCount: referralCount,
                conversionCount: conversionCount,
                createdAt: createdAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String ownerUserId,
                required String publicCode,
                required String shareUrl,
                required String state,
                Value<bool> isActive = const Value.absent(),
                Value<DateTime?> expiresAt = const Value.absent(),
                Value<int> clickCount = const Value.absent(),
                Value<int> uniqueClickCount = const Value.absent(),
                Value<int> referralCount = const Value.absent(),
                Value<int> conversionCount = const Value.absent(),
                required DateTime createdAt,
                Value<int> rowid = const Value.absent(),
              }) => ReferralCodesCompanion.insert(
                id: id,
                ownerUserId: ownerUserId,
                publicCode: publicCode,
                shareUrl: shareUrl,
                state: state,
                isActive: isActive,
                expiresAt: expiresAt,
                clickCount: clickCount,
                uniqueClickCount: uniqueClickCount,
                referralCount: referralCount,
                conversionCount: conversionCount,
                createdAt: createdAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$ReferralCodesTable, ReferralCode>(table),
                  BaseReferences<
                    _$AppDatabase,
                    $ReferralCodesTable,
                    ReferralCode
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$ReferralCodesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $ReferralCodesTable,
      ReferralCode,
      $$ReferralCodesTableFilterComposer,
      $$ReferralCodesTableOrderingComposer,
      $$ReferralCodesTableAnnotationComposer,
      $$ReferralCodesTableCreateCompanionBuilder,
      $$ReferralCodesTableUpdateCompanionBuilder,
      (
        ReferralCode,
        BaseReferences<_$AppDatabase, $ReferralCodesTable, ReferralCode>,
      ),
      ReferralCode,
      PrefetchHooks Function()
    >;
typedef $$ReferralItemsTableCreateCompanionBuilder =
    ReferralItemsCompanion Function({
      required String id,
      required String publicCode,
      required String referrerUserId,
      required String referredUserId,
      required String attributionStatus,
      required String currentMilestone,
      required String chatAccessState,
      required DateTime attributedAt,
      Value<DateTime?> signedUpAt,
      Value<DateTime?> installLoginVerifiedAt,
      Value<DateTime?> chatUnlockedAt,
      required DateTime cachedAt,
      Value<int> rowid,
    });
typedef $$ReferralItemsTableUpdateCompanionBuilder =
    ReferralItemsCompanion Function({
      Value<String> id,
      Value<String> publicCode,
      Value<String> referrerUserId,
      Value<String> referredUserId,
      Value<String> attributionStatus,
      Value<String> currentMilestone,
      Value<String> chatAccessState,
      Value<DateTime> attributedAt,
      Value<DateTime?> signedUpAt,
      Value<DateTime?> installLoginVerifiedAt,
      Value<DateTime?> chatUnlockedAt,
      Value<DateTime> cachedAt,
      Value<int> rowid,
    });

class $$ReferralItemsTableFilterComposer
    extends Composer<_$AppDatabase, $ReferralItemsTable> {
  $$ReferralItemsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get publicCode => $composableBuilder(
    column: $table.publicCode,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get referrerUserId => $composableBuilder(
    column: $table.referrerUserId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get referredUserId => $composableBuilder(
    column: $table.referredUserId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get attributionStatus => $composableBuilder(
    column: $table.attributionStatus,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get currentMilestone => $composableBuilder(
    column: $table.currentMilestone,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get chatAccessState => $composableBuilder(
    column: $table.chatAccessState,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get attributedAt => $composableBuilder(
    column: $table.attributedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get signedUpAt => $composableBuilder(
    column: $table.signedUpAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get installLoginVerifiedAt => $composableBuilder(
    column: $table.installLoginVerifiedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get chatUnlockedAt => $composableBuilder(
    column: $table.chatUnlockedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$ReferralItemsTableOrderingComposer
    extends Composer<_$AppDatabase, $ReferralItemsTable> {
  $$ReferralItemsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get publicCode => $composableBuilder(
    column: $table.publicCode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get referrerUserId => $composableBuilder(
    column: $table.referrerUserId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get referredUserId => $composableBuilder(
    column: $table.referredUserId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get attributionStatus => $composableBuilder(
    column: $table.attributionStatus,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get currentMilestone => $composableBuilder(
    column: $table.currentMilestone,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get chatAccessState => $composableBuilder(
    column: $table.chatAccessState,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get attributedAt => $composableBuilder(
    column: $table.attributedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get signedUpAt => $composableBuilder(
    column: $table.signedUpAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get installLoginVerifiedAt => $composableBuilder(
    column: $table.installLoginVerifiedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get chatUnlockedAt => $composableBuilder(
    column: $table.chatUnlockedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$ReferralItemsTableAnnotationComposer
    extends Composer<_$AppDatabase, $ReferralItemsTable> {
  $$ReferralItemsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get publicCode => $composableBuilder(
    column: $table.publicCode,
    builder: (column) => column,
  );

  GeneratedColumn<String> get referrerUserId => $composableBuilder(
    column: $table.referrerUserId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get referredUserId => $composableBuilder(
    column: $table.referredUserId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get attributionStatus => $composableBuilder(
    column: $table.attributionStatus,
    builder: (column) => column,
  );

  GeneratedColumn<String> get currentMilestone => $composableBuilder(
    column: $table.currentMilestone,
    builder: (column) => column,
  );

  GeneratedColumn<String> get chatAccessState => $composableBuilder(
    column: $table.chatAccessState,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get attributedAt => $composableBuilder(
    column: $table.attributedAt,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get signedUpAt => $composableBuilder(
    column: $table.signedUpAt,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get installLoginVerifiedAt => $composableBuilder(
    column: $table.installLoginVerifiedAt,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get chatUnlockedAt => $composableBuilder(
    column: $table.chatUnlockedAt,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get cachedAt =>
      $composableBuilder(column: $table.cachedAt, builder: (column) => column);
}

class $$ReferralItemsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $ReferralItemsTable,
          ReferralItem,
          $$ReferralItemsTableFilterComposer,
          $$ReferralItemsTableOrderingComposer,
          $$ReferralItemsTableAnnotationComposer,
          $$ReferralItemsTableCreateCompanionBuilder,
          $$ReferralItemsTableUpdateCompanionBuilder,
          (
            ReferralItem,
            BaseReferences<_$AppDatabase, $ReferralItemsTable, ReferralItem>,
          ),
          ReferralItem,
          PrefetchHooks Function()
        > {
  $$ReferralItemsTableTableManager(_$AppDatabase db, $ReferralItemsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$ReferralItemsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$ReferralItemsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$ReferralItemsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> publicCode = const Value.absent(),
                Value<String> referrerUserId = const Value.absent(),
                Value<String> referredUserId = const Value.absent(),
                Value<String> attributionStatus = const Value.absent(),
                Value<String> currentMilestone = const Value.absent(),
                Value<String> chatAccessState = const Value.absent(),
                Value<DateTime> attributedAt = const Value.absent(),
                Value<DateTime?> signedUpAt = const Value.absent(),
                Value<DateTime?> installLoginVerifiedAt = const Value.absent(),
                Value<DateTime?> chatUnlockedAt = const Value.absent(),
                Value<DateTime> cachedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => ReferralItemsCompanion(
                id: id,
                publicCode: publicCode,
                referrerUserId: referrerUserId,
                referredUserId: referredUserId,
                attributionStatus: attributionStatus,
                currentMilestone: currentMilestone,
                chatAccessState: chatAccessState,
                attributedAt: attributedAt,
                signedUpAt: signedUpAt,
                installLoginVerifiedAt: installLoginVerifiedAt,
                chatUnlockedAt: chatUnlockedAt,
                cachedAt: cachedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String publicCode,
                required String referrerUserId,
                required String referredUserId,
                required String attributionStatus,
                required String currentMilestone,
                required String chatAccessState,
                required DateTime attributedAt,
                Value<DateTime?> signedUpAt = const Value.absent(),
                Value<DateTime?> installLoginVerifiedAt = const Value.absent(),
                Value<DateTime?> chatUnlockedAt = const Value.absent(),
                required DateTime cachedAt,
                Value<int> rowid = const Value.absent(),
              }) => ReferralItemsCompanion.insert(
                id: id,
                publicCode: publicCode,
                referrerUserId: referrerUserId,
                referredUserId: referredUserId,
                attributionStatus: attributionStatus,
                currentMilestone: currentMilestone,
                chatAccessState: chatAccessState,
                attributedAt: attributedAt,
                signedUpAt: signedUpAt,
                installLoginVerifiedAt: installLoginVerifiedAt,
                chatUnlockedAt: chatUnlockedAt,
                cachedAt: cachedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$ReferralItemsTable, ReferralItem>(table),
                  BaseReferences<
                    _$AppDatabase,
                    $ReferralItemsTable,
                    ReferralItem
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$ReferralItemsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $ReferralItemsTable,
      ReferralItem,
      $$ReferralItemsTableFilterComposer,
      $$ReferralItemsTableOrderingComposer,
      $$ReferralItemsTableAnnotationComposer,
      $$ReferralItemsTableCreateCompanionBuilder,
      $$ReferralItemsTableUpdateCompanionBuilder,
      (
        ReferralItem,
        BaseReferences<_$AppDatabase, $ReferralItemsTable, ReferralItem>,
      ),
      ReferralItem,
      PrefetchHooks Function()
    >;
typedef $$PayoutRequestsTableCreateCompanionBuilder =
    PayoutRequestsCompanion Function({
      required String id,
      required String userId,
      required int amountMinorUnits,
      required String status,
      Value<String?> paymentUtr,
      required DateTime requestedAt,
      Value<DateTime?> reviewedAt,
      Value<DateTime?> completedAt,
      Value<int> rowid,
    });
typedef $$PayoutRequestsTableUpdateCompanionBuilder =
    PayoutRequestsCompanion Function({
      Value<String> id,
      Value<String> userId,
      Value<int> amountMinorUnits,
      Value<String> status,
      Value<String?> paymentUtr,
      Value<DateTime> requestedAt,
      Value<DateTime?> reviewedAt,
      Value<DateTime?> completedAt,
      Value<int> rowid,
    });

class $$PayoutRequestsTableFilterComposer
    extends Composer<_$AppDatabase, $PayoutRequestsTable> {
  $$PayoutRequestsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get userId => $composableBuilder(
    column: $table.userId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get amountMinorUnits => $composableBuilder(
    column: $table.amountMinorUnits,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get paymentUtr => $composableBuilder(
    column: $table.paymentUtr,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get requestedAt => $composableBuilder(
    column: $table.requestedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get reviewedAt => $composableBuilder(
    column: $table.reviewedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get completedAt => $composableBuilder(
    column: $table.completedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$PayoutRequestsTableOrderingComposer
    extends Composer<_$AppDatabase, $PayoutRequestsTable> {
  $$PayoutRequestsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get userId => $composableBuilder(
    column: $table.userId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get amountMinorUnits => $composableBuilder(
    column: $table.amountMinorUnits,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get paymentUtr => $composableBuilder(
    column: $table.paymentUtr,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get requestedAt => $composableBuilder(
    column: $table.requestedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get reviewedAt => $composableBuilder(
    column: $table.reviewedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get completedAt => $composableBuilder(
    column: $table.completedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$PayoutRequestsTableAnnotationComposer
    extends Composer<_$AppDatabase, $PayoutRequestsTable> {
  $$PayoutRequestsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get userId =>
      $composableBuilder(column: $table.userId, builder: (column) => column);

  GeneratedColumn<int> get amountMinorUnits => $composableBuilder(
    column: $table.amountMinorUnits,
    builder: (column) => column,
  );

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<String> get paymentUtr => $composableBuilder(
    column: $table.paymentUtr,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get requestedAt => $composableBuilder(
    column: $table.requestedAt,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get reviewedAt => $composableBuilder(
    column: $table.reviewedAt,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get completedAt => $composableBuilder(
    column: $table.completedAt,
    builder: (column) => column,
  );
}

class $$PayoutRequestsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $PayoutRequestsTable,
          PayoutRequest,
          $$PayoutRequestsTableFilterComposer,
          $$PayoutRequestsTableOrderingComposer,
          $$PayoutRequestsTableAnnotationComposer,
          $$PayoutRequestsTableCreateCompanionBuilder,
          $$PayoutRequestsTableUpdateCompanionBuilder,
          (
            PayoutRequest,
            BaseReferences<_$AppDatabase, $PayoutRequestsTable, PayoutRequest>,
          ),
          PayoutRequest,
          PrefetchHooks Function()
        > {
  $$PayoutRequestsTableTableManager(
    _$AppDatabase db,
    $PayoutRequestsTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$PayoutRequestsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$PayoutRequestsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$PayoutRequestsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> userId = const Value.absent(),
                Value<int> amountMinorUnits = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<String?> paymentUtr = const Value.absent(),
                Value<DateTime> requestedAt = const Value.absent(),
                Value<DateTime?> reviewedAt = const Value.absent(),
                Value<DateTime?> completedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => PayoutRequestsCompanion(
                id: id,
                userId: userId,
                amountMinorUnits: amountMinorUnits,
                status: status,
                paymentUtr: paymentUtr,
                requestedAt: requestedAt,
                reviewedAt: reviewedAt,
                completedAt: completedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String userId,
                required int amountMinorUnits,
                required String status,
                Value<String?> paymentUtr = const Value.absent(),
                required DateTime requestedAt,
                Value<DateTime?> reviewedAt = const Value.absent(),
                Value<DateTime?> completedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => PayoutRequestsCompanion.insert(
                id: id,
                userId: userId,
                amountMinorUnits: amountMinorUnits,
                status: status,
                paymentUtr: paymentUtr,
                requestedAt: requestedAt,
                reviewedAt: reviewedAt,
                completedAt: completedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$PayoutRequestsTable, PayoutRequest>(table),
                  BaseReferences<
                    _$AppDatabase,
                    $PayoutRequestsTable,
                    PayoutRequest
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$PayoutRequestsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $PayoutRequestsTable,
      PayoutRequest,
      $$PayoutRequestsTableFilterComposer,
      $$PayoutRequestsTableOrderingComposer,
      $$PayoutRequestsTableAnnotationComposer,
      $$PayoutRequestsTableCreateCompanionBuilder,
      $$PayoutRequestsTableUpdateCompanionBuilder,
      (
        PayoutRequest,
        BaseReferences<_$AppDatabase, $PayoutRequestsTable, PayoutRequest>,
      ),
      PayoutRequest,
      PrefetchHooks Function()
    >;
typedef $$AppPreferencesTableCreateCompanionBuilder =
    AppPreferencesCompanion Function({
      required String key,
      required String value,
      required DateTime updatedAt,
      Value<int> rowid,
    });
typedef $$AppPreferencesTableUpdateCompanionBuilder =
    AppPreferencesCompanion Function({
      Value<String> key,
      Value<String> value,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

class $$AppPreferencesTableFilterComposer
    extends Composer<_$AppDatabase, $AppPreferencesTable> {
  $$AppPreferencesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get key => $composableBuilder(
    column: $table.key,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get value => $composableBuilder(
    column: $table.value,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$AppPreferencesTableOrderingComposer
    extends Composer<_$AppDatabase, $AppPreferencesTable> {
  $$AppPreferencesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get key => $composableBuilder(
    column: $table.key,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get value => $composableBuilder(
    column: $table.value,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$AppPreferencesTableAnnotationComposer
    extends Composer<_$AppDatabase, $AppPreferencesTable> {
  $$AppPreferencesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get key =>
      $composableBuilder(column: $table.key, builder: (column) => column);

  GeneratedColumn<String> get value =>
      $composableBuilder(column: $table.value, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$AppPreferencesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $AppPreferencesTable,
          AppPreference,
          $$AppPreferencesTableFilterComposer,
          $$AppPreferencesTableOrderingComposer,
          $$AppPreferencesTableAnnotationComposer,
          $$AppPreferencesTableCreateCompanionBuilder,
          $$AppPreferencesTableUpdateCompanionBuilder,
          (
            AppPreference,
            BaseReferences<_$AppDatabase, $AppPreferencesTable, AppPreference>,
          ),
          AppPreference,
          PrefetchHooks Function()
        > {
  $$AppPreferencesTableTableManager(
    _$AppDatabase db,
    $AppPreferencesTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$AppPreferencesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$AppPreferencesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$AppPreferencesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> key = const Value.absent(),
                Value<String> value = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => AppPreferencesCompanion(
                key: key,
                value: value,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String key,
                required String value,
                required DateTime updatedAt,
                Value<int> rowid = const Value.absent(),
              }) => AppPreferencesCompanion.insert(
                key: key,
                value: value,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$AppPreferencesTable, AppPreference>(table),
                  BaseReferences<
                    _$AppDatabase,
                    $AppPreferencesTable,
                    AppPreference
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$AppPreferencesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $AppPreferencesTable,
      AppPreference,
      $$AppPreferencesTableFilterComposer,
      $$AppPreferencesTableOrderingComposer,
      $$AppPreferencesTableAnnotationComposer,
      $$AppPreferencesTableCreateCompanionBuilder,
      $$AppPreferencesTableUpdateCompanionBuilder,
      (
        AppPreference,
        BaseReferences<_$AppDatabase, $AppPreferencesTable, AppPreference>,
      ),
      AppPreference,
      PrefetchHooks Function()
    >;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$WalletAccountsTableTableManager get walletAccounts =>
      $$WalletAccountsTableTableManager(_db, _db.walletAccounts);
  $$LedgerEntriesTableTableManager get ledgerEntries =>
      $$LedgerEntriesTableTableManager(_db, _db.ledgerEntries);
  $$ReferralCodesTableTableManager get referralCodes =>
      $$ReferralCodesTableTableManager(_db, _db.referralCodes);
  $$ReferralItemsTableTableManager get referralItems =>
      $$ReferralItemsTableTableManager(_db, _db.referralItems);
  $$PayoutRequestsTableTableManager get payoutRequests =>
      $$PayoutRequestsTableTableManager(_db, _db.payoutRequests);
  $$AppPreferencesTableTableManager get appPreferences =>
      $$AppPreferencesTableTableManager(_db, _db.appPreferences);
}
