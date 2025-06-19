/**
 * Interface for error details that can be included in the error response
 */
export interface ErrorDetail {
  field?: string;
  code: string;
  message?: string;
  codeParams?: unknown[]; // Array of parameters used in validation (e.g. [18] for minimum age)
}

/**
 * Standard error response format following RFC 7807
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details: ErrorDetail[];
  };
}

/**
 * Base error class that all service-specific errors should extend
 *
 * Example of extending for a specific service:
 * ```typescript
 * // In your service's error types file (e.g., question-service/errors.ts)
 *
 * // 1. Define your error codes
 * export enum QuestionErrorCode {
 *   NOT_FOUND = 'QS-QST-BIZ-001',
 *   ALREADY_EXISTS = 'QS-QST-BIZ-002',
 *   INVALID_STATE = 'QS-QST-BIZ-003',
 * }
 *
 * // 2. Create specific error classes
 * export class QuestionNotFoundError extends BaseError {
 *   constructor(id: string) {
 *     super(
 *       QuestionErrorCode.NOT_FOUND,
 *       `Question ${id} not found`,
 *       [{ code: QuestionErrorCode.NOT_FOUND, message: `Question ID: ${id}` }]
 *     );
 *   }
 * }
 *
 * // 3. Use in your service
 * if (!question) {
 *   throw new QuestionNotFoundError(id);
 * }
 * ```
 */
export class BaseError extends Error {
  public readonly response: ErrorResponse;

  constructor(code: string, message: string, details?: ErrorDetail[]) {
    super(message);
    this.name = this.constructor.name;

    this.response = {
      error: {
        code,
        message,
        details: details || [],
      },
    };

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}
