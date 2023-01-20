import * as ts from 'typescript';
import { addComment, extractComment } from '../utils/comment';

export function createInterfaceProperty(
  name: string,
  type: ts.TypeNode | ts.FunctionTypeNode,
  source: ts.PropertyDeclaration
): ts.PropertySignature {
  // determine if the property is optional
  const isOptional = source.questionToken !== undefined;

  const signature = ts.factory.createPropertySignature(
    undefined,
    name,
    isOptional
      ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
      : undefined,
    type
  );

  if (source) {
    const comment = extractComment(source);

    if (comment) {
      addComment(signature, comment);
    }
  }

  return signature;
}

export function createDestructuredProperty(
  name: string,
  initializer?: ts.Expression
): ts.BindingElement {
  return ts.factory.createBindingElement(
    undefined,
    undefined,
    name,
    initializer
  );
}

export function createFunctionTypeNode(type?: ts.TypeNode) {
  return ts.factory.createFunctionTypeNode(
    undefined,
    type
      ? [
          ts.factory.createParameterDeclaration(
            undefined,
            undefined,
            ts.factory.createIdentifier('event'),
            undefined,
            type,
            undefined
          ),
        ]
      : [],
    ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)
  );
}
