import { BaseError } from '@/core/utils/guards';
import {
  CommonBusinessCode,
  CommonSystemCode,
} from '@/core/utils/guards/error-code-builder';
import { errorCodeBuilder } from '@/core/utils/guards/error-code-builder';

export interface Result {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export abstract class HTTPError extends BaseError {
  public statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(code, message);
    this.statusCode = statusCode;
  }

  public toJsonResponse(): Result {
    return {
      statusCode: this.statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.response),
    };
  }
}

export class HTTPBusinessError extends HTTPError {
  constructor(
    message: string | null = null,
    code: string | null = null,
    statusCode: number = 400,
    entity?: string,
  ) {
    const errorCode = errorCodeBuilder.business(
      code || CommonBusinessCode.INVALID_OPERATION,
      entity,
    );
    super(message || '', errorCode, statusCode);
  }
}

export class HTTPSystemError extends HTTPError {
  constructor(
    message: string | null = null,
    code: string | null = null,
    statusCode?: number,
  ) {
    const errorCode = errorCodeBuilder.system(
      code || CommonSystemCode.UNEXPECTED,
    );
    super(message || '', errorCode, statusCode || 500);
  }
}
