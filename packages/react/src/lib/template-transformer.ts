import { printNode, stripThis } from '@pryzm/ast-utils';
import { createTemplateTransformer } from '@pryzm/compiler';
import * as ts from 'typescript';
import type { ProviderOutput } from './transformer';

export const templateTransformer = createTemplateTransformer({
  Root({ children }, context) {
    // get the providers and wrap the children in them
    const providers = context.transformedMetadata!.providers as ProviderOutput[];

    if (providers.length) {
      children = providers.reduceRight<string>((children, { provider }) => {
        return `<${provider.name} value={${provider.value}}>${children}</${provider.name}>`;
      }, children);
    }

    return children;
  },
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
  Event({ name, value }) {
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
  Ref({ ref }) {
    return `ref={${printNode(stripThis(ref))}}`;
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
  ConditionalStyles({ styles, node }) {
    return Object.keys(styles).length === 0 ? '' : `style={${printNode(stripThis(node))}}`;
  },
  For({ each, itemName, indexName, children }) {
    return `{${printNode(stripThis(each))}.map((${itemName}${
      indexName ? `, ${indexName}` : ''
    }) => ${children})}`;
  },
  Expression: value => printNode(stripThis(value)),
  Text: value => value.text,
});
