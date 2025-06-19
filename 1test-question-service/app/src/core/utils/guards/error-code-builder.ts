import { ENTITY_PREFIXES, SERVICE_PREFIX } from '@/core/constants/error-code';

/**
 * Base error types that are common across all services
 */
export enum ErrorType {
  VALIDATION = 'VAL',
  BUSINESS = 'BIZ',
  SYSTEM = 'SYS',
}

/**
 * Common validation error codes shared across all services
 */
export enum CommonValidationCode {
  REQUIRED = '001',
  MIN_LENGTH = '002',
  MAX_LENGTH = '003',
  PATTERN_MISMATCH = '004',
  INVALID_FORMAT = '005',
  INVALID_TYPE = '006',
  INVALID_RANGE = '007',
  INVALID_VALUE = '008',
  MIN_ITEMS = '009',
  MAX_ITEMS = '010',
  UNIQUE_ITEMS = '011',
  INVALID_ITEM = '012',
  REQUIRED_FIELDS = '013',
  INVALID_FIELD = '014',
  VALUE_MUST_GREATER_THAN = '015',
  VALUE_MUST_LESS_THAN = '016',
  VALUE_MUST_BE_GREATER_THAN_OR_EQUAL_TO = '017',
  VALUE_MUST_BE_LESS_THAN_OR_EQUAL_TO = '018',
}

/**
 * Common business error codes shared across all services
 */
export enum CommonBusinessCode {
  NOT_FOUND = '001',
  ALREADY_EXISTS = '002',
  INVALID_STATE = '003',
  INVALID_OPERATION = '004',
  INSUFFICIENT_PERMISSIONS = '005',
}

/**
 * Common system error codes shared across all services
 */
export enum CommonSystemCode {
  DATABASE = '001',
  NETWORK = '002',
  EXTERNAL_SERVICE = '003',
  CONFIGURATION = '004',
  UNEXPECTED = '005',
}

/**
 * Interface for service-specific error code configuration
 */
export interface ErrorCodeConfig<E> {
  /**
   * Service prefix (e.g., 'QS' for Question Service)
   */
  servicePrefix: string;

  /**
   * Map of entity prefixes specific to the service
   */
  entityPrefixes: E;

  /**
   * Optional service-specific validation codes
   */
  validationCodes?: { [key: string]: string };

  /**
   * Optional service-specific business codes
   */
  businessCodes?: { [key: string]: string };

  /**
   * Optional service-specific system codes
   */
  systemCodes?: { [key: string]: string };
}

/**
 * Error code builder that handles formatting of error codes
 *
 * Code format:
 * - [SERVICE_PREFIX]-[TYPE]-[CODE]-[ENTITY]
 * - [SERVICE_PREFIX]-[TYPE]-[CODE]-[ENTITY]-[{length}P]
 */
export class ErrorCodeBuilder<E> {
  private config: ErrorCodeConfig<E>;

  constructor(config: ErrorCodeConfig<E>) {
    this.config = config;
  }

  /**
   * Builds a complete error code with service prefix, entity, type and code
   */
  private buildCode(
    entity: string | null,
    type: ErrorType,
    code: string,
  ): string {
    return entity
      ? `${this.config.servicePrefix}-${type}-${code}-${entity}`
      : `${this.config.servicePrefix}-${type}-${code}`;
  }

  /**
   * Creates a validation error code
   * @param code The validation code (either from CommonValidationCode or service-specific)
   * @param entity Optional entity prefix
   */
  validation(code: CommonValidationCode | string, entity?: string): string {
    return this.buildCode(entity || null, ErrorType.VALIDATION, code);
  }

  /**
   * Creates a business error code
   * @param code The business code (either from CommonBusinessCode or service-specific)
   * @param entity Optional entity prefix
   */
  business(code: CommonBusinessCode | string, entity?: string): string {
    return this.buildCode(entity || null, ErrorType.BUSINESS, code);
  }

  /**
   * Creates a system error code
   * @param code The system code (either from CommonSystemCode or service-specific)
   */
  system(code: CommonSystemCode | string): string {
    return this.buildCode(null, ErrorType.SYSTEM, code);
  }

  /**
   * Gets base error code without specific code number
   */
  getBaseErrorCode(entity: string | null, type: ErrorType): string {
    return entity
      ? `${this.config.servicePrefix}-${type}-${entity}`
      : `${this.config.servicePrefix}-${type}`;
  }
}

/**
 * Type for any error code (validation, business, or system)
 */
export type ErrorCode = string;

export const errorCodeBuilder = new ErrorCodeBuilder({
  servicePrefix: SERVICE_PREFIX,
  entityPrefixes: ENTITY_PREFIXES,
});
