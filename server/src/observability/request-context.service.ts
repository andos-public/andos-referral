import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContextState {
  requestId: string;
  /** Set by the auth guard once the caller is known (used by audit rows and log lines). */
  userId?: string;
}

/**
 * Carries the per-request id (and, when known, the caller) through async calls without
 * threading it through every service signature. Backed by AsyncLocalStorage.
 */
@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContextState>();

  run<T>(state: RequestContextState, callback: () => T): T {
    return this.storage.run(state, callback);
  }

  get(): RequestContextState | undefined {
    return this.storage.getStore();
  }

  requestId(): string | null {
    return this.storage.getStore()?.requestId ?? null;
  }

  /** Records the authenticated caller on the active request context (no-op outside a request). */
  setUserId(userId: string): void {
    const state = this.storage.getStore();
    if (state) {
      state.userId = userId;
    }
  }
}
