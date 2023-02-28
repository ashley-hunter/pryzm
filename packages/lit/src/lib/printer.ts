import { printNode } from '@pryzm/ast-utils';
import { Printer, transform, TransformerResult } from '@pryzm/compiler';
import { LitTranformer, transformer } from './transformer';

export function print(source: string): string {
  const printer = new LitPrinter();
  return printer.print(transform(source, transformer));
}

export class LitPrinter implements Printer<LitTranformer> {
  private selector(name: string): string {
    return name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  print(metadata: TransformerResult<LitTranformer>): string {
    return `
    ${metadata.imports.map(printNode).join('\r\n')}

      @customElement('${this.selector(metadata.name)}')
      class ${metadata.name} extends LitElement {

        ${metadata.refs.map(printNode).join('\r\n')}

        ${metadata.props.map(printNode).join('\r\n')}

        ${metadata.states.map(printNode).join('\r\n')}

        ${metadata.computed.map(printNode).join('\r\n')}

        ${metadata.styles ? 'static get styles() { return css`' + metadata.styles + '`; }' : ''}

        ${metadata.methods.map(printNode).join('\r\n')}

        render() {
          return html\`${metadata.template}\`;
        }
      }

      customElements.define('${this.selector(metadata.name)}', ${metadata.name});
    `;
  }
}
