import { printNode } from '@pryzm/ast-utils';
import { Printer, transform, TransformerOutput } from '@pryzm/compiler';
import { LitTranformer, transformer } from './transformer';

export function print(source: string): string {
  const printer = new LitPrinter();
  return printer.print(transform(source, transformer));
}

export class LitPrinter implements Printer<LitTranformer> {
  private selector(name: string): string {
    return name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  print(metadata: TransformerOutput<LitTranformer>): string {
    return `
    ${metadata.imports.map(printNode).join('\r\n')}

      @customElement('${metadata.selector}')
      class ${metadata.name} extends LitElement {

        ${metadata.refs.join('\n\n')}

        ${metadata.props.join('\n\n')}

        ${metadata.states.join('\n\n')}

        ${metadata.computed.join('\n\n')}

        ${metadata.styles ? 'static get styles() { return css`' + metadata.styles + '`; }' : ''}

        ${metadata.onInit ? metadata.onInit : ''}

        ${metadata.onDestroy ? metadata.onDestroy : ''}

        ${metadata.methods.join('\n\n')}

        render() {
          return html\`${metadata.template}\`;
        }
      }
    `;
  }
}
