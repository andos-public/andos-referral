/**
 * Parses the TRUST_PROXY environment value into what Express expects.
 * `false` (default) = ignore X-Forwarded-For; a number = number of proxy hops to trust;
 * `true` = trust the left-most entry; anything else is passed through as an IP/CIDR list.
 */
export type TrustProxySetting = boolean | number | string;

export function parseTrustProxy(raw: string | undefined): TrustProxySetting {
  const value = (raw ?? '').trim();
  if (value.length === 0 || value.toLowerCase() === 'false') {
    return false;
  }
  if (value.toLowerCase() === 'true') {
    return true;
  }
  if (/^\d+$/.test(value)) {
    return Number(value);
  }
  return value;
}
