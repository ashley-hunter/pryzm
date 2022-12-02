import * as ts from 'typescript';

export function findDependencies<T extends ts.Block>(node: T): Dependency[] {
  const dependencies: Dependency[] = [];

  const visitor = (node: ts.Node) => {
    ts.forEachChild(node, visitor);
  };

  ts.forEachChild(node, visitor);

  return dependencies;
}

interface Dependency {
  name: string;
  type: 'getter' | 'setter';
}
