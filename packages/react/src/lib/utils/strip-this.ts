import * as ts from 'typescript';
import { isThisExpression } from './typing';

export function stripThis<T extends ts.Node, R extends ts.Node = T>(
  node: T | undefined
): R | undefined {
  if (!node) {
    return node;
  }
  // run the ts transformer
  return ts.transform(node, [stripThisTransformer()])
    .transformed[0] as unknown as R;
}

// create a ts transformer factory
function stripThisTransformer<T extends ts.Node>(): ts.TransformerFactory<T> {
  return (context) => {
    const visitor = (node: ts.Node): ts.Node => {
      // e.g. @State() test: string = this.name;
      if (
        ts.isPropertyAccessExpression(node) &&
        isThisExpression(node.expression)
      ) {
        return node.name;
      }

      // e.g. @State() test: string = this.getName();

      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        isThisExpression(node.expression.expression)
      ) {
        return ts.factory.createCallExpression(
          node.expression.name,
          undefined,
          node.arguments
        );
      }

      // e.g. @State() test: string = this.person.name;
      if (
        ts.isPropertyAccessExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        isThisExpression(node.expression.expression)
      ) {
        return ts.factory.createPropertyAccessExpression(
          node.expression.name,
          node.name
        );
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return (root) => ts.visitNode(root, visitor);
  };
}
