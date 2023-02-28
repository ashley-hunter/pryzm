import { printNode } from '@pryzm/ast-utils';
import { Printer, transform, TransformerResult } from '@pryzm/compiler';
import { SvelteTranformer, transformer } from './transformer';

export function print(source: string): string {
  const printer = new SveltePrinter();
  return printer.print(transform(source, transformer));
}

export class SveltePrinter implements Printer<SvelteTranformer> {
  private getStyle(metadata: TransformerResult<SvelteTranformer>): string {
    if (metadata.styles.length === 0) {
      return '';
    }

    return `<style>
      ${metadata.styles}
    </style>
    `;
  }

  print(metadata: TransformerResult<SvelteTranformer>): string {
    return `
    <script lang="ts">
        ${metadata.imports.map(printNode).join('\n')}

        ${metadata.props.map(prop => printNode(prop.statement)).join('\n')}
        ${metadata.states.map(state => printNode(state.statement)).join('\n')}
        ${metadata.computed.map(computed => printNode(computed.statement)).join('\n')}

        ${metadata.events.length > 0 ? 'const dispatch = createEventDispatcher();' : ''}
      </script>

      ${metadata.template}

      ${this.getStyle(metadata)}
    `;
  }
}
