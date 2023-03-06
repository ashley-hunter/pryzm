import {
  convertMethodToFunction,
  getReturnExpression,
  insertComment,
  printNode,
  stripThis,
} from '@pryzm/ast-utils';
import { createTransformer, transformTemplate } from '@pryzm/compiler';
import { templateTransformer } from './template-transformer';

export const transformer = createTransformer({
  Computed({ name, node, comment }) {
    return insertComment(
      `$: ${name} = ${printNode(stripThis(getReturnExpression(node)))};`,
      comment
    );
  },
  Prop({ name, initializer, comment }) {
    return insertComment(
      initializer
        ? `export let ${name} = ${printNode(stripThis(initializer))};`
        : `export let ${name};`,
      comment
    );
  },
  State({ name, isReadonly, initializer, comment }) {
    initializer = stripThis(initializer);

    return insertComment(
      initializer
        ? `${isReadonly ? 'const' : 'let'} ${name} = ${printNode(initializer)};`
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
  Method({ node, comment }) {
    return insertComment(printNode(convertMethodToFunction(stripThis(node))), comment);
  },
  Template(value, _, context) {
    return transformTemplate(value, templateTransformer, context);
  },
  OnInit({ body, comment }, context) {
    context.importHandler.addNamedImport('onMount', 'svelte');

    return insertComment(`onMount(() => ${printNode(stripThis(body))});`, comment);
  },
  OnDestroy({ body, comment }, context) {
    context.importHandler.addNamedImport('onDestroy', 'svelte');

    return insertComment(`onDestroy(() => ${printNode(stripThis(body))});`, comment);
  },
});
