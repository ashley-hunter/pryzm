import {
  convertMethodToFunction,
  getPropertyName,
  getReturnExpression,
  inferType,
  insertComment,
  printNode,
  stripThis,
} from '@pryzm/ast-utils';
import { createTransformer, transformTemplate } from '@pryzm/compiler';
import * as ts from 'typescript';
import { templateTransformer } from './template-transformer';

export const transformer = createTransformer({
  Computed({ name, node, comment }, context) {
    context.importHandler.addNamedImport('computed', 'vue');
    return insertComment(
      `const ${name} = computed(() => ${printNode(stripThis(getReturnExpression(node)))});`,
      comment
    );
  },
  Prop({ name, type, initializer, comment }, context) {
    context.importHandler.addNamedImport('toRefs', 'vue');

    return {
      name,
      type: printNode(type),
      initializer: printNode(initializer),
      comment,
    };
  },
  State({ name, type, initializer, comment }, context) {
    // if the type is a primitive, we use `ref` to create a reactive variable
    // otherwise, we use `reactive` to create a reactive object
    type ??= inferType(initializer!);

    const reactiveFn =
      type && (ts.isArrayTypeNode(type) || ts.isTypeLiteralNode(type)) ? 'reactive' : 'ref';

    context.importHandler.addNamedImport(reactiveFn, 'vue');

    return insertComment(
      `const ${name} = ${reactiveFn}(${printNode(stripThis(initializer)) ?? 'null'});`,
      comment
    );
  },
  Event(event) {
    // get the default value of the prop if it exists
    const initializer = event.initializer;

    // the event initializer will always be EventEmitter, but we need to get the type from the EventEmitter generic
    if (!initializer || !ts.isNewExpression(initializer)) {
      throw new Error('Event initializers must be an EventEmitter');
    }

    // get the type of the event
    const type = initializer.typeArguments?.[0];

    const name = getPropertyName(event);

    // if the name does not start with 'on', throw an error
    if (!name.startsWith('on')) {
      throw new Error(`Event names must start with 'on'`);
    }

    return { name, type };
  },
  Inject(value) {
    throw new Error('Method not implemented.');
  },
  Provider(value) {
    throw new Error('Method not implemented.');
  },
  Ref({ name, type, initializer, comment }, context) {
    context.importHandler.addNamedImport('ref', 'vue');
    return insertComment(
      `const ${name} = ref${type ? `<${printNode(type)}>` : ''}(${
        printNode(initializer) ?? 'null'
      });`,
      comment
    );
  },
  Method({ node, comment }) {
    // convert a method to a function declaration
    return insertComment(printNode(convertMethodToFunction(stripThis(node))), comment);
  },
  OnInit({ body, comment }, context) {
    context.importHandler.addNamedImport('onMounted', 'vue');

    return insertComment(`onMounted(() => ${printNode(stripThis(body))});`, comment);
  },
  OnDestroy({ body, comment }, context) {
    context.importHandler.addNamedImport('onUnmounted', 'vue');

    return insertComment(`onUnmounted(() => ${printNode(stripThis(body))});`, comment);
  },
  Template(value, styles, context) {
    return transformTemplate(value, templateTransformer, context);
  },
});
