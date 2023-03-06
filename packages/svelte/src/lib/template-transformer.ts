import { stripQuotes } from '@pryzm/ast-utils';
import { createTemplateTransformer } from '@pryzm/compiler';
import * as ts from 'typescript';
import { processNodeToString, toEventName } from './helpers';

export const templateTransformer = createTemplateTransformer({
  Slot(name) {
    return name === 'default' ? `<slot />` : `<slot name="${name}" />`;
  },
  Attribute({ name, value }, context) {
    return name === 'key' ? '' : `${name}={${processNodeToString(value, context)}}`;
  },
  Event({ name, value }, context) {
    return `on:${toEventName(name)}={${processNodeToString(value, context)}}`;
  },
  Ref({ ref }, context) {
    return `bind:this={${processNodeToString(ref, context)}}`;
  },
  Show({ when, children, fallback }, context) {
    return `
      {#if ${processNodeToString(when, context)}}
        ${children}
        ${fallback ? `{:else}\n${fallback}` : ``}
      {/if}`;
  },
  For({ each, itemName, indexName, children, key }, context) {
    return `
      {#each ${processNodeToString(each, context)} as ${itemName}${
      indexName ? `, ${indexName}` : ''
    }${key ? ` (${key})` : ''}}
        ${children}
      {/each}`;
  },
  ConditionalClasses({ classes }, context) {
    return Object.entries(classes)
      .map(([name, condition]) => {
        return `class:${stripQuotes(name)}={${processNodeToString(condition, context)}}`;
      })
      .join(' ');
  },
  ConditionalStyles({ styles }, context) {
    return `style="${Object.entries(styles)
      .map(([name, value]) => {
        // if the value is a string then we don't need to wrap it in curly braces
        return ts.isStringLiteral(value)
          ? `${name}: ${value.text};`
          : `${name}: {${processNodeToString(value, context)}};`;
      })
      .join(' ')}"`;
  },
  Expression: (value, context) => `{${processNodeToString(value.expression, context)}}`,
});
