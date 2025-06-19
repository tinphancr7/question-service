import { HTTPSystemError } from '@/core/types/errors';
import { CommonSystemCode } from '@/core/utils/guards/error-code-builder';

export class DynamoDBError extends HTTPSystemError {
  constructor(message: string = '', code: string = CommonSystemCode.DATABASE) {
    super(message, code, 500);
  }
}
