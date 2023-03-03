import { getAttributeValue, printNode } from '@pryzm/ast-utils';
import { TemplateTransformer } from '@pryzm/compiler';

export const templateTransformer: TemplateTransformer = {
  Element({ tagName, attributes, children }) {
    return `<${tagName} ${attributes.join(' ')}>${children}</${tagName}>`;
  },
  SelfClosingElement({ tagName, attributes }) {
    return `<${tagName} ${attributes.join(' ')} />`;
  },
  Slot(name) {
    if (name === 'default') {
      return `<slot></slot>`;
    }
    return `<slot name="${name}"></slot>`;
  },
  Fragment(value, children) {
    return children;
  },
  Attribute({ name, value }) {
    return `${name}={${printNode(value)}}`;
  },
  Ref(attribute) {
    const value = getAttributeValue(attribute);
    return `\${ref(${printNode(value)})}`;
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
