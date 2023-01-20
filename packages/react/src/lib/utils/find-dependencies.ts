import { getText } from '@pryzm/ast-utils';
import * as ts from 'typescript';
import { setterName } from './names';
import { isThisExpression } from './typing';

export function findDependencies<T extends ts.Block>(node: T): string[] {
  const dependencies = new Set<string>();

  const visitor = (node: ts.Node) => {
    // find any method calls
    // or find any property access expressions that use "this"
    if (
      ts.isPropertyAccessExpression(node) &&
      isThisExpression(node.expression)
    ) {
      // add the property name to the dependencies array
      dependencies.add(getText(node.name));
    }

    // find any assignments that use "this"
    if (
      ts.isBinaryExpression(node) &&
      // and check that the operator is an assignment
      ts.isToken(node.operatorToken) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isPropertyAccessExpression(node.left) &&
      isThisExpression(node.left.expression)
    ) {
      // add the property name to the dependencies array
      dependencies.add(setterName(getText(node.left.name)));

      ts.forEachChild(node.right, visitor);
      return;
    }

    ts.forEachChild(node, visitor);
  };

  ts.forEachChild(node, visitor);

  return Array.from(dependencies);
}
