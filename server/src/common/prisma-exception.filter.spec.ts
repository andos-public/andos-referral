import { mapDatabaseError } from './prisma-exception.filter';

describe('mapDatabaseError', () => {
  it('maps a CHECK violation (P2004) to 409 CONSTRAINT_VIOLATION with the constraint name', () => {
    const error = {
      code: 'P2004',
      message: 'A constraint failed: violates check constraint "payout_requests_amount_positive_chk"',
    };
    expect(mapDatabaseError(error)).toEqual({
      status: 409,
      code: 'CONSTRAINT_VIOLATION',
      message: 'The request violates database rule "payout_requests_amount_positive_chk".',
    });
  });

  it('maps a raw SQLSTATE 23514 with the driver message', () => {
    const error = {
      code: 'P2010',
      meta: { code: '23514', database_error: 'new row violates check constraint "wallet_ledger_entries_nonzero_chk"' },
    };
    expect(mapDatabaseError(error)?.code).toBe('CONSTRAINT_VIOLATION');
    expect(mapDatabaseError(error)?.message).toContain('wallet_ledger_entries_nonzero_chk');
  });

  it('maps unique violations to 409 DUPLICATE', () => {
    expect(mapDatabaseError({ code: 'P2002' })).toEqual({
      status: 409,
      code: 'DUPLICATE',
      message: 'The resource already exists.',
    });
    expect(mapDatabaseError({ meta: { code: '23505' } })?.code).toBe('DUPLICATE');
  });

  it('maps FK and NOT NULL violations', () => {
    expect(mapDatabaseError({ code: 'P2003' })?.code).toBe('FOREIGN_KEY_VIOLATION');
    expect(mapDatabaseError({ code: 'P2011' })?.code).toBe('NULL_NOT_ALLOWED');
  });

  it('returns null for unrelated errors so the default handler can take over', () => {
    expect(mapDatabaseError(new Error('boom'))).toBeNull();
    expect(mapDatabaseError({ code: 'P9999' })).toBeNull();
  });
});
