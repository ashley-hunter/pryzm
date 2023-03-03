export function Component(definition: ComponentDefinition): ClassDecorator {
  return <T>(target: T) => {
    return target;
  };
}

export interface ComponentDefinition {
  selector?: string;
  styles?: string;
}
