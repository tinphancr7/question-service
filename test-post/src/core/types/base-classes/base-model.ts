import { validateSync, ValidatorOptions } from 'class-validator';

export abstract class BaseModel {
  /**
   * Validates the model and throws an error if validation fails
   */
  protected validate() {
    const validationOptions: ValidatorOptions = {
      validationError: { target: false },
      stopAtFirstError: false,
    };

    const validationErrors = validateSync(this, validationOptions);

    if (validationErrors.length > 0) {
      const errorMessages = validationErrors
        .map(error => Object.values(error.constraints || {}).join(', '))
        .join('; ');
      
      throw new Error(`Validation failed: ${errorMessages}`);
    }
  }
} 