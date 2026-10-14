import { Injectable } from '@nestjs/common';

export interface MetricsSnapshot {
  startedAt: string;
  uptimeSeconds: number;
  counters: Record<string, number>;
}

/**
 * Dependency-free in-process counters for operational visibility (`GET /v1/admin/metrics`).
 * Deliberately simple: one process holds the numbers; a multi-instance deployment aggregates
 * them at the scrape layer (or swaps in a Prometheus client) — the call sites stay the same.
 */
@Injectable()
export class MetricsService {
  private readonly counters = new Map<string, number>();
  private readonly startedAt = new Date();

  inc(key: string, by = 1): void {
    this.counters.set(key, (this.counters.get(key) ?? 0) + by);
  }

  observeHttp(method: string, statusCode: number, durationMs: number): void {
    const statusClass = `${Math.floor(statusCode / 100)}xx`;
    this.inc(`http.requests{method=${method},class=${statusClass}}`);
    this.inc('http.requests.total');
    this.inc(`http.duration_ms.sum{method=${method}}`, Math.max(0, Math.round(durationMs)));
    if (statusCode >= 500) {
      this.inc(`http.errors{method=${method},class=${statusClass}}`);
    }
  }

  /** Order events: outcome is `credited` / `deduplicated` / `rejected:<REASON>`. */
  recordOrderEvent(eventType: string, outcome: string): void {
    this.inc(`order.events{type=${eventType},outcome=${outcome}}`);
  }

  recordCommissionLocked(paise: bigint, rateBps: number): void {
    this.inc('commission.locked.count');
    this.inc('commission.locked.paise', toSafeNumber(paise));
    this.inc(`commission.locked.rate_bps{rate=${rateBps}}`);
  }

  recordCommissionReleased(paise: bigint): void {
    this.inc('commission.released.count');
    this.inc('commission.released.paise', toSafeNumber(paise));
  }

  recordCommissionReversed(paise: bigint, bucket: string): void {
    this.inc('commission.reversed.count');
    this.inc('commission.reversed.paise', toSafeNumber(paise));
    this.inc(`commission.reversed.bucket{bucket=${bucket}}`);
  }

  recordHoldSweep(result: { scanned: number; released: number; skipped: number; failed: number }): void {
    this.inc('hold.sweeps');
    this.inc('hold.sweep.scanned', result.scanned);
    this.inc('hold.sweep.released', result.released);
    this.inc('hold.sweep.skipped', result.skipped);
    this.inc('hold.sweep.failed', result.failed);
  }

  recordPayoutTransition(transition: string, paise: bigint): void {
    this.inc(`payout.transitions{to=${transition}}`);
    if (transition === 'COMPLETED') {
      this.inc('payout.completed.paise', toSafeNumber(paise));
    }
  }

  recordMainAppEvent(eventType: string, outcome: string): void {
    this.inc(`main_app.events{type=${eventType},outcome=${outcome}}`);
  }

  recordError(kind: string): void {
    this.inc(`errors{kind=${kind}}`);
  }

  snapshot(): MetricsSnapshot {
    const counters: Record<string, number> = {};
    for (const key of [...this.counters.keys()].sort()) {
      counters[key] = this.counters.get(key) ?? 0;
    }
    return {
      startedAt: this.startedAt.toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      counters,
    };
  }

  /** Test helper — clears all counters. */
  reset(): void {
    this.counters.clear();
  }
}

/** BigInt → number for counter arithmetic (values here are far below Number.MAX_SAFE_INTEGER). */
function toSafeNumber(value: bigint): number {
  return Number(value > 0n ? value : -value);
}
