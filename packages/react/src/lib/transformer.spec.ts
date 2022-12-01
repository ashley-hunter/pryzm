import { transform } from '@emblazon/compiler';
import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { transformer } from './transformer';
describe('React Transformer', () => {
  // create a printer to convert the transformed source back to text
  const printer = ts.createPrinter();

  describe('Props', () => {
    it('should transform a prop into a useState hook', () => {
      const source = `
      import { Component } from '@emblazon/core';
      @Component()
      export class Test {
        @Prop() readonly test: string;

        render() {
          return <div />;
        }
      }
    `;
      const components = transform(source, transformer);
      const result = components[0];
      const props = result.props as ts.VariableStatement[];

      expect(printNode(props[0])).toMatchInlineSnapshot(
        '"const [test, setTest] = useState<string>();"'
      );
    });

    it('should transform a prop into a useState hook with a default value', () => {
      const source = `
      import { Component } from '@emblazon/core';
      @Component()
      export class Test {
        @Prop() readonly test: string = 'test';

        render() {
          return <div />;
        }
      }
    `;
      const components = transform(source, transformer);
      const result = components[0];
      const props = result.props as ts.VariableStatement[];

      expect(printNode(props[0])).toMatchInlineSnapshot(
        '"const [test, setTest] = useState<string>(\\"test\\");"'
      );
    });

    it('should transform a prop into a useState hook with a default value without a type', () => {
      const source = `
      import { Component } from '@emblazon/core';
      @Component()
      export class Test {
        @Prop() readonly test = 'test';

        render() {
          return <div />;
        }
      }
    `;
      const components = transform(source, transformer);
      const result = components[0];
      const props = result.props as ts.VariableStatement[];

      expect(printNode(props[0])).toMatchInlineSnapshot(
        '"const [test, setTest] = useState(\\"test\\");"'
      );
    });

    it('should transform a prop into a useState hook with a default value from a function', () => {
      const source = `
      import { Component } from '@emblazon/core';
      @Component()
      export class Test {
        @Prop() readonly test: string = () => 'test';

        render() {
          return <div />;
        }
      }
    `;
      const components = transform(source, transformer);
      const result = components[0];
      const props = result.props as ts.VariableStatement[];

      expect(printNode(props[0])).toMatchInlineSnapshot(
        '"const [test, setTest] = useState<string>(() => \\"test\\");"'
      );
    });

    it('should transform a prop into a useState hook with a default number value', () => {
      const source = `
      import { Component } from '@emblazon/core';
      @Component()
      export class Test {
        @Prop() readonly test: number = 1;

        render() {
          return <div />;
        }
      }
    `;
      const components = transform(source, transformer);
      const result = components[0];
      const props = result.props as ts.VariableStatement[];

      expect(printNode(props[0])).toMatchInlineSnapshot(
        '"const [test, setTest] = useState<number>(1);"'
      );
    });

    it('should transform a prop into a useState hook with a default boolean value', () => {
      const source = `
      import { Component } from '@emblazon/core';
      @Component()
      export class Test {
        @Prop() readonly test: boolean = true;

        render() {
          return <div />;
        }
      }
    `;
      const components = transform(source, transformer);
      const result = components[0];
      const props = result.props as ts.VariableStatement[];

      expect(printNode(props[0])).toMatchInlineSnapshot(
        '"const [test, setTest] = useState<boolean>(true);"'
      );
    });

    it('should transform a prop into a useState hook with a default array value', () => {
      const source = `
      import { Component } from '@emblazon/core';
      @Component()
      export class Test {
        @Prop() readonly test: string[] = ['test'];

        render() {
          return <div />;
        }
      }
    `;
      const components = transform(source, transformer);
      const result = components[0];
      const props = result.props as ts.VariableStatement[];

      expect(printNode(props[0])).toMatchInlineSnapshot(
        '"const [test, setTest] = useState<string[]>([\\"test\\"]);"'
      );
    });
  });

  function printNode(node: ts.Node) {
    return printer.printNode(ts.EmitHint.Unspecified, node, null as any);
  }
});
