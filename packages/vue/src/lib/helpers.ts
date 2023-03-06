/**
 * JSX Event name to Vue event name
 * A JSX event name is camelCase and begins with on, but Vue event names are kebab-case and begin with @:
 * onInput -> @input
 * @param name JSX event name
 */
export function toEventName(name: string): string {
  return `${name[2].toLowerCase()}${name.slice(3)}`;
}
