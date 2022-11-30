export function Prop(): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol): void => {};
}
