import * as ts from 'typescript';

export function getPropertyName(node: ts.PropertyLikeDeclaration): string {
  return getText(node.name);
}

export function getText(node: ts.Node): string {
  // create a printer to get the text
  const printer = ts.createPrinter();

  // print the node
  return printer.printNode(ts.EmitHint.Unspecified, node, null as any);
}
