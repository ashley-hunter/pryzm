import {
  getAttribute,
  getAttributeName,
  getAttributeValue,
  getChildOrFragment,
  getTagName,
  printNode,
  stripThis,
} from '@pryzm/ast-utils';
import { TemplateTransformer } from '@pryzm/compiler';
import * as ts from 'typescript';

export const templateTransformer: TemplateTransformer = {
  Element: (value, attributes, children, context) => {
    const id = context.data.get('id') ?? '';

    const tagName = getTagName(value);

    return `<${tagName} ${id} ${attributes.join(' ')}>${children.join('\n')}</${tagName}>`;
  },
  SelfClosingElement: (value, attributes, context) => {
    const id = context.data.get('id') ?? '';

    const tagName = getTagName(value);

    return `<${tagName} ${id} ${attributes.join(' ')} />`;
  },
  Slot: name => {
    return `{${name === 'default' ? 'children' : name}}`;
  },
  Fragment: (_, children) => {
    return `<>${children.join('\n')}</>`;
  },
  Attribute: value => {
    let attributeName = getAttributeName(value);
    const attributeValue = getAttributeValue(value);

    // ensure the name is in camelCase
    attributeName = attributeName.replace(/-([a-z])/g, g => g[1].toUpperCase());

    // if the attribute value is a string literal, we can just print it
    if (attributeValue && ts.isStringLiteral(attributeValue)) {
      return `${attributeName}="${attributeValue.text}"`;
    }

    return `${attributeName}={${printNode(stripThis(attributeValue))}}`;
  },
  Show: node => {
    const condition = getAttribute(node.openingElement.attributes, 'when');

    if (!condition) {
      throw new Error('Missing "when" attribute on <Show> element');
    }

    const when = getAttributeValue(condition);

    // check that the condition is an expression
    if (!when) {
      throw new Error('The "when" attribute on <Show> element must be an expression');
    }

    const child = getChildOrFragment(node);

    return `{ ${printNode(stripThis(when))} && ${printNode(child)} }`;
  },
  Class(name) {
    return `className="${name}"`;
  },
  ConditionalClasses({ classes }, context) {
    // if classes is empty, we can just return an empty string
    if (Object.keys(classes).length === 0) {
      return '';
    }

    context.importHandler.addDefaultImport('clsx', 'clsx');

    const properties = Object.entries(classes).map(([name, condition]) => {
      return `${name}: ${printNode(stripThis(condition))}`;
    });

    return `className={clsx({${properties.join(', ')}})}`;
  },
  Expression: value => printNode(stripThis(value)),
  Text: value => value.text,
};
