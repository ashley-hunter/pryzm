import {
  convertMethodToFunction,
  getReturnExpression,
  insertComment,
  printNode,
} from '@pryzm/ast-utils';
import { createTransformer, transformTemplate } from '@pryzm/compiler';
import { factory } from 'typescript';
import { isReactive, processNode, processNodeToString, toEventName } from './helpers';
import { templateTransformer } from './template-transformer';

export const transformer = createTransformer({
  Computed({ name, node, comment }, context) {
    context.importHandler.addNamedImport('computed', 'vue');
    return insertComment(
      `const ${name} = computed(() => ${processNodeToString(getReturnExpression(node), context)});`,
      comment
    );
  },
  Prop({ name, type, initializer, comment }, context) {
    context.importHandler.addNamedImport('toRefs', 'vue');

    return {
      name,
      type: printNode(type),
      initializer: processNodeToString(initializer, context),
      comment,
    };
  },
  State({ name, type, initializer, comment }, context) {
    // if the type is a primitive, we use `ref` to create a reactive variable
    // otherwise, we use `reactive` to create a reactive object
    const reactiveFn = isReactive(type, initializer) ? 'reactive' : 'ref';

    context.importHandler.addNamedImport(reactiveFn, 'vue');

    return insertComment(
      `const ${name} = ${reactiveFn}(${processNodeToString(initializer, context) ?? 'null'});`,
      comment
    );
  },
  Event({ name, initializer }) {
    // get the type of the event
    const type = initializer.typeArguments?.[0];

    return { name: toEventName(name), type };
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
        processNodeToString(initializer, context) ?? 'null'
      });`,
      comment
    );
  },
  Method({ node, comment }, context) {
    // convert a method to a function declaration
    return insertComment(printNode(convertMethodToFunction(processNode(node, context))), comment);
  },
  EventEmit({ name, value }) {
    name = toEventName(name);

    return factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createIdentifier('emit'),
        undefined,
        value ? [factory.createStringLiteral(name), value] : [factory.createStringLiteral(name)]
      )
    );
  },
  OnInit({ body, comment }, context) {
    context.importHandler.addNamedImport('onMounted', 'vue');

    return insertComment(`onMounted(() => ${processNodeToString(body, context)});`, comment);
  },
  OnDestroy({ body, comment }, context) {
    context.importHandler.addNamedImport('onUnmounted', 'vue');

    return insertComment(`onUnmounted(() => ${processNodeToString(body, context)});`, comment);
  },
  Template(value, styles, context) {
    return transformTemplate(value, templateTransformer, context);
  },
});
