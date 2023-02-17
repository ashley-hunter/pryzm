import * as ts from 'typescript';

export function hasDecorator(node: ts.PropertyAssignment, name: string): boolean {
  if (!ts.canHaveDecorators(node)) {
    return false;
  }

  return (
    ts.getDecorators(node)?.some(modifier => {
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
  node: ts.PropertyLikeDeclaration | ts.ClassDeclaration,
  name: string
): ts.Decorator | undefined {
  if (!ts.canHaveDecorators(node)) {
    return undefined;
  }

  return ts.getDecorators(node)?.find(modifier => {
    return (
      ts.isDecorator(modifier) &&
      ts.isCallExpression(modifier.expression) &&
      ts.isIdentifier(modifier.expression.expression) &&
      modifier.expression.expression.text === name
    );
  });
}

export function getDecoratorParameter(decorator: ts.Decorator): ts.Expression | undefined {
  if (!ts.isCallExpression(decorator.expression)) {
    return undefined;
  }

  return decorator.expression.arguments[0];
}

export function getDecoratorProperty(
  decorator: ts.Decorator,
  name: string
): ts.ObjectLiteralElementLike | undefined {
  const parameter = getDecoratorParameter(decorator);

  if (!parameter || !ts.isObjectLiteralExpression(parameter)) {
    return undefined;
  }

  return parameter.properties.find(property => {
    return (
      ts.isPropertyAssignment(property) &&
      ts.isIdentifier(property.name) &&
      property.name.text === name
    );
  });
}
