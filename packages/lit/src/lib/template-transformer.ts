import { getAttributeName, getAttributeValue, getTagName, printNode } from '@pryzm/ast-utils';
import { TemplateTransformer } from '@pryzm/compiler';

export const templateTransformer: TemplateTransformer = {
  Element: (value, attributes, children) => {
    const tagName = getTagName(value);

    return `<${tagName} ${attributes.join(' ')}>${children.join('\n')}</${tagName}>`;
  },
  SelfClosingElement: (value, attributes) => {
    const tagName = getTagName(value);

    return `<${tagName} ${attributes.join(' ')} />`;
  },
  Slot(name) {
    if (name === 'default') {
      return `<slot></slot>`;
    }
    return `<slot name="${name}"></slot>`;
  },
  Fragment: (value, children) => {
    return children.join('');
  },
  Attribute: attribute => {
    const name = getAttributeName(attribute);
    const value = getAttributeValue(attribute);

    return `${name}={${printNode(value)}}`;
  },
  Ref(attribute) {
    const value = getAttributeValue(attribute);
    return `\${ref(${printNode(value)})}`;
  },
  Show({ when, children, fallback }, context) {
    context.importHandler.addNamedImport('when', 'lit/directives/when.js');

    return fallback
      ? `\${when(${printNode(when)}, () => html\`${children
          .join('')
          .trim()}\`, () => html\`${fallback}\`)}`
      : `\${when(${printNode(when)}, () => html\`${children.join('').trim()}\`)}`;
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
