import { printNode, stripQuotes, stripThis } from '@pryzm/ast-utils';
import { TemplateTransformer } from '@pryzm/compiler';

export const templateTransformer: TemplateTransformer = {
  Slot(name) {
    if (name === 'default') {
      return `<slot />`;
    }
    return `<slot name="${name}" />`;
  },
  Attribute({ name, value }) {
    // if the attribute is named "key" then do no render it
    if (name === 'key') {
      return '';
    }

    return `${name}={${printNode(stripThis(value))}}`;
  },
  Ref({ ref }) {
    return `bind:this={${printNode(stripThis(ref))}}`;
  },
  Show({ when, children, fallback }) {
    return `
      {#if ${printNode(stripThis(when))}}
        ${children}
        ${fallback ? `{:else}\n${fallback}` : ``}
      {/if}
      `;
  },
  For({ each, itemName, indexName, children, key }) {
    return `
      {#each ${printNode(stripThis(each))} as ${itemName}${indexName ? `, ${indexName}` : ''}${
      key ? ` (${key})` : ''
    }}
        ${children}
      {/each}
      `;
  },
  ConditionalClasses({ classes }) {
    return Object.entries(classes)
      .map(([name, condition]) => {
        return `class:${stripQuotes(name)}={${printNode(stripThis(condition))}}`;
      })
      .join(' ');
  },
  Expression: value => `{${printNode(stripThis(value.expression))}}`,
};
