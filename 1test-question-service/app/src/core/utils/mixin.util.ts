/**
 * Enable mixins
 *
 * ref: https://www.typescriptlang.org/docs/handbook/mixins.html#alternative-pattern
 * @param derivedCtor Just class
 * @param constructors Mixins
 */
export function applyMixins(derivedCtor: any, constructors: any[]) {
  constructors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name) ||
          Object.create(null),
      );
    });
  });
}
