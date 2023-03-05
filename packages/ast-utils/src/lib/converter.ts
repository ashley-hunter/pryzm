import * as ts from 'typescript';
import { factory } from 'typescript';

/**
 * Convert a method to a function.
 */
export function convertMethodToFunction(method: ts.MethodDeclaration): ts.FunctionDeclaration {
  return factory.createFunctionDeclaration(
    method.modifiers,
    method.asteriskToken,
    factory.createIdentifier((method.name as ts.StringLiteral).text),
    method.typeParameters,
    method.parameters,
    method.type,
    method.body
  );
}

/**
 * Convert a method to an arrow function.
 */
export function convertMethodToArrowFunction(method: ts.MethodDeclaration): ts.ArrowFunction {
  // extract the modifiers from the method that are allowed on arrow functions
  const modifiers = method.modifiers?.filter(modifier => ts.isModifier(modifier)) as
    | ts.Modifier[]
    | undefined;

  if (method.body === undefined) {
    throw new Error('Cannot convert method without a body to an arrow function.');
  }

  // convert the method body to a concise body
  const body = factory.createBlock(method.body.statements);

  return factory.createArrowFunction(
    modifiers,
    method.typeParameters,
    method.parameters,
    method.type,
    factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    body
  );
}
