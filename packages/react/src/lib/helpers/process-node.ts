import { printNode, stripThis } from '@pryzm/ast-utils';
import { TransformerContext } from '@pryzm/compiler';
import * as ts from 'typescript';
import { factory } from 'typescript';
import { convertAssignmentTransformer } from './assignment';

/**
 * In React we must process any method body or initializer to do the following:
 * - Remove any `this.` references
 * - Transform any event emitter calls to simple function calls
 */
export function processNode<T extends ts.Node | undefined>(
  node: T,
  context: TransformerContext
): T extends undefined ? undefined : T {
  if (!node) {
    return undefined as T extends undefined ? undefined : T;
  }

  // replace any event emitter calls with the event dispatcher
  node = ts.transform(node!, [convertAssignmentTransformer(), refTransformer(context)])
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
 * A TypeScript transformer that transforms detects uses of refs and unwraps them
 * @example foo = 10 -> foo.current = 10
 * @example return foo -> return foo.current
 * @param context The transformer context
 */
export function refTransformer(pryzmContext: TransformerContext): ts.TransformerFactory<ts.Node> {
  return (context: ts.TransformationContext) => (root: ts.Node) => {
    const visitor = (node: ts.Node): ts.Node => {
      if (ts.isIdentifier(node)) {
        const name = printNode(node);

        const isRef = pryzmContext.metadata.refs.some(ref => printNode(ref.name) === name);

        if (isRef) {
          return factory.createPropertyAccessExpression(node, 'current');
        }
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(root, visitor);
  };
}
