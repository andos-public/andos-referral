import { ConflictException } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import fc from 'fast-check';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { PrismaService } from '../src/prisma/prisma.service';
import { LedgerService } from '../src/wallet/ledger.service';
import {
  LedgerLine,
  WalletBalances,
  ZERO_BALANCES,
  applyLines,
} from '../src/wallet/wallet-balance.util';

/**
 * Property-based tests for the append-only ledger (fast-check + real PostgreSQL).
 *
 * The invariant under test: for ANY sequence of ledger operations, the `wallet_accounts`
 * projection, the independently rebuilt sum of entries, and a pure in-test model must all
 * agree — and guarded operations (reserve/release/complete) must refuse to overdraw.
 */
const AMOUNT = fc.bigInt({ min: 1n, max: 5000n });

type Op =
  | { kind: 'lock'; amount: bigint }
  | { kind: 'releasePending'; amount: bigint }
  | { kind: 'reserve'; amount: bigint }
  | { kind: 'releaseReservation'; amount: bigint }
  | { kind: 'complete'; amount: bigint }
  | { kind: 'reversePending'; amount: bigint }
  | { kind: 'reverseAvailable'; amount: bigint };

const opArbitrary: fc.Arbitrary<Op> = fc.oneof(
  { weight: 3, arbitrary: AMOUNT.map((amount) => ({ kind: 'lock', amount }) as Op) },
  { weight: 2, arbitrary: AMOUNT.map((amount) => ({ kind: 'releasePending', amount }) as Op) },
  { weight: 3, arbitrary: AMOUNT.map((amount) => ({ kind: 'reserve', amount }) as Op) },
  { weight: 2, arbitrary: AMOUNT.map((amount) => ({ kind: 'releaseReservation', amount }) as Op) },
  { weight: 2, arbitrary: AMOUNT.map((amount) => ({ kind: 'complete', amount }) as Op) },
  { weight: 1, arbitrary: AMOUNT.map((amount) => ({ kind: 'reversePending', amount }) as Op) },
  { weight: 1, arbitrary: AMOUNT.map((amount) => ({ kind: 'reverseAvailable', amount }) as Op) },
);

const sequenceArbitrary = fc.array(opArbitrary, { minLength: 1, maxLength: 12 });

