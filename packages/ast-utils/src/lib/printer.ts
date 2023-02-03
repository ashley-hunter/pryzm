import * as ts from 'typescript';

export function printNode(node: ts.Node): string {
  const printer = ts.createPrinter();
  return printer.printNode(ts.EmitHint.Unspecified, node, null as any);
}
