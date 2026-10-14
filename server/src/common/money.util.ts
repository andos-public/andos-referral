import { BadRequestException } from '@nestjs/common';

/**
 * Money is ALWAYS integer minor units (paise for INR). Never floats; API payloads carry
 * decimal strings (`"5000"`) so JSON/JavaScript precision can never corrupt an amount.
 */
export const MINOR_UNITS_PATTERN = /^\d{1,15}$/;

export const MINOR_UNITS_MAX = 10n ** 15n;

export function parseMinorUnits(value: unknown, field: string): bigint {
  if (typeof value === 'bigint') {
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      throw new BadRequestException(`${field} must be an integer (minor units, e.g. paise)`);
    }
    return checkRange(BigInt(value), field);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!MINOR_UNITS_PATTERN.test(trimmed)) {
      throw new BadRequestException(
        `${field} must be digits only (minor units, e.g. paise) — for example "5000"`,
      );
    }
    return checkRange(BigInt(trimmed), field);
  }
  throw new BadRequestException(`${field} must be a string or integer number of minor units`);
}

function checkRange(value: bigint, field: string): bigint {
  if (value < 0) {
    throw new BadRequestException(`${field} must not be negative`);
  }
  if (value > MINOR_UNITS_MAX) {
    throw new BadRequestException(`${field} is unreasonably large`);
  }
  return value;
}

/** Serializes to a decimal string — the only form in which money leaves the API. */
export function formatMinorUnits(value: bigint | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '0';
  }
  return typeof value === 'bigint' ? value.toString() : BigInt(value).toString();
}
