import { insertComment, printNode } from '@pryzm/ast-utils';
import { Printer, transform, TransformerOutput } from '@pryzm/compiler';
import { transformer } from './transformer';

export function print(source: string): string {
  const printer = new VuePrinter();
  return printer.print(transform(source, transformer));
}

export class VuePrinter implements Printer<typeof transformer> {
  private getEventEmitters(metadata: TransformerOutput<typeof transformer>): string {
    if (metadata.events.length === 0) {
      return '';
    }

    return `const emit = defineEmits<{
      ${metadata.events
        .map(
          event => `(e: '${event.name}', ${event.name}: ${printNode(event.type) ?? 'any'}): void;`
        )
        .join('\n')}
    }>()
    `;
  }

  private getStyle(metadata: TransformerOutput<typeof transformer>): string {
    if (metadata.styles.length === 0) {
      return '';
    }

    return `<style scoped>
      ${metadata.styles}
    </style>
    `;
  }

  print(metadata: TransformerOutput<typeof transformer>): string {
    return `
    <script setup lang="ts">
      ${metadata.imports.map(imp => printNode(imp)).join('\n')}

      interface Props {
        ${metadata.props
          .map(prop =>
            insertComment(`${prop.name}: ${prop.type ? prop.type : 'any'};`, prop.comment)
          )
          .join('\n')}
      }

      const {${metadata.props
        .map(prop => {
          return prop.initializer ? `${prop.name} = ${prop.initializer}` : prop.name;
        })
        .join(', ')}} = defineProps<Props>();

      ${metadata.refs.join('\n\n')}

      ${metadata.states.join('\n\n')}

      ${metadata.computed.join('\n\n')}

      ${this.getEventEmitters(metadata)}

      ${metadata.onInit ? metadata.onInit : ''}

      ${metadata.onDestroy ? metadata.onDestroy : ''}

      ${metadata.methods.join('\n')}

    </script>

    <template>
      ${metadata.template}
    </template>

    ${this.getStyle(metadata)}
    `;
  }
}
