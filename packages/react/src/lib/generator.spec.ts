import { transform } from '@emblazon/compiler';
import * as ts from 'typescript';
import { generatePropsInterface, generatePropsParameter } from './generator';
import { transformer } from './transformer';

describe('Generator', () => {
  describe('Props interface', () => {
    it('should generate a props interface', () => {
      const source = `
      @Component()
      export class Test {
        /** Users first name */
        @Prop() readonly firstName: string;

        /** Users last name */
        @Prop() readonly lastName: string;

        render() {
          return <div>{this.firstName} {this.lastName}</div>;
        }
      }
    `;

      const result = transform(source, transformer);
      const output = generatePropsInterface(result);

      expect(printNode(output)).toMatchInlineSnapshot(`
        "export interface TestProps {
            /* Users first name */
            firstName: string;
            /* Users last name */
            lastName: string;
        }"
      `);
    });

    it('should generate a props interface with a default value', () => {
      const source = `
      @Component()
      export class Test {
        /** Users first name */
        @Prop() readonly firstName: string = 'John';

        /** Users last name */
        @Prop() readonly lastName: string = 'Doe';

        render() {
          return <div>{this.firstName} {this.lastName}</div>;
        }
      }
    `;

      const result = transform(source, transformer);
      const output = generatePropsInterface(result);

      expect(printNode(output)).toMatchInlineSnapshot(`
        "export interface TestProps {
            /* Users first name */
            firstName: string;
            /* Users last name */
            lastName: string;
        }"
      `);
    });
  });

  describe('Props parameter', () => {
    it('should generate a props parameter', () => {
      const source = `
      @Component()
      export class Test {
        /** Users first name */
        @Prop() readonly firstName: string;

        /** Users last name */
        @Prop() readonly lastName: string;

        render() {
          return <div>{this.firstName} {this.lastName}</div>;
        }
      }
    `;

      const result = transform(source, transformer);
      const output = generatePropsParameter(result);

      expect(printNode(output)).toMatchInlineSnapshot(
        '"{ firstName, lastName }: TestProps"'
      );
    });

    it('should generate a props parameter with a default value', () => {
      const source = `
      @Component()
      export class Test {
        /** Users first name */
        @Prop() readonly firstName: string = 'John';

        /** Users last name */
        @Prop() readonly lastName: string = 'Doe';

        render() {
          return <div>{this.firstName} {this.lastName}</div>;
        }
      }
    `;

      const result = transform(source, transformer);
      const output = generatePropsParameter(result);

      expect(printNode(output)).toMatchInlineSnapshot('"{ firstName = \\"John\\", lastName = \\"Doe\\" }: TestProps"');
    });
  });

  function printNode(node: ts.Node) {
    const printer = ts.createPrinter();
    return printer.printNode(ts.EmitHint.Unspecified, node, null as any);
  }
});
