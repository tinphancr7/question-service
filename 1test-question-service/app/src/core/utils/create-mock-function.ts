export function createMock<T>(): jest.Mocked<T> {
  const mock: Partial<jest.Mocked<T>> = {};
  const handler = {
    get: (target: any, prop: string) => {
      if (!(prop in target)) {
        target[prop] = jest.fn();
      }
      return target[prop];
    },
  };
  return new Proxy(mock, handler) as jest.Mocked<T>;
}
