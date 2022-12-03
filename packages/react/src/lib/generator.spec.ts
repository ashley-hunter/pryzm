import { transform } from '@emblazon/compiler';
import * as ts from 'typescript';
import { generatePropsInterface } from './generator';
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
          return <div>{this.test}</div>;
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

  function printNode(node: ts.Node) {
    const printer = ts.createPrinter();
    return printer.printNode(ts.EmitHint.Unspecified, node, null as any);
  }
});
