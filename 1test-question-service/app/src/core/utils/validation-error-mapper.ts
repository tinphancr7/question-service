import { ValidationError as ClassValidatorError } from 'class-validator';
import {
  InputValidationError,
  ModelValidationError,
} from '@/core/types/errors/validation-errors';
import {
  CommonValidationCode,
  errorCodeBuilder,
} from '@/core/utils/guards/error-code-builder';

/**
 * Maps class-validator errors to common error details format
 */
function mapValidationErrorDetails(
  errors: ClassValidatorError[],
  entityPrefix: string,
  parentPath: string = '',
) {
  let result: any[] = [];

  errors.forEach((error) => {
    // Handle nested errors (children)
    if (error.children && error.children.length > 0) {
      // Build the full path to this nested property
      const nestedPath = parentPath
        ? `${parentPath}.${error.property}`
        : error.property;

      // Recursively process nested validation errors with the updated path
      const nestedErrors = mapValidationErrorDetails(
        error.children,
        entityPrefix,
        nestedPath,
      );

      // Add all nested errors to our result
      result = [...result, ...nestedErrors];
    } else {
      // Extract field name from property path
      const field = parentPath
        ? `${parentPath}.${error.property}`
        : error.property.startsWith('_')
          ? error.property.substring(1)
          : error.property;

      // Check if this is an array validation error
      const isArrayError =
        error.target &&
        Array.isArray(error.target) &&
        !isNaN(Number(error.property));

      const arrayField = isArrayError
        ? (parentPath ? parentPath : field.replace(/^\d+$/, '')) +
          '.' +
          error.property
        : field;

      // Get the validation constraints
      const constraints = error.constraints || {};

      // Generate a user-friendly message
      let errorMessage = '';

      // Extract original error message from constraint
      const originalMessage = Object.values(constraints)[0] || 'Invalid value';

      // Extract property name from original message
      const propertyPattern = new RegExp(
        `^(${error.property}|${field}|${arrayField})\\s+`,
        'i',
      );
      const cleanMessage = originalMessage.replace(propertyPattern, '');

      // Create formatted message without duplicating the field name
      errorMessage = `Field '${isArrayError ? arrayField : field}' ${cleanMessage}`;

      // Determine appropriate error code and extract validation parameters for codeParams
      let code: string;
      let params: string[] = [];

      if (constraints.minLength) {
        code = CommonValidationCode.MIN_LENGTH;
        params = Object.values(error.contexts?.minLength || {});
      } else if (constraints.min) {
        code = CommonValidationCode.VALUE_MUST_GREATER_THAN;
        params = Object.values(error.contexts?.min || {});
      } else if (constraints.max) {
        code = CommonValidationCode.VALUE_MUST_LESS_THAN;
        params = Object.values(error.contexts?.max || {});
      } else if (constraints.isEnum) {
        code = CommonValidationCode.INVALID_VALUE;
        params = error.contexts?.isEnum.enums;
      } else if (constraints.isString) {
        code = CommonValidationCode.INVALID_TYPE;
      } else if (constraints.isUuid) {
        code = CommonValidationCode.INVALID_FORMAT;
      } else if (constraints.isDateString) {
        code = CommonValidationCode.INVALID_FORMAT;
      } else if (constraints.isNotEmpty) {
        code = CommonValidationCode.REQUIRED;
      } else {
        code = CommonValidationCode.INVALID_VALUE;
      }

      // Generate the final error code with proper format
      const finalCode = errorCodeBuilder.validation(code, entityPrefix);

      // Create the error detail
      const errorDetail = {
        field: isArrayError ? arrayField : field,
        code: params ? `${finalCode}-${params.length}P` : finalCode,
        message: errorMessage,
        codeParams: params,
      };

      // Add the error detail to the result
      result.push(errorDetail);
    }
  });

  return result;
}

/**
 * Maps class-validator errors to InputValidationError format
 * Use this for validating DTOs and user inputs
 *
 * @param errors Array of class-validator ValidationError objects
 * @param entityPrefix Entity prefix for error codes
 * @param message Custom error message (defaults to 'Invalid input')
 */
export function mapInputValidationErrors(
  errors: ClassValidatorError[],
  entityPrefix: string,
  message: string = 'Invalid input',
): InputValidationError {
  // Process errors recursively to get error details
  const errorDetails = mapValidationErrorDetails(errors, entityPrefix);

  return new InputValidationError(
    errorCodeBuilder.validation(
      CommonValidationCode.INVALID_VALUE,
      entityPrefix,
    ),
    message,
    errorDetails,
  );
}

/**
 * Maps class-validator errors to ModelValidationError format
 * Use this for validating domain models
 *
 * @param errors Array of class-validator ValidationError objects
 * @param entityPrefix Entity prefix for error codes
 * @param message Custom error message (defaults to 'Invalid model')
 */
export function mapModelValidationErrors(
  errors: ClassValidatorError[],
  entityPrefix: string,
  message: string = 'Invalid model',
): ModelValidationError {
  const errorDetails = mapValidationErrorDetails(errors, entityPrefix);

  return new ModelValidationError(
    errorCodeBuilder.validation(
      CommonValidationCode.INVALID_VALUE,
      entityPrefix,
    ),
    message,
    errorDetails,
  );
}
