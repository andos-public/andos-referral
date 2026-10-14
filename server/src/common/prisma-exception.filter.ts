import { ArgumentsHost, Catch, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Response } from 'express';
import { RequestContextService } from '../observability/request-context.service';
import {
  constraintNameOf,
  isCheckConstraintViolation,
  isForeignKeyViolation,
  isNotNullViolation,
  isUniqueConstraintViolation,
} from './prisma-errors';

interface ConflictMapping {
  status: number;
  code: string;
  message: string;
}

/**
 * Translates raw database constraint failures into stable, client-safe HTTP errors so a
 * constraint can never leak a 500 (or a raw SQL string) to a caller:
 *   23514 / P2004 → 409 CONSTRAINT_VIOLATION (with the constraint name, no SQL text)
 *   23505 / P2002 → 409 DUPLICATE
 *   23503 / P2003 → 409 FOREIGN_KEY_VIOLATION
 *   23502 / P2011 → 409 NULL_NOT_ALLOWED
 * Anything else is re-thrown for the default Nest handler.
 */
@Catch()
export class PrismaExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger('PrismaExceptionFilter');

  constructor(httpAdapter?: ConstructorParameters<typeof BaseExceptionFilter>[0], private readonly requestContext?: RequestContextService) {
    super(httpAdapter);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const mapping = mapDatabaseError(exception);
    if (!mapping) {
      // Everything that is not a database conflict keeps Nest's normal behaviour
      // (HttpExceptions included — they must still produce their standard JSON body).
      return super.catch(exception, host);
    }

    const response = host.switchToHttp().getResponse<Response>();
    const requestId = this.requestContext?.requestId() ?? null;
    this.logger.warn(
      JSON.stringify({
        msg: 'database_constraint_rejected',
        code: mapping.code,
        status: mapping.status,
        ...(requestId ? { requestId } : {}),
      }),
    );

    response.status(mapping.status).json({
      statusCode: mapping.status,
      error: mapping.code,
      message: mapping.message,
      ...(requestId ? { requestId } : {}),
    });
  }
}

export function mapDatabaseError(error: unknown): ConflictMapping | null {
  if (isCheckConstraintViolation(error)) {
    const constraint = constraintNameOf(error);
    return {
      status: HttpStatus.CONFLICT,
      code: 'CONSTRAINT_VIOLATION',
      message: constraint
        ? `The request violates database rule "${constraint}".`
        : 'The request violates a database rule.',
    };
  }
  if (isUniqueConstraintViolation(error)) {
    return {
      status: HttpStatus.CONFLICT,
      code: 'DUPLICATE',
      message: 'The resource already exists.',
    };
  }
  if (isForeignKeyViolation(error)) {
    return {
      status: HttpStatus.CONFLICT,
      code: 'FOREIGN_KEY_VIOLATION',
      message: 'Referenced record does not exist.',
    };
  }
  if (isNotNullViolation(error)) {
    return {
      status: HttpStatus.CONFLICT,
      code: 'NULL_NOT_ALLOWED',
      message: 'A required database column was missing.',
    };
  }
  return null;
}
