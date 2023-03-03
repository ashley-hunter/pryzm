import { getAttributeName, getAttributeValue, printNode, stripThis } from '@pryzm/ast-utils';
import { TemplateTransformer } from '@pryzm/compiler';
import * as ts from 'typescript';

export const templateTransformer: TemplateTransformer = {
  Element({ tagName, attributes, children }, context) {
    return `<${tagName} ${context.data.get('id') ?? ''} ${attributes.join(' ')}>${children.join(
      ''
    )}</${tagName}>`;
  },
  SelfClosingElement({ tagName, attributes }, context) {
    return `<${tagName} ${context.data.get('id') ?? ''} ${attributes.join(' ')} />`;
  },
  Slot: name => {
    return `{${name === 'default' ? 'children' : name}}`;
  },
  Fragment(_, children) {
    return `<>${children.join('')}</>`;
  },
  Attribute(value) {
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
  Show({ when, fallback, children }) {
    return fallback
      ? `{${printNode(stripThis(when))} ? <>${children.join('')}</> : ${fallback}}`
      : `{${printNode(stripThis(when))} && <>${children.join('')}</>}`;
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
