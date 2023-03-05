import { printNode } from '@pryzm/ast-utils';
import { Printer, transform, TransformerOutput } from '@pryzm/compiler';
import { transformer } from './transformer';
import { propsName } from './utils/names';

export function print(source: string): string {
  const printer = new ReactPrinter();
  return printer.print(transform(source, transformer));
}

export class ReactPrinter implements Printer<typeof transformer> {
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

      export interface ${propsName(metadata.name)} {
        ${this.getInterfaceProperties(metadata)}
      }

      export default function ${metadata.name}({${this.getDesctructuredProperties(
      metadata
    )}}: ${propsName(metadata.name)}) {

        ${metadata.refs.map(ref => ref.statement).join('\n\n')}

        ${metadata.states.map(state => state.statement).join('\n\n')}

        ${metadata.computed.map(computed => computed.statement).join('\n\n')}

        ${metadata.methods.map(method => method.statement).join('\n\n')}

        ${metadata.onInit ?? ''}

        ${metadata.onDestroy ?? ''}

        return ${metadata.template};
      }
    `;
  }
}
