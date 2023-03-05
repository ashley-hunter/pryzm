import { printNode } from '@pryzm/ast-utils';
import { createTemplateTransformer } from '@pryzm/compiler';

export const templateTransformer = createTemplateTransformer({
  Slot(name) {
    return name === 'default' ? `<slot />` : `<slot name="${name}" />`;
  },
  Attribute({ name, value }) {
    // if the attribute is named "key" then do no render it
    if (name === 'key') {
      return '';
    }

    return `${name}={${printNode(value)}}`;
  },
  Ref({ ref }) {
    return `\${ref(${printNode(ref)})}`;
  },
  Show({ when, children, fallback }, context) {
    context.importHandler.addNamedImport('when', 'lit/directives/when.js');

    return fallback
      ? `\${when(${printNode(when)}, () => html\`${children}\`, () => html\`${fallback}\`)}`
      : `\${when(${printNode(when)}, () => html\`${children}\`)}`;
  },
  For({ each, itemName, indexName, children, key }, context) {
    context.importHandler.addNamedImport('repeat', 'lit/directives/repeat.js');

    const keyFn = key ? `, (${itemName}) => ${key}` : '';

    return `\${repeat(${printNode(each)} ${keyFn}, (${itemName}${
      indexName ? `, ${indexName}` : ''
    }) => html\`${children}\`)}`;
  },
  ConditionalClasses({ node }, context) {
    context.importHandler.addNamedImport('classMap', 'lit/directives/class-map.js');

    return `\${classMap(${printNode(node)})}`;
  },
  ConditionalStyles({ node }, context) {
    context.importHandler.addNamedImport('styleMap', 'lit/directives/style-map.js');

    return `\${styleMap(${printNode(node)})}`;
  },
  Expression: value => `\${${printNode(value.expression)}}`,
});
