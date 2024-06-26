import { printNode } from '@pryzm/ast-utils';
import { Printer, transform, TransformerOutput } from '@pryzm/compiler';
import * as parserCss from 'prettier/parser-postcss';
import * as parserTypeScript from 'prettier/parser-typescript';
import { format } from 'prettier/standalone';
import { propsName } from './helpers/names';
import { transformer } from './transformer';

export function print(source: string): string {
  const printer = new ReactPrinter();
  return printer.format(printer.print(transform(source, transformer)));
}

export class ReactPrinter implements Printer<typeof transformer> {
  format(value: string): string {
    return format(value, {
      plugins: [parserTypeScript, parserCss],
      parser: 'typescript',
    });
  }

  private getInterfaceProperties(metadata: TransformerOutput<typeof transformer>): string {
    return [
      ...metadata.props.map(prop => prop.interfaceProperty),
      ...metadata.events.map(prop => prop.interfaceProperty),
      ...metadata.slots.map(slot => slot.interfaceProperty),
    ].join('\n');
  }

  private getDesctructuredProperties(metadata: TransformerOutput<typeof transformer>): string {
    return [
      ...metadata.props.map(prop => prop.destructuredProperty),
      ...metadata.events.map(prop => prop.destructuredProperty),
      ...metadata.slots.map(slot => slot.destructuredProperty),
    ].join(', ');
  }

  print(metadata: TransformerOutput<typeof transformer>): string {
    return `
      ${metadata.imports.map(printNode).join('\n')}

      ${metadata.leadingNodes.map(printNode).join('\n')}

      ${metadata.providers.map(provider => provider.context).join('\n\n')}

      export interface ${propsName(metadata.name)} {
        ${this.getInterfaceProperties(metadata)}
      }

      export default function ${metadata.name}({${this.getDesctructuredProperties(
      metadata
    )}}: ${propsName(metadata.name)}) {

        ${metadata.refs.map(ref => ref.statement).join('\n\n')}

        ${metadata.states.map(state => state.statement).join('\n\n')}

        ${metadata.computed.map(computed => computed.statement).join('\n\n')}

        ${metadata.injects.join('\n\n')}

        ${metadata.methods.map(method => method.statement).join('\n\n')}

        ${metadata.onInit ?? ''}

        ${metadata.onDestroy ?? ''}

        return ${metadata.template};
      }

      ${metadata.trailingNodes.map(printNode).join('\n')}
    `;
  }
}
