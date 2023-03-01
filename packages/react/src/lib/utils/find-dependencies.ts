import { getText, isThisExpression } from '@pryzm/ast-utils';
import * as ts from 'typescript';

export function findDependencies<T extends ts.Block>(node: T): string[] {
  const dependencies = new Set<string>();

  const visitor = (node: ts.Node) => {
    // find any method calls
    // or find any property access expressions that use "this"
    if (ts.isPropertyAccessExpression(node) && isThisExpression(node.expression)) {
      // check if the parent is a binary expression
      // and that the operator is an assignment
      // and that the current node is the left side of the assignment
      if (
        ts.isBinaryExpression(node.parent) &&
        ts.isToken(node.parent.operatorToken) &&
        node.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        node === node.parent.left
      ) {
        // add the property name to the dependencies array
        // dependencies.add(setterName(getText(node.name)));
        // do nothing as setters are guaranteed to be referentially equal
      } else {
        // add the property name to the dependencies array
        dependencies.add(getText(node.name));
      }
    }

    ts.forEachChild(node, visitor);
  };

  ts.forEachChild(node, visitor);

  return Array.from(dependencies);
}
