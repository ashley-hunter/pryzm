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
      dependencies.add(node.name.getText());
    }

    // find any assignments that use "this"
    if (ts.isBinaryExpression(node) && isThisExpression(node.left)) {
      // add the property name to the dependencies array
      dependencies.add(setterName(node.left.getText()));
    }

    ts.forEachChild(node, visitor);
  };

  ts.forEachChild(node, visitor);

  return Array.from(dependencies);
}
