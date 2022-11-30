export function Component(): ClassDecorator {
  return <T>(target: T) => {
    return target;
  };
}
