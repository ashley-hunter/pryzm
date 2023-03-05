import {
  convertMethodToFunction,
  getPropertyName,
  getReturnExpression,
  printNode,
  stripThis,
} from '@pryzm/ast-utils';
import { StringTransformer, transformTemplate } from '@pryzm/compiler';
import { templateTransformer } from './template-transformer';

export type SvelteTranformer = StringTransformer;

export const transformer: SvelteTranformer = {
  Computed({ name, node }) {
    return `$: ${name} = ${printNode(stripThis(getReturnExpression(node)))};`;
  },
  Prop({ name, initializer }) {
    return initializer
      ? `export let ${name} = ${printNode(stripThis(initializer))};`
      : `export let ${name};`;
  },
  State({ name, isReadonly, initializer }) {
    initializer = stripThis(initializer);

    return initializer
      ? `${isReadonly ? 'const' : 'let'} ${name} = ${printNode(initializer)};`
      : `${isReadonly ? 'const' : 'let'} ${name};`;
  },
  Event(event, context) {
    context.importHandler.addNamedImport('createEventDispatcher', 'svelte');

    return getPropertyName(event);
  },
  Inject(value) {
    throw new Error('Method not implemented.');
  },
  Provider(value) {
    throw new Error('Method not implemented.');
  },
  Ref({ name }) {
    return `let ${name};`;
  },
  Method({ node }) {
    return printNode(convertMethodToFunction(stripThis(node)));
  },
  Template(value, _, context) {
    return transformTemplate(value, templateTransformer, context);
  },
  OnInit({ body }, context) {
    context.importHandler.addNamedImport('onMount', 'svelte');

    return `onMount(() => ${printNode(stripThis(body))});`;
  },
  OnDestroy({ body }, context) {
    context.importHandler.addNamedImport('onDestroy', 'svelte');

    return `onDestroy(() => ${printNode(stripThis(body))});`;
  },
};
