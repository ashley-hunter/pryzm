import { JSX } from '../../jsx-runtime';

interface ForProps<T> {
  each: readonly T[];
  // key?: T extends Record<any, any> ? keyof T : never;
  children: (item: T, index: number) => JSX.Element;
}

export function For<T>(props: ForProps<T>) {
  // we can return null here as this is a compile time only component
  return null;
}
