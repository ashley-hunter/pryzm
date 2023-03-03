import {
  getAttributeName,
  getAttributeValue,
  printNode,
  stripQuotes,
  stripThis,
} from '@pryzm/ast-utils';
import { TemplateTransformer } from '@pryzm/compiler';

export const templateTransformer: TemplateTransformer = {
  Element({ tagName, attributes, children }) {
    return `<${tagName} ${attributes.join(' ')}>${children.join('')}</${tagName}>`;
  },
  SelfClosingElement({ tagName, attributes }) {
    return `<${tagName} ${attributes.join(' ')} />`;
  },
  Slot(name) {
    if (name === 'default') {
      return `<slot />`;
    }
    return `<slot name="${name}" />`;
  },
  Fragment(value, children) {
    return children.join('');
  },
  Attribute(attribute) {
    const name = getAttributeName(attribute);
    const value = getAttributeValue(attribute);

    return `${name}={${printNode(stripThis(value))}}`;
  },
  Ref(attribute) {
    const value = getAttributeValue(attribute);
    return `bind:this={${printNode(stripThis(value))}}`;
  },
  Show({ when, children, fallback }) {
    if (fallback) {
      return `
      {#if ${printNode(stripThis(when))}}
        ${children.join('')}
      {:else}
        ${fallback}
      {/if}
      `;
    }

    return `
    {#if ${printNode(stripThis(when))}}
      ${children.join('')}
    {/if}
    `;
  },
  Class(name) {
    return `class="${name}"`;
  },
  ConditionalClasses({ classes }) {
    return Object.entries(classes)
      .map(([name, condition]) => {
        return `class:${stripQuotes(name)}={${printNode(stripThis(condition))}}`;
      })
      .join(' ');
  },
  Expression: value => `{${printNode(stripThis(value.expression))}}`,
  Text: value => value.text,
};
