export function Ref(): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol): void => {};
}
