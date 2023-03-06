import { printNode, stripQuotes, stripThis } from '@pryzm/ast-utils';
import { createTemplateTransformer } from '@pryzm/compiler';
import * as ts from 'typescript';
import { toEventName } from './helpers';

export const templateTransformer = createTemplateTransformer({
  Slot(name) {
    return name === 'default' ? `<slot />` : `<slot name="${name}" />`;
  },
  Attribute({ name, value }) {
    return name === 'key' ? '' : `${name}={${printNode(stripThis(value))}}`;
  },
  Event({ name, value }) {
    return `${toEventName(name)}={${printNode(stripThis(value))}}`;
  },
  Ref({ ref }) {
    return `bind:this={${printNode(stripThis(ref))}}`;
  },
  Show({ when, children, fallback }) {
    return `
      {#if ${printNode(stripThis(when))}}
        ${children}
        ${fallback ? `{:else}\n${fallback}` : ``}
      {/if}`;
  },
  For({ each, itemName, indexName, children, key }) {
    return `
      {#each ${printNode(stripThis(each))} as ${itemName}${indexName ? `, ${indexName}` : ''}${
      key ? ` (${key})` : ''
    }}
        ${children}
      {/each}`;
  },
  ConditionalClasses({ classes }) {
    return Object.entries(classes)
      .map(([name, condition]) => {
        return `class:${stripQuotes(name)}={${printNode(stripThis(condition))}}`;
      })
      .join(' ');
  },
  ConditionalStyles({ styles }) {
    return `style="${Object.entries(styles)
      .map(([name, value]) => {
        // if the value is a string then we don't need to wrap it in curly braces
        return ts.isStringLiteral(value)
          ? `${name}: ${value.text};`
          : `${name}: {${printNode(stripThis(value))}};`;
      })
      .join(' ')}"`;
  },
  Expression: value => `{${printNode(stripThis(value.expression))}}`,
});
