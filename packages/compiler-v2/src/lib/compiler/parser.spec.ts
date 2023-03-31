import * as ts from 'typescript';
import { parseFile } from './parser';

describe('Parser', () => {
  it('should parse a component with a selector', () => {
    const output = parse(`
      import { Component } from '@pryzm/core';

      @Component({
        selector: 'my-component'
      })
      export class MyComponent {
        render() {
          return <div>Hello World</div>;
        }
      }
    `);

    expect(output.component).toBeDefined();
    expect(output.component!.selector).toBe('my-component');
  });
});

function parse(source: string) {
  const sourceFile = ts.createSourceFile(
    'test.ts',
    source,
    ts.ScriptTarget.ES2015,
    true,
    ts.ScriptKind.TSX
  );
  return parseFile(sourceFile);
}
