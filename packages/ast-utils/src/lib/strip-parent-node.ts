import * as ts from 'typescript';

export function stripParentNode<T extends ts.Node>(node: T): T {
  // run the ts transformer
  return ts.transform(node, [stripParentNodeTransformer()]).transformed[0];
}

// create a ts transformer factory
function stripParentNodeTransformer<T extends ts.Node>(): ts.TransformerFactory<T> {
  return context => {
    const visitor = (node: ts.Node): ts.Node => {
      // set the parent node to undefined
      (node as Mutable<T>).parent = undefined as unknown as T['parent'];

      return ts.visitEachChild(node, visitor, context);
    };

    return root => ts.visitNode(root, visitor) as T;
  };
}

type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};
