import { printNode } from '@pryzm/ast-utils';
import { Printer, transform, TransformerOutput } from '@pryzm/compiler';
import * as parserHtml from 'prettier/parser-html';
import * as parserCss from 'prettier/parser-postcss';
import * as parserTypeScript from 'prettier/parser-typescript';
import { format } from 'prettier/standalone';
import { transformer } from './transformer';

export function print(source: string): string {
  const printer = new LitPrinter();
  return printer.format(printer.print(transform(source, transformer)));
}

export class LitPrinter implements Printer<typeof transformer> {
  format(value: string): string {
    return format(value, {
      plugins: [parserTypeScript, parserCss, parserHtml],
      parser: 'typescript',
    });
  }

  print(metadata: TransformerOutput<typeof transformer>): string {
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
