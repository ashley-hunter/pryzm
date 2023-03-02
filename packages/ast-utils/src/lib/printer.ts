import * as ts from 'typescript';

export function printNode<T extends ts.Node | undefined>(
  node: T
): T extends ts.Node ? string : undefined {
  if (!node) {
    return undefined as T extends ts.Node ? string : undefined;
  }
  const printer = ts.createPrinter();
  return printer.printNode(ts.EmitHint.Unspecified, node, null as any) as T extends ts.Node
    ? string
    : undefined;
}
