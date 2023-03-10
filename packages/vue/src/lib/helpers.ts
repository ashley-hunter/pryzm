import {
  getEventNameFromEmitterCall,
  getValueFromEmitterCall,
  inferType,
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
  node = ts.transform(node!, [eventTransformer(context), reactiveTransformer(context)])
    .transformed[0] as T;

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
 * A TypeScript transformer that transforms detects uses of props and state and unwraps them
 * @example foo = 10 -> foo.value = 10
 * @example return foo -> return foo.value
 */
export function reactiveTransformer(
  pryzmContext: TransformerContext
): ts.TransformerFactory<ts.Node> {
  return (context: ts.TransformationContext) => (root: ts.Node) => {
    const visitor = (node: ts.Node): ts.Node => {
      if (ts.isIdentifier(node)) {
        const name = node.getText();

        const isState = pryzmContext.metadata.state.some(state => {
          // if the name is the same and
          return printNode(state.name) === name && !isReactive(state.type, state.initializer);
        });
        const isProp = pryzmContext.metadata.props.some(prop => printNode(prop.name) === name);
        const isRef = pryzmContext.metadata.refs.some(ref => printNode(ref.name) === name);

        if (isState || isProp || isRef) {
          return factory.createPropertyAccessExpression(node, 'value');
        }
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(root, visitor);
  };
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

/**
 * Determine is the type is reactive or a ref
 * @param type The type of the property
 * @returns true if the type is reactive
 */
export function isReactive(type: ts.Node | undefined, initializer?: ts.Expression): boolean {
  type ??= inferType(initializer);

  return type && (ts.isArrayTypeNode(type) || ts.isTypeLiteralNode(type)) ? true : false;
}
