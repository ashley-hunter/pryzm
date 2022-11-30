export function Event(): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol): void => {};
}
