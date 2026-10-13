/** Detects Prisma unique-constraint violations (P2002) without relying on the error class instance. */
export function isUniqueConstraintViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  return (error as { code?: unknown }).code === 'P2002';
}
