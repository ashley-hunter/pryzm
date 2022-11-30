export function Inject<T>(token: T): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol): void => {};
}
