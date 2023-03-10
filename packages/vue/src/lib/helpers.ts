import {
  getEventNameFromEmitterCall,
  getValueFromEmitterCall,
  isEventEmitterCall,
  printNode,
  stripThis,
} from '@pryzm/ast-utils';
import { TransformerContext } from '@pryzm/compiler';
import * as ts from 'typescript';
import { factory } from 'typescript';

/**
 * JSX Event name to Vue event name
 * A JSX event name is camelCase and begins with on, but Vue event names are kebab-case and begin with @:
 * onInput -> @input
 * @param name JSX event name
 */
export function toEventName(name: string): string {
  return `${name[2].toLowerCase()}${name.slice(3)}`;
}

/**
 * In Vue we must process any method body or initializer to do the following:
 * - Remove any `this.` references
 */
export function processNode<T extends ts.Node | undefined>(
  node: T,
  context: TransformerContext
): T extends undefined ? undefined : T {
  if (!node) {
    return undefined as T extends undefined ? undefined : T;
  }

  // replace any event emitter calls with the event dispatcher
  node = ts.transform(node!, [eventTransformer(context)]).transformed[0] as T;

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

/**
 * A TypeScript transformer that transforms event emitter calls to vue event dispatchers
 * @example this.onSelect('foo') -> emit('select', 'foo');
 * @param context
 */
export function eventTransformer(pryzmContext: TransformerContext): ts.TransformerFactory<ts.Node> {
  return (context: ts.TransformationContext) => (root: ts.Node) => {
    const visitor = (node: ts.Node): ts.Node => {
      if (isEventEmitterCall(node, pryzmContext.metadata.events)) {
        const eventName = toEventName(getEventNameFromEmitterCall(node));
        const value = getValueFromEmitterCall(node);

        // if the event name is not in the list of events, then it is not an event emitter
        return factory.createExpressionStatement(
          factory.createCallExpression(
            factory.createIdentifier('emit'),
            undefined,
            value
              ? [factory.createStringLiteral(eventName), value]
              : [factory.createStringLiteral(eventName)]
          )
        );
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(root, visitor);
  };
}
