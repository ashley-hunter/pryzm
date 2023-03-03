import { getPropertyName, getReturnExpression, printNode, stripThis } from '@pryzm/ast-utils';
import { StringTransformer, transformTemplate } from '@pryzm/compiler';
import { templateTransformer } from './template-transformer';

export type SvelteTranformer = StringTransformer;

export const transformer: SvelteTranformer = {
  Computed(computed) {
    // computed is a get accessor declaration, we need to convert it to a variable statement that is exported
    const name = getPropertyName(computed);
    const initializer = getReturnExpression(computed);

    return `$: ${name} = ${printNode(stripThis(initializer))};`;
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
  Ref(value) {
    return `let ${getPropertyName(value)};`;
  },
  Method({ name, parameters, body }) {
    return `function ${name}(${parameters.map(printNode).join(', ')}) ${printNode(
      stripThis(body)
    )}`;
  },
  Template(value, styles, context) {
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
  Slots(slot) {
    return slot;
  },
};
