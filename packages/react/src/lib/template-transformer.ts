import { printNode, stripThis } from '@pryzm/ast-utils';
import { TemplateTransformer } from '@pryzm/compiler';
import * as ts from 'typescript';

export const templateTransformer: TemplateTransformer = {
  Element({ tagName, attributes, children }, context) {
    return `<${tagName} ${context.data.get('id') ?? ''} ${attributes}>${children}</${tagName}>`;
  },
  SelfClosingElement({ tagName, attributes }, context) {
    return `<${tagName} ${context.data.get('id') ?? ''} ${attributes} />`;
  },
  Slot: name => {
    return `{${name === 'default' ? 'children' : name}}`;
  },
  Fragment(_, children) {
    return `<>${children}</>`;
  },
  Attribute({ name, value }) {
    // ensure the name is in camelCase
    name = name.replace(/-([a-z])/g, g => g[1].toUpperCase());

    // if the attribute value is a string literal, we can just print it - this remove unneeded braces
    if (value && ts.isStringLiteral(value)) {
      return `${name}="${value.text}"`;
    }

    return `${name}={${printNode(stripThis(value))}}`;
  },
  Show({ when, fallback, children }) {
    return fallback
      ? `{${printNode(stripThis(when))} ? <>${children}</> : ${fallback}}`
      : `{${printNode(stripThis(when))} && <>${children}</>}`;
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
