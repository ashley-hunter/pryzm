import { InMemoryTree, Tree } from '../fs';
import { ProjectGraph } from './project-graph';

describe('Project Graph', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = new InMemoryTree('/');
    tree.write('/index.ts', 'import { foo } from "./foo";');
    tree.write('/foo.ts', 'export const foo = "foo";');
    tree.write('/bar.ts', 'export const bar = "bar";');
    tree.write('/baz.ts', 'import { bar } from "./bar"; import { foo } from "./foo";');
  });

  it('should create a project graph', () => {
    const graph = new ProjectGraph({ tree, config: { rootDir: '/' } });

    expect(graph).toBeTruthy();
  });
});
