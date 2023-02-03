import { printNode } from '@pryzm/ast-utils';
import { Printer, transform, TransformerResult } from '@pryzm/compiler';
import { SvelteTranformer, transformer } from './transformer';

export function print(source: string): string {
  const printer = new ReactPrinter();
  return printer.print(transform(source, transformer));
}

export class ReactPrinter implements Printer<SvelteTranformer> {
  print(metadata: TransformerResult<SvelteTranformer>): string {
    return `
      ${metadata.imports}

      <script lang="ts">
        ${metadata.props.map((prop) => printNode(prop.statement)).join('\n')}
        ${metadata.states.map((state) => printNode(state.statement)).join('\n')}
        ${metadata.computed
          .map((computed) => printNode(computed.statement))
          .join('\n')}
      </script>

      ${metadata.template}
    `;
  }
}
