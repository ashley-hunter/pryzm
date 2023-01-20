import * as ts from 'typescript';
import { transformAssignment } from './assignment';

describe('Assignment', () => {
  it('should convert a simple assignment', () => {
    const source = `this.test = 'test';`;
    const result = transform(source);
    expect(result).toMatchInlineSnapshot(`
      "setTest(\\"test\\");
      "
    `);
  });

  it('should convert a simple assignment with a spread', () => {
    const source = `this.test = { ...this.test, test: 'new' };`;

    const result = transform(source);
    expect(result).toMatchInlineSnapshot(`
      "setTest({ ...test, test: \\"new\\" });
      "
    `);
  });

  it('should convert a simple assignment of an array', () => {
    const source = `this.test = ['new'];`;

    const result = transform(source);
    expect(result).toMatchInlineSnapshot(`
      "setTest([\\"new\\"]);
      "
    `);
  });

  it('should convert a simple assignment of an array with a spread', () => {
    const source = `this.test = [...this.test, 'new'];`;

    const result = transform(source);
    expect(result).toMatchInlineSnapshot(`
      "setTest([...test, \\"new\\"]);
      "
    `);
  });

  it('should convert an assignment using +=', () => {
    const source = `this.test += 1;`;

    const result = transform(source);
    expect(result).toMatchInlineSnapshot(`
      "setTest(test => test + 1);
      "
    `);
  });

  it('should convert an assignment using ++', () => {
    const source = `this.test++;`;

    const result = transform(source);
    expect(result).toMatchInlineSnapshot(`
      "setTest(test => test + 1);
      "
    `);
  });

  it('should allow deep assignments', () => {
    const source = `this.test.test = 'new';`;

    const result = transform(source);
    expect(result).toMatchInlineSnapshot(`
      "setTest(test => ({
          ...test,
          test: \\"new\\"
      }));
      "
    `);
  });

  it('should allow deep object assignments', () => {
    const source = `this.test.test = {...this.test.test, new: 'value' };`;

    const result = transform(source);
    expect(result).toMatchInlineSnapshot(`
      "setTest(test => ({
          ...test,
          test: { ...test.test, new: \\"value\\" }
      }));
      "
    `);
  });

  it('should allow array pushes', () => {
    const source = `this.test.push('new');`;

    const result = transform(source);
    expect(result).toMatchInlineSnapshot(`
      "setTest(test => {
          test.push(\\"new\\");
          return test;
      });
      "
    `);
  });

  function transform(source: string): string {
    const sourceFile = ts.createSourceFile(
      'test.ts',
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

    const output = transformAssignment(sourceFile);

    const printer = ts.createPrinter();
    return printer.printFile(output);
  }
});
