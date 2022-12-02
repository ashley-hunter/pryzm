import * as ts from 'typescript';

export function stripThis<T extends ts.Node>(
  node: T | undefined
): T | undefined {
  if (!node) {
    return node;
  }
  // run the ts transformer
  return ts.transform(node, [stripThisTransformer()]).transformed[0];
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

      return ts.visitEachChild(node, visitor, context);
    };

    return (root) => ts.visitNode(root, visitor);
  };
}

function isThisExpression(node: ts.Node): node is ts.ThisExpression {
  return node.kind === ts.SyntaxKind.ThisKeyword;
}
