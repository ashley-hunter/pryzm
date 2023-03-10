import { printNode, stripThis } from '@pryzm/ast-utils';
import { TransformerContext } from '@pryzm/compiler';
import * as ts from 'typescript';

/**
 * JSX Event name to Svelte event name
 * A JSX event name is camelCase and begins with on, but Svelte event names are kebab-case and begin with on:
 * onInput -> on:input
 * @param name JSX event name
 */
export function toEventName(name: string): string {
  return `${name[2].toLowerCase()}${name.slice(3)}`;
}

/**
 * In Svelte we must process any method body or initializer to do the following:
 * - Remove any `this.` references
 * - Transform any event emitter calls to use the event dispatcher
 */
export function processNode<T extends ts.Node | undefined>(
  node: T,
  context: TransformerContext
): T extends undefined ? undefined : T {
  if (!node) {
    return undefined as T extends undefined ? undefined : T;
  }

  // remove any `this.` references
  node = stripThis(node) as T;

  return node as unknown as T extends undefined ? undefined : T;
}

/**
 * Process the node and print it
 */
export function processNodeToString<T extends ts.Node | undefined>(
  node: T,
  context: TransformerContext
): T extends undefined ? undefined : string {
  return printNode(processNode(node, context)) as T extends undefined ? undefined : string;
}
