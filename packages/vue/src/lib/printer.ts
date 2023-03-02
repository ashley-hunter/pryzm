import { printNode } from '@pryzm/ast-utils';
import { Printer, transform, TransformerResult } from '@pryzm/compiler';
import { transformer, VueTranformer } from './transformer';

export function print(source: string): string {
  const printer = new VuePrinter();
  return printer.print(transform(source, transformer));
}

export class VuePrinter implements Printer<VueTranformer> {
  private getEventEmitters(metadata: TransformerResult<VueTranformer>): string {
    if (metadata.events.length === 0) {
      return '';
    }

    return `const emit = defineEmits<{
      ${metadata.events
        .map(
          event =>
            `(e: '${event.name}', ${event.name}: ${
              event.type ? printNode(event.type) : 'any'
            }): void;`
        )
        .join('\n')}
    }>()
    `;
  }

  private getStyle(metadata: TransformerResult<VueTranformer>): string {
    if (metadata.styles.length === 0) {
      return '';
    }

    return `<style scoped>
      ${metadata.styles}
    </style>
    `;
  }

  print(metadata: TransformerResult<VueTranformer>): string {
    return `
    <script setup lang="ts">
      ${metadata.imports.map(imp => printNode(imp)).join('\n')}

      interface Props {
        ${metadata.props.map(prop => `${prop.name}: ${prop.type ? prop.type : 'any'};`).join('\n')}
      }

      const {${metadata.props.map(prop => prop.name).join(', ')}} = defineProps<Props>();

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
