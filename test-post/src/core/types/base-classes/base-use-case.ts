import { validateSync } from 'class-validator';

export type PropertiesOf<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T] & string;

export type ProtoOf<T> = Pick<T, PropertiesOf<T>>;

/**
 * Base class for all use cases that need input validation
 */
export abstract class BaseUseCase<TInput extends object, TOutput> {
  /**
   * Executes the core business logic after input validation
   */
  protected abstract execute(input: TInput): Promise<TOutput>;

  /**
   * Validates input and executes the use case
   */
  async handle(input: TInput): Promise<TOutput> {
    // Validate the input
    const validationErrors = validateSync(input);
    if (validationErrors.length > 0) {
      const errorMessages = validationErrors
        .map(error => Object.values(error.constraints || {}).join(', '))
        .join('; ');
      
      throw new Error(`Invalid input: ${errorMessages}`);
    }

    // Execute the core business logic
    return this.execute(input);
  }
} 