import { transform } from '@emblazon/compiler';
import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { transformer } from './transformer';
describe('React Transformer', () => {
  // create a printer to convert the transformed source back to text
  const printer = ts.createPrinter();

  describe('State', () => {
    it('should transform state into a useState hook', () => {
      const source = `
      import { Component, State } from '@emblazon/core';
      @Component()
      export class Test {
        @State() test: string;

        render() {
          return <div />;
        }
      }
    `;
      const components = transform(source, transformer);
      const result = components[0];
      const props = result.states as ts.VariableStatement[];

      expect(printNode(props[0])).toMatchInlineSnapshot(
        '"const [test, setTest] = useState<string>();"'
      );
    });

    it('should transform state into a useState hook with a default value', () => {
      const source = `
      import { Component, State } from '@emblazon/core';
      @Component()
      export class Test {
        @State() test: string = 'test';

        render() {
          return <div />;
        }
      }
    `;
      const components = transform(source, transformer);
      const result = components[0];
      const props = result.states as ts.VariableStatement[];

      expect(printNode(props[0])).toMatchInlineSnapshot(
        '"const [test, setTest] = useState<string>(\\"test\\");"'
      );
    });

    it('should transform state into a useState hook with a default value without a type', () => {
      const source = `
      import { Component, State } from '@emblazon/core';
      @Component()
      export class Test {
        @State() test = 'test';

        render() {
          return <div />;
        }
      }
    `;
      const components = transform(source, transformer);
      const result = components[0];
      const props = result.states as ts.VariableStatement[];

      expect(printNode(props[0])).toMatchInlineSnapshot(
        '"const [test, setTest] = useState(\\"test\\");"'
      );
    });

    it('should transform state into a useState hook with a default value from a function', () => {
      const source = `
      import { Component, State } from '@emblazon/core';
      @Component()
      export class Test {
        @State() test: string = () => 'test';

        render() {
          return <div />;
        }
      }
    `;
      const components = transform(source, transformer);
      const result = components[0];
      const props = result.states as ts.VariableStatement[];

      expect(printNode(props[0])).toMatchInlineSnapshot(
        '"const [test, setTest] = useState<string>(() => \\"test\\");"'
      );
    });

    it('should transform state into a useState hook with a default number value', () => {
      const source = `
      import { Component, State } from '@emblazon/core';
      @Component()
      export class Test {
        @State() test: number = 1;

        render() {
          return <div />;
        }
      }
    `;
      const components = transform(source, transformer);
      const result = components[0];
      const props = result.states as ts.VariableStatement[];

      expect(printNode(props[0])).toMatchInlineSnapshot(
        '"const [test, setTest] = useState<number>(1);"'
      );
    });

    it('should transform state into a useState hook with a default boolean value', () => {
      const source = `
      import { Component, State } from '@emblazon/core';
      @Component()
      export class Test {
        @State() test: boolean = true;

        render() {
          return <div />;
        }
      }
    `;
      const components = transform(source, transformer);
      const result = components[0];
      const props = result.states as ts.VariableStatement[];

      expect(printNode(props[0])).toMatchInlineSnapshot(
        '"const [test, setTest] = useState<boolean>(true);"'
      );
    });

    it('should transform state into a useState hook with a default array value', () => {
      const source = `
      import { Component, State } from '@emblazon/core';
      @Component()
      export class Test {
        @State() test: string[] = ['test'];

        render() {
          return <div />;
        }
      }
    `;
      const components = transform(source, transformer);
      const result = components[0];
      const props = result.states as ts.VariableStatement[];

      expect(printNode(props[0])).toMatchInlineSnapshot(
        '"const [test, setTest] = useState<string[]>([\\"test\\"]);"'
      );
    });

    it('should transform state into a useState hook with a default object value', () => {
      const source = `
      import { Component, State } from '@emblazon/core';
      @Component()
      export class Test {
        @State() test: { test: string } = { test: 'test' };

        render() {
          return <div />;
        }
      }
    `;
      const components = transform(source, transformer);
      const result = components[0];
      const props = result.states as ts.VariableStatement[];

      expect(printNode(props[0])).toMatchInlineSnapshot(`
        "const [test, setTest] = useState<{
            test: string;
        }>({ test: \\"test\\" });"
      `);
    });
  });

  function printNode(node: ts.Node) {
    return printer.printNode(ts.EmitHint.Unspecified, node, null as any);
  }
});