describe('Ledger invariants — property-based (e2e, real PostgreSQL)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let ledger: LedgerService;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ rawBody: true });
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    ledger = app.get(LedgerService);
  });

  afterAll(async () => {
    const users = { in: createdUserIds };
    await prisma.walletLedgerEntry.deleteMany({ where: { transaction: { userId: users } } });
    await prisma.walletLedgerTransaction.deleteMany({ where: { userId: users } });
    await prisma.walletAccount.deleteMany({ where: { userId: users } });
    await prisma.user.deleteMany({ where: { id: users } });
    await app.close();
  });

  const newWalletUser = async (): Promise<string> => {
    const suffix = `${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6)}`;
    const user = await prisma.user.create({
      data: { username: `pbt_${suffix}` },
      select: { id: true },
    });
    createdUserIds.push(user.id);
    return user.id;
  };

  const linesFor = (op: Op): LedgerLine[] | null => {
    switch (op.kind) {
      case 'lock':
        return [{ bucket: 'PENDING', amountMinorUnits: op.amount }];
      case 'releasePending':
        return [
          { bucket: 'PENDING', amountMinorUnits: -op.amount },
          { bucket: 'AVAILABLE', amountMinorUnits: op.amount },
        ];
      case 'reserve':
        return [
          { bucket: 'AVAILABLE', amountMinorUnits: -op.amount },
          { bucket: 'RESERVED', amountMinorUnits: op.amount },
        ];
      case 'releaseReservation':
        return [
          { bucket: 'RESERVED', amountMinorUnits: -op.amount },
          { bucket: 'AVAILABLE', amountMinorUnits: op.amount },
        ];
      case 'complete':
        return [
          { bucket: 'RESERVED', amountMinorUnits: -op.amount },
          { bucket: 'WITHDRAWN', amountMinorUnits: op.amount },
        ];
      case 'reversePending':
        return [{ bucket: 'PENDING', amountMinorUnits: -op.amount }];
      case 'reverseAvailable':
        return [{ bucket: 'AVAILABLE', amountMinorUnits: -op.amount }];
      default:
        return null;
    }
  };

  /** Mirrors the enforced guards: returns null when the operation must be refused. */
  const guarded = (op: Op, balances: WalletBalances): LedgerLine[] | null => {
    const p = balances.pendingMinorUnits;
    const a = balances.availableMinorUnits;
    const r = balances.reservedMinorUnits;
    switch (op.kind) {
      case 'lock':
      case 'reverseAvailable':
        return linesFor(op);
      case 'releasePending':
      case 'reversePending':
        return p >= op.amount ? linesFor(op) : null;
      case 'reserve':
        return a >= op.amount ? linesFor(op) : null;
      case 'releaseReservation':
      case 'complete':
        return r >= op.amount ? linesFor(op) : null;
      default:
        return null;
    }
  };

  const transactionTypeFor = (op: Op): Parameters<LedgerService['post']>[0]['transactionType'] => {
    switch (op.kind) {
      case 'lock':
        return 'COMMISSION_LOCKED';
      case 'releasePending':
        return 'COMMISSION_RELEASE';
      case 'reserve':
        return 'WITHDRAWAL_RESERVATION';
      case 'releaseReservation':
        return 'WITHDRAWAL_RELEASE';
      case 'complete':
        return 'WITHDRAWAL_COMPLETION';
      default:
        return 'COMMISSION_REVERSAL';
    }
  };

  it('projection == rebuilt ledger == pure model for any operation sequence', async () => {
    await fc.assert(
      fc.asyncProperty(sequenceArbitrary, async (ops) => {
        const userId = await newWalletUser();
        let model = ZERO_BALANCES;

        for (const op of ops) {
          const expected = guarded(op, model);
          let refused = false;
          let deduplicated = false;
          try {
            const posted = await ledger.post({
              userId,
              currency: 'INR',
              transactionType: transactionTypeFor(op),
              referenceType: op.kind === 'lock' || op.kind === 'releasePending' || op.kind.startsWith('reverse') ? 'order_event' : 'payout_request',
              referenceId: randomUUID(),
              idempotencyKey: `pbt|${randomUUID()}`,
              lines: expected ?? linesFor(op)!,
              guard: expected === null ? () => {
                throw new ConflictException('expected refusal');
              } : undefined,
            });
            deduplicated = posted.deduplicated;
          } catch (error) {
            refused = true;
            expect(error).toBeInstanceOf(ConflictException);
          }

          if (expected === null) {
            // Guarded operation must be refused and must not change anything.
            expect(refused).toBe(true);
          } else {
            expect(refused).toBe(false);
            expect(deduplicated).toBe(false);
            model = applyLines(model, expected);
          }

          const projection = await ledger.getBalances(userId);
          expect(projection.pendingMinorUnits).toBe(model.pendingMinorUnits);
          expect(projection.availableMinorUnits).toBe(model.availableMinorUnits);
          expect(projection.reservedMinorUnits).toBe(model.reservedMinorUnits);
          expect(projection.withdrawnMinorUnits).toBe(model.withdrawnMinorUnits);

          // PENDING and RESERVED can never go negative through valid operations.
          expect(model.pendingMinorUnits >= 0n).toBe(true);
          expect(model.reservedMinorUnits >= 0n).toBe(true);
        }

        const rebuilt = await ledger.projectBalancesFromLedger(userId);
        expect(rebuilt).toEqual(model);
      }),
      { numRuns: 20 },
    );
  });

  it('replays of the same idempotency key never move money twice', async () => {
    await fc.assert(
      fc.asyncProperty(AMOUNT, AMOUNT, async (lockAmount, reserveAmount) => {
        const userId = await newWalletUser();
        const lockKey = `pbt-lock|${randomUUID()}`;

        const first = await ledger.post({
          userId,
          currency: 'INR',
          transactionType: 'COMMISSION_LOCKED',
          referenceType: 'order_event',
          referenceId: randomUUID(),
          idempotencyKey: lockKey,
          lines: [{ bucket: 'PENDING', amountMinorUnits: lockAmount }],
        });
        expect(first.deduplicated).toBe(false);

        const replay = await ledger.post({
          userId,
          currency: 'INR',
          transactionType: 'COMMISSION_LOCKED',
          referenceType: 'order_event',
          referenceId: randomUUID(),
          idempotencyKey: lockKey,
          lines: [{ bucket: 'PENDING', amountMinorUnits: lockAmount }],
        });
        expect(replay.deduplicated).toBe(true);

        const balances = await ledger.getBalances(userId);
        expect(balances.pendingMinorUnits).toBe(lockAmount);

        // Reserve exactly the available amount, then try to overdraw by one paise.
        const releaseKey = `pbt-release|${randomUUID()}`;
        await ledger.post({
          userId,
          currency: 'INR',
          transactionType: 'COMMISSION_RELEASE',
          referenceType: 'order_event',
          referenceId: randomUUID(),
          idempotencyKey: releaseKey,
          lines: [
            { bucket: 'PENDING', amountMinorUnits: -lockAmount },
            { bucket: 'AVAILABLE', amountMinorUnits: lockAmount },
          ],
        });

        const reserve = reserveAmount > lockAmount ? lockAmount : reserveAmount;
        await ledger.post({
          userId,
          currency: 'INR',
          transactionType: 'WITHDRAWAL_RESERVATION',
          referenceType: 'payout_request',
          referenceId: randomUUID(),
          idempotencyKey: `pbt-reserve|${randomUUID()}`,
          lines: [
            { bucket: 'AVAILABLE', amountMinorUnits: -reserve },
            { bucket: 'RESERVED', amountMinorUnits: reserve },
          ],
          guard: (balances) => {
            if (balances.availableMinorUnits < reserve) {
              throw new ConflictException('insufficient');
            }
          },
        });

        // One paise more than available must be refused and leave the projection untouched.
        const before = await ledger.getBalances(userId);
        await expect(
          ledger.post({
            userId,
            currency: 'INR',
            transactionType: 'WITHDRAWAL_RESERVATION',
            referenceType: 'payout_request',
            referenceId: randomUUID(),
            idempotencyKey: `pbt-overdraw|${randomUUID()}`,
            lines: [
              { bucket: 'AVAILABLE', amountMinorUnits: -(before.availableMinorUnits + 1n) },
              { bucket: 'RESERVED', amountMinorUnits: before.availableMinorUnits + 1n },
            ],
            guard: (balances) => {
              if (balances.availableMinorUnits < before.availableMinorUnits + 1n) {
                throw new ConflictException('insufficient');
              }
            },
          }),
        ).rejects.toBeInstanceOf(ConflictException);
        expect(await ledger.getBalances(userId)).toEqual(before);
      }),
      { numRuns: 15 },
    );
  });
});
