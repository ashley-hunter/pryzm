import {
  getAttribute,
  getAttributeName,
  getAttributeValue,
  getTagName,
  printNode,
  sanitizeAttribute,
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
      return `<slot></slot>`;
    }
    return `<slot name="${name}"></slot>`;
  },
  Fragment: (value, children) => {
    return children.join('\n');
  },
  Attribute: attribute => {
    let name = getAttributeName(attribute);
    const value = getAttributeValue(attribute);

    // if the attribute name starts with `on` then it is an event and we need to convert it to `@`
    // the first letter may then be upper case which we need to convert to lower case
    // e.g `onClick` becomes `@click`
    if (name.startsWith('on')) {
      name = `@${name[2].toLowerCase()}${name.slice(3)}`;
    }

    return `${name}="${printNode(stripThis(value)!)}"`;
  },
  Ref(attribute) {
    const value = getAttributeValue(attribute);

    return `ref="${printNode(stripThis(value)!)}"`;
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
    <template v-if="${sanitizeAttribute(printNode(stripThis(when)!))}">
      ${children.join('')}
    </template>
    `;
  },
  Expression: value => `{{${printNode(stripThis(value.expression)!)}}}`,
  Text: value => value.text,
};
