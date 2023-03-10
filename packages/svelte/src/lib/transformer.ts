import {
  convertMethodToFunction,
  getReturnExpression,
  insertComment,
  printNode,
} from '@pryzm/ast-utils';
import { createTransformer, transformTemplate } from '@pryzm/compiler';
import { factory } from 'typescript';
import { processNodeToString, toEventName } from './helpers';
import { templateTransformer } from './template-transformer';

export const transformer = createTransformer({
  Computed({ name, node, comment }, context) {
    return insertComment(
      `$: ${name} = ${processNodeToString(getReturnExpression(node), context)};`,
      comment
    );
  },
  Prop({ name, initializer, comment, type }, context) {
    return insertComment(
      initializer
        ? `export let ${name}${type ? `: ${printNode(type)}` : ''} = ${processNodeToString(
            initializer,
            context
          )};`
        : `export let ${name}${type ? `: ${printNode(type)}` : ''};`,
      comment
    );
  },
  State({ name, isReadonly, initializer, comment, type }, context) {
    return insertComment(
      initializer
        ? `${isReadonly ? 'const' : 'let'} ${name}${
            type ? `: ${printNode(type)}` : ''
          } = ${processNodeToString(initializer, context)};`
        : `${isReadonly ? 'const' : 'let'} ${name}${type ? `: ${printNode(type)}` : ''};`,
      comment
    );
  },
  Event({ name }, context) {
    context.importHandler.addNamedImport('createEventDispatcher', 'svelte');

    return name;
  },
  EventEmit({ name, value }) {
    return factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createIdentifier('dispatch'),
        undefined,
        value
          ? [factory.createStringLiteral(toEventName(name)), value]
          : [factory.createStringLiteral(toEventName(name))]
      )
    );
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
