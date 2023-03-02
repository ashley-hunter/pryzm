import * as ts from 'typescript';
import { stripParentNode } from './strip-parent-node';
import { isThisExpression } from './typing';

export function stripThis<T extends ts.Node | undefined>(
  node: T
): T extends ts.Node ? T : undefined {
  if (node === undefined) {
    return undefined as T extends ts.Node ? T : undefined;
  }

  // run the ts transformer
  return ts.transform(stripParentNode(node), [stripThisTransformer()])
    .transformed[0] as T extends ts.Node ? T : undefined;
}

// create a ts transformer factory
function stripThisTransformer<T extends ts.Node>(): ts.TransformerFactory<T> {
  return context => {
    const visitor = (node: ts.Node): ts.Node => {
      // e.g. @State() test: string = this.name;
      // e.g. @State() test: string = this.getName();
      // e.g. @State() test: string = this.person.name;
      if (ts.isPropertyAccessExpression(node) && isThisExpression(node.expression)) {
        return node.name;
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return root => ts.visitNode(root, visitor);
  };
}
