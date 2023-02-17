import { printNode } from '@pryzm/ast-utils';
import { Printer, transform, TransformerResult } from '@pryzm/compiler';
import { factory } from 'typescript';
import { transformer, VueTranformer } from './transformer';

export function print(source: string): string {
  const printer = new VuePrinter();
  return printer.print(transform(source, transformer));
}

export class VuePrinter implements Printer<VueTranformer> {
  private getDestructuredProps(metadata: TransformerResult<VueTranformer>): string {
    const props = factory.createObjectBindingPattern(
      metadata.props.map(prop =>
        factory.createBindingElement(
          undefined,
          undefined,
          factory.createIdentifier(prop.name),
          prop.initializer
        )
      )
    );

    return printNode(props);
  }

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
      interface Props {
        ${metadata.props
          .map(prop => `${prop.name}: ${prop.type ? printNode(prop.type) : 'any'};`)
          .join('\n')}
      }

      const ${this.getDestructuredProps(metadata)} = defineProps<Props>();

      ${metadata.states.map(state => printNode(state.statement)).join('\n')}

      ${metadata.computed.map(computed => printNode(computed.statement)).join('\n')}

      ${this.getEventEmitters(metadata)}

      ${metadata.methods.map(method => printNode(method.statement)).join('\n')}

    </script>

    <template>
      ${metadata.template}
    </template>

    ${this.getStyle(metadata)}
    `;
  }
}
