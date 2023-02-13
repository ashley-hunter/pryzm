import * as ts from 'typescript';
import { inferType } from './type-inference';

describe('Type inference', () => {
  it('should infer a string type', () => {
    const initializer = getInitializer(`const variable = "value";`);
    expect(printType(inferType(initializer))).toMatchInlineSnapshot('"string"');
  });

  it('should infer a number type', () => {
    const initializer = getInitializer(`const variable = 1;`);
    expect(printType(inferType(initializer))).toMatchInlineSnapshot('"number"');
  });

  it('should infer a boolean type from true', () => {
    const initializer = getInitializer(`const variable = true;`);
    expect(printType(inferType(initializer))).toMatchInlineSnapshot('"boolean"');
  });

  it('should infer a boolean type from false', () => {
    const initializer = getInitializer(`const variable = false;`);
    expect(printType(inferType(initializer))).toMatchInlineSnapshot('"boolean"');
  });

  it('should infer an array type', () => {
    const initializer = getInitializer(`const variable = [];`);
    expect(printType(inferType(initializer))).toMatchInlineSnapshot('"any[]"');
  });

  it('should infer an array type with a string element', () => {
    const initializer = getInitializer(`const variable = ["value"];`);
    expect(printType(inferType(initializer))).toMatchInlineSnapshot('"string[]"');
  });

  it('should infer an object type', () => {
    const initializer = getInitializer(`const variable = { name: 'John' };`);

    expect(printType(inferType(initializer))).toMatchInlineSnapshot(`
      "{
          name: string;
      }"
    `);
  });

  it('should infer an object type with a nested object', () => {
    const initializer = getInitializer(
      `const variable = { name: 'John', address: { city: 'New York' } };`
    );

    expect(printType(inferType(initializer))).toMatchInlineSnapshot(`
      "{
          name: string;
          address: {
              city: string;
          };
      }"
    `);
  });

  it('should infer an object type with a nested array', () => {
    const initializer = getInitializer(
      `const variable = { name: 'John', addresses: [{ city: 'New York' }] };`
    );
    expect(printType(inferType(initializer))).toMatchInlineSnapshot(`
      "{
          name: string;
          addresses: {
              city: string;
          }[];
      }"
    `);
  });

  it('should infer an arrow function with no parameters', () => {
    const initializer = getInitializer(`const variable = () => {};`);
    expect(printType(inferType(initializer))).toMatchInlineSnapshot('"() => any"');
  });

  it('should infer an arrow function with a return type', () => {
    const initializer = getInitializer(`const variable = (): number => {};`);
    expect(printType(inferType(initializer))).toMatchInlineSnapshot('"() => number"');
  });

  it('should infer an arrow function with a parameter', () => {
    const initializer = getInitializer(`const variable = (param) => {};`);
    expect(printType(inferType(initializer))).toMatchInlineSnapshot('"(param: any) => any"');
  });

  it('should infer an arrow function with a parameter with types', () => {
    const initializer = getInitializer(`const variable = (param: number) => {};`);
    expect(printType(inferType(initializer))).toMatchInlineSnapshot('"(param: number) => any"');
  });

  it('should infer an arrow function with multiple parameters', () => {
    const initializer = getInitializer(`const variable = (param1, param2) => {};`);
    expect(printType(inferType(initializer))).toMatchInlineSnapshot(
      '"(param1: any, param2: any) => any"'
    );
  });

  it('should infer an anonymous function with no parameters', () => {
    const initializer = getInitializer(`const variable = function() {};`);
    expect(printType(inferType(initializer))).toMatchInlineSnapshot('"() => any"');
  });

  it('should infer an anonymous function with a return type', () => {
    const initializer = getInitializer(`const variable = function(): number {};`);
    expect(printType(inferType(initializer))).toMatchInlineSnapshot('"() => number"');
  });

  it('should infer an anonymous function with a parameter', () => {
    const initializer = getInitializer(`const variable = function(param) {};`);
    expect(printType(inferType(initializer))).toMatchInlineSnapshot('"(param: any) => any"');
  });

  it('should infer an anonymous function with a parameter with types', () => {
    const initializer = getInitializer(`const variable = function(param: number) {};`);
    expect(printType(inferType(initializer))).toMatchInlineSnapshot('"(param: number) => any"');
  });

  it('should infer an anonymous function with multiple parameters', () => {
    const initializer = getInitializer(`const variable = function(param1, param2) {};`);
    expect(printType(inferType(initializer))).toMatchInlineSnapshot(
      '"(param1: any, param2: any) => any"'
    );
  });

  it('should infer an arrow function with multiple parameters with types', () => {
    const initializer = getInitializer(`const variable = (param1: number, param2: string) => {};`);
    expect(printType(inferType(initializer))).toMatchInlineSnapshot(
      '"(param1: number, param2: string) => any"'
    );
  });

  function getInitializer(code: string): ts.Expression {
    const source = ts.createSourceFile(
      'test.ts',
      code,
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS
    );

    // get the initialiser from the first property assignment e.g.
    // const a = "test" => 'test'
    const initializer = (source.statements[0] as ts.VariableStatement).declarationList
      .declarations[0].initializer;

    return initializer!;
  }
});

function printType(type?: ts.TypeNode) {
  if (!type) {
    return '';
  }

  const printer = ts.createPrinter();
  return printer.printNode(
    ts.EmitHint.Unspecified,
    type,
    ts.createSourceFile('test.ts', '', ts.ScriptTarget.ESNext)
  );
}
