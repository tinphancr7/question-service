import { BaseError } from '../base.error';

class TestError extends BaseError {
  constructor(message: string, details?: any[]) {
    super('TEST-001', message, details);
  }
}

describe('BaseError', () => {
  it('should create error with basic structure', () => {
    const error = new TestError('Test error occurred');

    expect(error.response).toEqual({
      error: {
        code: 'TEST-001',
        message: 'Test error occurred',
        details: [],
      },
    });
  });

  it('should include details when provided', () => {
    const error = new TestError('Test error occurred', [
      { code: 'TEST-001', message: 'Additional info' },
    ]);

    expect(error.response).toEqual({
      error: {
        code: 'TEST-001',
        message: 'Test error occurred',
        details: [{ code: 'TEST-001', message: 'Additional info' }],
      },
    });
  });

  it('should set error name to class name', () => {
    const error = new TestError('Test error');

    expect(error.name).toBe('TestError');
  });

  it('should extend Error class', () => {
    const error = new TestError('Test error');

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Test error');
  });
});
