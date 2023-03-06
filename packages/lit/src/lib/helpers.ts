/**
 * JSX Event name to Lit event name
 * A JSX event name is camelCase and begins with on, but Lit event names are kebab-case and begin with @:
 * onInput -> @input
 */
export function toEventName(name: string): string {
  return `@${name[2].toLowerCase()}${name.slice(3)}`;
}
