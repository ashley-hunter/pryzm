import {
  convertMethodToFunction,
  getReturnExpression,
  insertComment,
  stripThis,
} from '@pryzm/ast-utils';
import { createTransformer, transformTemplate } from '@pryzm/compiler';
import { processNodeToString } from './helpers';
import { templateTransformer } from './template-transformer';

export const transformer = createTransformer({
  Computed({ name, node, comment }, context) {
    return insertComment(
      `$: ${name} = ${processNodeToString(getReturnExpression(node), context)};`,
      comment
    );
  },
  Prop({ name, initializer, comment }, context) {
    return insertComment(
      initializer
        ? `export let ${name} = ${processNodeToString(initializer, context)};`
        : `export let ${name};`,
      comment
    );
  },
  State({ name, isReadonly, initializer, comment }, context) {
    initializer = stripThis(initializer);

    return insertComment(
      initializer
        ? `${isReadonly ? 'const' : 'let'} ${name} = ${processNodeToString(initializer, context)};`
        : `${isReadonly ? 'const' : 'let'} ${name};`,
      comment
    );
  },
  Event({ name }, context) {
    context.importHandler.addNamedImport('createEventDispatcher', 'svelte');

    return name;
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
  Method({ node, comment }, context) {
    return insertComment(processNodeToString(convertMethodToFunction(node), context), comment);
  },
  Template(value, _, context) {
    return transformTemplate(value, templateTransformer, context);
  },
  OnInit({ body, comment }, context) {
    context.importHandler.addNamedImport('onMount', 'svelte');

    return insertComment(`onMount(() => ${processNodeToString(body, context)});`, comment);
  },
  OnDestroy({ body, comment }, context) {
    context.importHandler.addNamedImport('onDestroy', 'svelte');

    return insertComment(`onDestroy(() => ${processNodeToString(body, context)});`, comment);
  },
});
