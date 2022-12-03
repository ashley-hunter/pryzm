import * as ts from 'typescript';

export function hasDecorator(
  node: ts.PropertyAssignment,
  name: string
): boolean {
  if (!ts.canHaveDecorators(node)) {
    return false;
  }

  return (
    ts.getDecorators(node)?.some((modifier) => {
      return (
        ts.isDecorator(modifier) &&
        ts.isCallExpression(modifier.expression) &&
        ts.isIdentifier(modifier.expression.expression) &&
        modifier.expression.expression.text === name
      );
    }) ?? false
  );
}

export function getDecorator(
  node: ts.PropertyLikeDeclaration,
  name: string
): ts.Decorator | undefined {
  if (!ts.canHaveDecorators(node)) {
    return undefined;
  }

  return ts.getDecorators(node)?.find((modifier) => {
    return (
      ts.isDecorator(modifier) &&
      ts.isCallExpression(modifier.expression) &&
      ts.isIdentifier(modifier.expression.expression) &&
      modifier.expression.expression.text === name
    );
  });
}
