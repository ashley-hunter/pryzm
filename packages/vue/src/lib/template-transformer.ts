import { getAttributeValue, printNode, sanitizeAttribute, stripThis } from '@pryzm/ast-utils';
import { TemplateTransformer } from '@pryzm/compiler';

export const templateTransformer: TemplateTransformer = {
  Element({ tagName, attributes, children }) {
    return `<${tagName} ${attributes}>${children}</${tagName}>`;
  },
  SelfClosingElement({ tagName, attributes }) {
    return `<${tagName} ${attributes} />`;
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
    // if the attribute name starts with `on` then it is an event and we need to convert it to `@`
    // the first letter may then be upper case which we need to convert to lower case
    // e.g `onClick` becomes `@click`
    if (name.startsWith('on')) {
      name = `@${name[2].toLowerCase()}${name.slice(3)}`;
    }

    return `${name}="${printNode(stripThis(value))}"`;
  },
  Ref(attribute) {
    const value = getAttributeValue(attribute);

    return `ref="${printNode(stripThis(value))}"`;
  },
  Show({ children, when, fallback }) {
    return `
    <template v-if="${sanitizeAttribute(printNode(stripThis(when)))}">
      ${children}
    </template>
    ${fallback ? `<template v-else>${fallback}</template>` : ''}
    `;
  },
  Class(name) {
    return `class="${name}"`;
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
  Expression: value => `{{${printNode(stripThis(value.expression))}}}`,
  Text: value => value.text,
};
