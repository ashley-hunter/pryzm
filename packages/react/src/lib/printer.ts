import { printNode } from '@pryzm/ast-utils';
import { Printer, transform, TransformerResult } from '@pryzm/compiler';
import { ReactTransformer, transformer } from './transformer';
import { propsName } from './utils/names';

export function print(source: string): string {
  const printer = new ReactPrinter();
  return printer.print(transform(source, transformer));
}

export class ReactPrinter implements Printer<ReactTransformer> {
  private getInterfaceProperties(metadata: TransformerResult<ReactTransformer>): string {
    return [
      ...metadata.props.map(prop => prop.interfaceProperty),
      ...metadata.events.map(prop => prop.interfaceProperty),
      ...metadata.slots.map(slot => slot.interfaceProperty),
    ].join('\n');
  }

  private getDesctructuredProperties(metadata: TransformerResult<ReactTransformer>): string {
    return [
      ...metadata.props.map(prop => prop.destructuredProperty),
      ...metadata.events.map(prop => prop.destructuredProperty),
      ...metadata.slots.map(slot => slot.destructuredProperty),
    ].join(', ');
  }

  print(metadata: TransformerResult<ReactTransformer>): string {
    return `
      ${metadata.imports.map(printNode).join('\n')}

      export interface ${propsName(metadata.name)} {
        ${this.getInterfaceProperties(metadata)}
      }

      export default function ${metadata.name}({${this.getDesctructuredProperties(
      metadata
    )}}: ${propsName(metadata.name)}) {

        ${metadata.refs.map(ref => ref.statement).join('\n')}
        ${metadata.states.map(state => state.statement).join('\n')}
        ${metadata.computed.map(computed => computed.statement).join('\n')}
        ${metadata.methods.map(method => method.statement).join('\n')}

        return ${metadata.template};
      }
    `;
  }
}
