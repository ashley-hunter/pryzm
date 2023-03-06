import { getPropertyName, printNode, stripThis } from '@pryzm/ast-utils';
import { TransformerContext } from '@pryzm/compiler';
import * as ts from 'typescript';
import { factory } from 'typescript';

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
): T extends undefined ? undefined : ts.Node {
  if (!node) {
    return undefined as T extends undefined ? undefined : ts.Node;
  }

  // remove any `this.` references
  node = stripThis(node) as T;

  // replace any event emitter calls with the event dispatcher
  node = ts.transform(node!, [eventTransformer(context)]).transformed[0] as T;

  return node as unknown as T extends undefined ? undefined : ts.Node;
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
 * A TypeScript transformer that transforms event emitter calls to use the event dispatcher
 * @param context
 */
export function eventTransformer(pryzmContext: TransformerContext): ts.TransformerFactory<ts.Node> {
  return (context: ts.TransformationContext) => (root: ts.Node) => {
    const visitor = (node: ts.Node): ts.Node => {
      // if this is a call expression and the expression is a property access expression
      // and the property name is `emit` and the expression the name of an event
      if (
        ts.isExpressionStatement(node) &&
        ts.isCallExpression(node.expression) &&
        ts.isPropertyAccessExpression(node.expression.expression) &&
        node.expression.expression.name.text === 'emit' &&
        ts.isIdentifier(node.expression.expression.expression)
      ) {
        const eventName = node.expression.expression.expression.text;

        // if the event name is not in the list of events, then it is not an event emitter
        if (pryzmContext.metadata.events.some(e => getPropertyName(e) === eventName)) {
          return factory.createExpressionStatement(
            factory.createCallExpression(factory.createIdentifier('dispatch'), undefined, [
              factory.createStringLiteral(toEventName(eventName)),
              node.expression.arguments[0],
            ])
          );
        }
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(root, visitor);
  };
}
