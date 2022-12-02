import * as ts from 'typescript';
import { extractComment } from './comment';

describe('Comment Utils', () => {
  it('should extract a JSDoc comment', () => {
    const node = getNode(`
      /**
       * This is a comment
       * @param name
       * @param age
       * @returns {string}
       */
      function foo(name: string, age: number): string {
        return name;
      }
    `);
    expect(extractComment(node)).toMatchInlineSnapshot(`
      "* This is a comment
             * @param name
             * @param age
             * @returns {string}"
    `);
  });

  it('should extract a single line comment', () => {
    const node = getNode(`
      // This is a comment
      function foo(name: string, age: number): string {
        return name;
      }
    `);

    expect(extractComment(node)).toMatchInlineSnapshot('"This is a comment"');
  });

  function getNode(text: string) {
    const sourceFile = ts.createSourceFile(
      'test.ts',
      text,
      ts.ScriptTarget.Latest,
      true
    );
    return sourceFile.statements[0];
  }
});
