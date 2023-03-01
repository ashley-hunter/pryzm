import {
  getAttribute,
  getAttributeName,
  getAttributeValue,
  getTagName,
  printNode,
  stripThis,
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
      return `<slot />`;
    }
    return `<slot name="${name}" />`;
  },
  Fragment: (value, children) => {
    return children.join('\n');
  },
  Attribute: attribute => {
    const name = getAttributeName(attribute);
    const value = getAttributeValue(attribute);

    return `${name}={${printNode(stripThis(value)!)}}`;
  },
  Ref(attribute) {
    const value = getAttributeValue(attribute);
    return `bind:this={${printNode(stripThis(value)!)}}`;
  },
  Show(node, children) {
    const condition = getAttribute(node.openingElement.attributes, 'when');

    if (!condition) {
      throw new Error('Missing "when" attribute on <Show> element');
    }

    const when = getAttributeValue(condition);

    // check that the condition is an expression
    if (!when) {
      throw new Error('The "when" attribute on <Show> element must be an expression');
    }

    return `
    {#if ${printNode(stripThis(when)!)}}
      ${children.join('')}
    {/if}
    `;
  },
  Expression: value => `{${printNode(stripThis(value.expression)!)}}`,
  Text: value => value.text,
};
