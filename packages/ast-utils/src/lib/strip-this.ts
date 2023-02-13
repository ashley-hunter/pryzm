import { stripParentNode } from '@pryzm/ast-utils';
import * as ts from 'typescript';
import { isThisExpression } from './typing';

export function stripThis<T extends ts.Node, R extends ts.Node = T>(
  node: T | undefined
): R | undefined {
  if (!node) {
    return node;
  }

  // run the ts transformer
  return ts.transform(stripParentNode(node), [stripThisTransformer()])
    .transformed[0] as unknown as R;
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
