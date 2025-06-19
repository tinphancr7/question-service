// import { ValidationError } from '@/core/utils';
import { CommonBusinessCode } from '@/core/utils/guards/error-code-builder';

import { HTTPBusinessError, HTTPSystemError } from './base.http.error';
import { BaseError, ErrorDetail } from '@/core/utils';

// export { ValidationError };

// Business Errors
export class BadRequestError extends HTTPBusinessError {
  constructor(
    message: string | null = null,
    code: string | null = null,
    entity?: string,
  ) {
    super(
      message || '',
      code || CommonBusinessCode.INVALID_OPERATION,
      400,
      entity,
    );
  }
}

export class UnauthorizedError extends HTTPBusinessError {
  constructor(
    message: string | null = null,
    code: string | null = null,
    entity?: string,
  ) {
    super(
      message || '',
      code || CommonBusinessCode.INSUFFICIENT_PERMISSIONS,
      401,
      entity,
    );
  }
}

export class ForbiddenError extends HTTPBusinessError {
  constructor(
    message: string | null = null,
    code: string | null = null,
    entity?: string,
  ) {
    super(
      message || '',
      code || CommonBusinessCode.INSUFFICIENT_PERMISSIONS,
      403,
      entity,
    );
  }
}

export class NotFoundError extends HTTPBusinessError {
  constructor(
    message: string | null = null,
    code: string | null = null,
    entity?: string,
  ) {
    super(message || '', code || CommonBusinessCode.NOT_FOUND, 404, entity);
  }
}

export class ConflictError extends HTTPBusinessError {
  constructor(
    message: string | null = null,
    code: string | null = null,
    entity?: string,
  ) {
    super(message || '', code || CommonBusinessCode.INVALID_STATE, 409, entity);
  }
}

export class AlreadyExistsError extends HTTPBusinessError {
  constructor(
    message: string | null = null,
    code: string | null = null,
    entity?: string,
  ) {
    super(
      message || '',
      code || CommonBusinessCode.ALREADY_EXISTS,
      409,
      entity,
    );
  }
}

export class UnprocessableEntityError extends HTTPBusinessError {
  constructor(
    message: string | null = null,
    code: string | null = null,
    entity?: string,
  ) {
    super(
      message || '',
      code || CommonBusinessCode.INVALID_OPERATION,
      422,
      entity,
    );
  }
}

// System Errors

export class InternalServerError extends HTTPSystemError {
  constructor(message: string | null = null, code: string | null = null) {
    super(message, code, 500);
  }
}

export class UnknownError extends HTTPSystemError {
  constructor(message: string | null = null, code: string | null = null) {
    super(message, code, 500);
  }
}

export class DuplicateError extends HTTPBusinessError {
  constructor(
    message: string | null = null,
    code: string | null = null,
    entity?: string,
  ) {
    super(message || 'Duplicate', code, 500, entity);
  }
}

/**
 * @deprecated
 */
export class InvalidRangeError extends HTTPBusinessError {
  constructor(
    message: string | null = null,
    code: string | null = null,
    entity?: string,
  ) {
    super(message || 'InvalidRange', code, 500, entity);
  }
}

/**
 * @deprecated
 */
export class InvalidPathPropsError extends HTTPBusinessError {
  constructor(
    message: string | null = null,
    code: string | null = null,
    entity?: string,
  ) {
    super(message || 'InvalidPathProps', code, 500, entity);
  }
}

/**
 * @deprecated
 */
export class InvalidBooleanValueError extends HTTPBusinessError {
  constructor(
    message: string | null = null,
    code: string | null = null,
    entity?: string,
  ) {
    super(message || 'InvalidBooleanValue', code, 500, entity);
  }
}

export class ValidationError extends BaseError {
  constructor(
    code: string = 'VALIDATION_ERROR',
    message: string = 'Validation failed',
    details: ErrorDetail[] = [],
  ) {
    super(code, message, details);
  }
}
