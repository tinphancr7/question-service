import { validateSync, ValidatorOptions } from 'class-validator';
import { mapModelValidationErrors } from '@/core/utils/validation-error-mapper';

export abstract class BaseModel {
  /**
   * Returns the entity prefix for this model
   */
  protected abstract getEntityPrefix(): string;

  /**
   * Validates the model and throws a ModelValidationError if validation fails
   */
  protected validate() {
    // Set validation options to format error messages
    const validationOptions: ValidatorOptions = {
      validationError: { target: false },
      // This transforms field names to be more readable in error messages
      // _fieldName -> fieldName
      stopAtFirstError: false,
    };

    const validationErrors = validateSync(this, validationOptions);

    if (validationErrors.length > 0) {
      // Use the model validation error mapper
      throw mapModelValidationErrors(
        validationErrors,
        this.getEntityPrefix(),
        `Invalid ${this.constructor.name}`,
      );
    }
  }
}
