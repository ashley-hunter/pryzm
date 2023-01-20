import { getText } from '@pryzm/ast-utils';
import * as ts from 'typescript';

export function inferType(
  initializer: ts.Expression | undefined,
  defaultToAny?: false
): ts.TypeNode | undefined;
export function inferType(
  initializer: ts.Expression | undefined,
  defaultToAny?: true
): ts.TypeNode;
export function inferType(
  initializer: ts.Expression | undefined,
  defaultToAny?: boolean
): ts.TypeNode | undefined {
  defaultToAny = defaultToAny ?? true;

  if (!initializer) {
    return ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
  }

  switch (initializer.kind) {
    case ts.SyntaxKind.StringLiteral:
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
    case ts.SyntaxKind.NumericLiteral:
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    case ts.SyntaxKind.TrueKeyword:
    case ts.SyntaxKind.FalseKeyword:
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);

    // arrow function
    case ts.SyntaxKind.ArrowFunction:
      return ts.factory.createFunctionTypeNode(
        undefined,
        (initializer as ts.ArrowFunction).parameters.map((parameter) =>
          ts.factory.createParameterDeclaration(
            undefined,
            undefined,
            parameter.name,
            undefined,
            parameter.type ??
              ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
          )
        ),
        (initializer as ts.ArrowFunction).type ??
          ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
      );

    case ts.SyntaxKind.FunctionExpression:
      return ts.factory.createFunctionTypeNode(
        undefined,
        (initializer as ts.FunctionExpression).parameters.map((parameter) =>
          ts.factory.createParameterDeclaration(
            undefined,
            undefined,
            parameter.name,
            undefined,
            parameter.type ??
              ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
          )
        ),
        (initializer as ts.FunctionExpression).type ??
          ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
      );

    case ts.SyntaxKind.ArrayLiteralExpression:
      // infer the type of the first element in the array
      const firstElement = (initializer as ts.ArrayLiteralExpression)
        .elements[0];

      // if there is no first element, then the array is empty
      // so we can infer the type as any
      if (!firstElement) {
        return ts.factory.createArrayTypeNode(
          ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
        );
      }

      // infer the type of the first element
      const elementType = inferType(firstElement, true);

      // create an array type node with the inferred type
      return ts.factory.createArrayTypeNode(elementType);
    case ts.SyntaxKind.ObjectLiteralExpression:
      return ts.factory.createTypeLiteralNode(
        (initializer as ts.ObjectLiteralExpression).properties.map(
          (property) => {
            if (ts.isPropertyAssignment(property)) {
              return ts.factory.createPropertySignature(
                undefined,
                getText(property.name),
                undefined,
                inferType(property.initializer, true)
              );
            }
            return ts.factory.createPropertySignature(
              undefined,
              getText(property.name!),
              undefined,
              ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
            );
          }
        )
      );
    default:
      return defaultToAny
        ? ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
        : undefined;
  }
}
