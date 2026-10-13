import type { AccountStatus } from '@prisma/client';
import type { Request } from 'express';

/** Identity of the caller, resolved by UserAuthGuard and attached to the request. */
export interface AuthenticatedUser {
  id: string;
  username: string | null;
  accountStatus: AccountStatus;
}

export interface UserRequest extends Request {
  user?: AuthenticatedUser;
}
