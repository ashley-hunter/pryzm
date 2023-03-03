import { printNode } from '@pryzm/ast-utils';
import { TemplateTransformer } from '@pryzm/compiler';

export const templateTransformer: TemplateTransformer = {
  Element({ tagName, attributes, children }) {
    return `<${tagName} ${attributes}>${children}</${tagName}>`;
  },
  SelfClosingElement({ tagName, attributes }) {
    return `<${tagName} ${attributes} />`;
  },
  Slot(name) {
    return name === 'default' ? `<slot />` : `<slot name="${name}" />`;
  },
  Attribute({ name, value }) {
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
  Class(name) {
    return `class="${name}"`;
  },
  ConditionalClasses({ node }, context) {
    context.importHandler.addNamedImport('classMap', 'lit/directives/class-map.js');

    return `\${classMap(${printNode(node)})}`;
  },
  Expression: value => `\${${printNode(value.expression)}}`,
  Text: value => value.text,
};
