import { validateSync } from 'class-validator';
import { mapInputValidationErrors } from '@/core/utils/validation-error-mapper';

// Utility type to get all required properties of a class
export type PropertiesOf<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T] &
  string;

// Get all properties from a class excluding methods
export type ProtoOf<T> = Pick<T, PropertiesOf<T>>;

export type InputConstructor<T, P = Partial<T>> = {
  new (data: P): T;
};

/**
 * Base class for all use cases that need input validation
 */
export abstract class BaseUseCase<TInput extends object, TOutput> {
  /**
   * Returns the entity prefix for input validation error codes
   */
  protected abstract getInputPrefix(): string;

  /**
   * Executes the core business logic after input validation
   * @param input Validated input
   */
  protected abstract execute(input: TInput): Promise<TOutput>;

  /**
   * Validates input and executes the use case
   * @param input Input data
   * @returns Output data
   */
  async handle(input: TInput): Promise<TOutput> {
    // Validate the input
    const validationErrors = validateSync(input);
    if (validationErrors.length > 0) {
      throw mapInputValidationErrors(
        validationErrors,
        this.getInputPrefix(),
        `Invalid use case input: ${this.constructor.name}`,
      );
    }

    // Execute the core business logic
    return this.execute(input);
  }
}
