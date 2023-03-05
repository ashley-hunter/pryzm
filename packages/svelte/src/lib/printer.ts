import { printNode } from '@pryzm/ast-utils';
import { Printer, transform, TransformerOutput } from '@pryzm/compiler';
import { transformer } from './transformer';

export function print(source: string): string {
  const printer = new SveltePrinter();
  return printer.print(transform(source, transformer));
}

export class SveltePrinter implements Printer<typeof transformer> {
  private getStyle(metadata: TransformerOutput<typeof transformer>): string {
    if (metadata.styles.length === 0) {
      return '';
    }

    return `<style>
      ${metadata.styles}
    </style>
    `;
  }

  print(metadata: TransformerOutput<typeof transformer>): string {
    return `
    <script lang="ts">
        ${metadata.imports.map(printNode).join('\n')}

        ${metadata.refs.join('\n')}

        ${metadata.props.join('\n')}

        ${metadata.states.join('\n')}

        ${metadata.computed.join('\n')}

        ${metadata.onInit ?? ''}

        ${metadata.onDestroy ?? ''}

        ${metadata.methods.join('\n\n')}

        ${metadata.events.length > 0 ? 'const dispatch = createEventDispatcher();' : ''}
      </script>

      ${metadata.template}

      ${this.getStyle(metadata)}
    `;
  }
}
