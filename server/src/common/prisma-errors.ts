/** Prisma/PostgreSQL error plumbing shared by services that translate DB conflicts into HTTP. */

export function isUniqueConstraintViolation(error: unknown): boolean {
  return errorCode(error) === 'P2002' || postgresCode(error) === '23505';
}

/** CHECK-constraint violation (PG SQLSTATE 23514) — surfaced by Prisma as P2004. */
export function isCheckConstraintViolation(error: unknown): boolean {
  if (errorCode(error) === 'P2004' || postgresCode(error) === '23514') {
    return true;
  }
  return /23514|violates check constraint/i.test(errorMessage(error));
}

/** FOREIGN KEY violation (PG SQLSTATE 23503) — surfaced by Prisma as P2003. */
export function isForeignKeyViolation(error: unknown): boolean {
  return errorCode(error) === 'P2003' || postgresCode(error) === '23503';
}

/** NOT NULL violation (PG SQLSTATE 23502) — surfaced by Prisma as P2011/P2012. */
export function isNotNullViolation(error: unknown): boolean {
  const code = errorCode(error);
  return code === 'P2011' || code === 'P2012' || postgresCode(error) === '23502';
}

/** The constraint name, when the driver error exposes it (used for a precise admin-facing message). */
export function constraintNameOf(error: unknown): string | null {
  const message = errorMessage(error);
  const match =
    /violates check constraint "([^"]+)"/i.exec(message) ??
    /constraint "([^"]+)"/i.exec(message) ??
    /"constraint":\s*"([^"]+)"/i.exec(message);
  return match?.[1] ?? null;
}

export function errorMessage(error: unknown): string {
  if (typeof error !== 'object' || error === null) {
    return '';
  }
  const candidate = error as { message?: unknown; meta?: { database_error?: unknown } };
  const parts: string[] = [];
  if (typeof candidate.message === 'string') {
    parts.push(candidate.message);
  }
  if (typeof candidate.meta?.database_error === 'string') {
    parts.push(candidate.meta.database_error);
  }
  return parts.join(' ');
}

export function errorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

/** Raw SQLSTATE (e.g. `23514`) when the underlying driver error exposes it. */
export function postgresCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }
  const meta = (error as { meta?: { code?: unknown } }).meta;
  if (typeof meta?.code === 'string') {
    return meta.code;
  }
  const driver = (error as { cause?: { code?: unknown } }).cause;
  if (typeof driver?.code === 'string') {
    return driver.code;
  }
  return null;
}
