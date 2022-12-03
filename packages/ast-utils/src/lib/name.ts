import * as ts from 'typescript';

export function getPropertyName(node: ts.PropertyLikeDeclaration): string {
  return node.name.getText();
}
