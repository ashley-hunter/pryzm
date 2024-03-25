import * as ts from 'typescript';
import { inferType } from './type-inference';

export function getPropertyName(
  node:
    | ts.PropertyDeclaration
    | ts.GetAccessorDeclaration
    | ts.SetAccessorDeclaration
    | ts.PropertyAccessExpression
    | ts.MethodDeclaration
): string {
  return getText(node.name);
}

export function getPropertyType(
  node:
    | ts.PropertyDeclaration
    | ts.GetAccessorDeclaration
    | ts.SetAccessorDeclaration
    | ts.PropertyAccessExpression
    | ts.MethodDeclaration,
  infer = false
): ts.TypeNode | undefined {
  if (ts.isPropertyDeclaration(node)) {
    return node.type ?? (infer ? inferType(node.initializer) : undefined);
  }

  if (ts.isGetAccessorDeclaration(node)) {
    return node.type ?? (infer ? inferType(getReturnExpression(node)) : undefined);
  }

  return undefined;
}

export function isPropertyReadonly(node: ts.PropertyDeclaration): boolean {
  return node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ReadonlyKeyword) ?? false;
}

export function isPropertyPublic(node: ts.PropertyDeclaration): boolean {
  return node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.PublicKeyword) ?? false;
}

export function isPropertyPrivate(node: ts.PropertyDeclaration): boolean {
  return node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.PrivateKeyword) ?? false;
}

export function isPropertyProtected(node: ts.PropertyDeclaration): boolean {
  return (
    node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ProtectedKeyword) ?? false
  );
}

export function getReturnExpression(node: ts.GetAccessorDeclaration): ts.Expression | undefined {
  // find the return statement using ts-query
  const returnStatement = node.body?.statements.find(
    statement => statement.kind === ts.SyntaxKind.ReturnStatement
  ) as ts.ReturnStatement;

  // return the expression
  return returnStatement?.expression;
}

export function getText(node: ts.Node): string {
  // create a printer to get the text
  const printer = ts.createPrinter();

  // print the node
  return printer.printNode(ts.EmitHint.Unspecified, node, null as any);
}
