import * as ts from 'typescript';

export function isThisExpression(node: ts.Node): node is ts.ThisExpression {
  return node.kind === ts.SyntaxKind.ThisKeyword;
}

export function isMutableArrayCallExpression(
  node: ts.Node
): node is ts.CallExpression {
  const mutableArrayMethods = [
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'sort',
    'reverse',
  ];

  if (
    !ts.isCallExpression(node) ||
    !ts.isPropertyAccessExpression(node.expression)
  ) {
    return false;
  }

  // check that the name of the root property access expression is an array method
  if (!mutableArrayMethods.includes(node.expression.name.getText())) {
    return false;
  }

  // there may be multiple levels of property access so we need to traverse down to the last one
  let expression = node.expression;

  while (ts.isPropertyAccessExpression(expression.expression)) {
    expression = expression.expression;
  }

  // check that the root property access expression uses "this"
  return isThisExpression(expression.expression);
}
