import { Printer, transform, TransformerResult } from '@pryzm/compiler';
import { LitTranformer, transformer } from './transformer';

export function print(source: string): string {
  const printer = new LitPrinter();
  return printer.print(transform(source, transformer));
}

export class LitPrinter implements Printer<LitTranformer> {
  print(metadata: TransformerResult<LitTranformer>): string {
    return `
      ${metadata.imports}

      class MyElement extends LitElement {
        static get styles() {
          return css\`
            ${metadata.styles}
          \`;
        }
        render() {
          return html\`${metadata.template}\`;
        }
      }

      customElements.define('my-element', MyElement);
    `;
  }
}
