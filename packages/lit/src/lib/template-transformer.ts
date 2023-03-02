import {
  getAttribute,
  getAttributeName,
  getAttributeValue,
  getTagName,
  printNode,
} from '@pryzm/ast-utils';
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
    return children.join('\n');
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
  Show(node, children, context) {
    context.importHandler.addNamedImport('when', 'lit/directives/when.js');

    const condition = getAttribute(node.openingElement.attributes, 'when');

    if (!condition) {
      throw new Error('Missing "when" attribute on <Show> element');
    }

    const when = getAttributeValue(condition);

    // check that the condition is an expression
    if (!when) {
      throw new Error('Missing expression in "when" attribute on <Show> element');
    }

    return `\${when(${printNode(when)}, () => html\`${children.join('\n').trim()}\`)}`;
  },
  Class(name, context) {
    return `class="${name}"`;
  },
  ConditionalClasses({ node }, context) {
    context.importHandler.addNamedImport('classMap', 'lit/directives/class-map.js');

    return `\${classMap(${printNode(node)})}`;
  },
  Expression: value => `\${${printNode(value.expression)}}`,
  Text: value => value.text,
};
