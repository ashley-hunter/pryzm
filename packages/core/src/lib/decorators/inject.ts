export function Inject<T>(token: string | Symbol): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol): void => {};
}
