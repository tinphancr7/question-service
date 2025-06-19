import { ValidationError } from './errors';
import { ErrorDetail } from '@/core/utils/guards/base.error';

/**
 * Specialized validation error for input validation failures
 * Used by DTOs and request inputs to indicate client-provided data is invalid
 */
export class InputValidationError extends ValidationError {
  constructor(
    code: string = 'INPUT_VALIDATION_ERROR',
    message: string = 'Invalid input',
    details: ErrorDetail[] = [],
  ) {
    super(code, message, details);
  }
}

/**
 * Specialized validation error for model validation failures
 * Used by domain models to indicate domain constraint violations
 */
export class ModelValidationError extends ValidationError {
  constructor(
    code: string = 'MODEL_VALIDATION_ERROR',
    message: string = 'Invalid model',
    details: ErrorDetail[] = [],
  ) {
    super(code, message, details);
  }
}
