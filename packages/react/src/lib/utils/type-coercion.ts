import * as ts from 'typescript';

export function isThisExpression(node: ts.Node): node is ts.ThisExpression {
  return node.kind === ts.SyntaxKind.ThisKeyword;
}
