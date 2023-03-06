/**
 * JSX Event name to Svelte event name
 * A JSX event name is camelCase and begins with on, but Svelte event names are kebab-case and begin with on:
 * onInput -> on:input
 * @param name JSX event name
 */
export function toEventName(name: string): string {
  return `on:${name[2].toLowerCase()}${name.slice(3)}`;
}
