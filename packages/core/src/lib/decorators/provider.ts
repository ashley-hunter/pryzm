export function Provider(key: string | Symbol): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol): void => {};
}
