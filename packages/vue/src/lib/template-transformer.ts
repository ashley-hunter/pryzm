import { printNode, sanitizeAttribute, stripQuotes, stripThis } from '@pryzm/ast-utils';
import { createTemplateTransformer } from '@pryzm/compiler';
import { toEventName } from './helpers';

export const templateTransformer = createTemplateTransformer({
  Slot(name) {
    return name === 'default' ? `<slot></slot>` : `<slot name="${name}"></slot>`;
  },
  Attribute({ name, value }) {
    // if the attribute is named "key" then do not render it
    if (name === 'key') {
      return '';
    }

    // if the attribute name starts with `on` then it is an event and we need to convert it to `@`
    // the first letter may then be upper case which we need to convert to lower case
    // e.g `onClick` becomes `@click`
    if (name.startsWith('on')) {
      name = `@${name[2].toLowerCase()}${name.slice(3)}`;
    }

    return `${name}="${stripQuotes(printNode(stripThis(value))!)}"`;
  },
  Event({ name, value }) {
    return `${toEventName(name)}="${stripQuotes(printNode(stripThis(value))!)}"`;
  },
  Ref({ ref }) {
    return `ref="${printNode(stripThis(ref))}"`;
  },
  Show({ children, when, fallback }) {
    return `
    <template v-if="${sanitizeAttribute(printNode(stripThis(when)))}">
      ${children}
    </template>
    ${fallback ? `<template v-else>${fallback}</template>` : ''}
    `;
  },
  For({ each, itemName, indexName, children, key }) {
    return `
    <template v-for="(${itemName}${indexName ? `, ${indexName}` : ''}) in ${sanitizeAttribute(
      printNode(stripThis(each))
    )}" ${key ? `:key="${key}"` : ''}>
      ${children}
    </template>
    `;
  },
  ConditionalClasses({ classes }) {
    const properties = Object.entries(classes)
      .map(([name, value]) => {
        const condition: string = printNode(stripThis(value));
        return `${sanitizeAttribute(name)}: ${sanitizeAttribute(condition)}`;
      })
      .join(', ');

    return `:class="{${properties}}"`;
  },
  ConditionalStyles({ styles }) {
    const properties = Object.entries(styles)
      .map(([name, value]) => {
        const condition: string = printNode(stripThis(value));
        return `${sanitizeAttribute(name)}: ${sanitizeAttribute(condition)}`;
      })
      .join(', ');

    return `:style="{${properties}}"`;
  },
  Expression: value => `{{${printNode(stripThis(value.expression))}}}`,
});
