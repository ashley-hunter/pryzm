import { insertComment, printNode } from '@pryzm/ast-utils';
import { Printer, transform, TransformerOutput } from '@pryzm/compiler';
import * as parserHtml from 'prettier/parser-html';
import * as parserCss from 'prettier/parser-postcss';
import * as parserTypeScript from 'prettier/parser-typescript';
import { format } from 'prettier/standalone';
import { transformer } from './transformer';

export function print(source: string): string {
  const printer = new VuePrinter();
  return printer.format(printer.print(transform(source, transformer)));
}

export class VuePrinter implements Printer<typeof transformer> {
  format(value: string): string {
    return format(value, {
      plugins: [parserTypeScript, parserCss, parserHtml],
      parser: 'vue',
    });
  }

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

      ${
        metadata.props.some(prop => prop.initializer)
          ? `const props = withDefaults(defineProps<Props>(), {
          ${metadata.props
            .filter(prop => Boolean(prop.initializer))
            .map(prop => `${prop.name}: ${prop.initializer}`)
            .join(',\n')}
          })`
          : 'const props = defineProps<Props>();'
      }

      ${
        metadata.props.length > 0
          ? `const { ${metadata.props.map(prop => prop.name).join()}  } = toRefs(props);`
          : ''
      }

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
