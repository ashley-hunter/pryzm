import {
  convertMethodToFunction,
  getPropertyName,
  getPropertyType,
  getReturnExpression,
  inferType,
  printNode,
  stripThis,
} from '@pryzm/ast-utils';
import { Transformer, transformTemplate } from '@pryzm/compiler';
import * as ts from 'typescript';
import { templateTransformer } from './template-transformer';

type VueProp = {
  name: string;
  type: string | undefined;
  initializer: string | undefined;
};

type VueEvent = {
  name: string;
  type: ts.TypeNode | undefined;
};

export type VueTranformer = Transformer<
  VueProp,
  string,
  string,
  VueEvent,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string
>;

export const transformer: VueTranformer = {
  Computed(computed, context) {
    context.importHandler.addNamedImport('computed', 'vue');
    // computed is a get accessor declaration, we need to convert it to a variable statement that is exported
    const name = getPropertyName(computed);
    const initializer = getReturnExpression(computed);

    return `const ${name} = computed(() => ${printNode(stripThis(initializer))});`;
  },
  Prop({ name, type, initializer }) {
    return {
      name,
      type: printNode(type),
      initializer: printNode(initializer),
    };
  },
  State({ name, type, initializer }, context) {
    // if the type is a primitive, we use `ref` to create a reactive variable
    // otherwise, we use `reactive` to create a reactive object
    type ??= inferType(initializer!);

    const reactiveFn =
      type && (ts.isArrayTypeNode(type) || ts.isTypeLiteralNode(type)) ? 'reactive' : 'ref';

    context.importHandler.addNamedImport(reactiveFn, 'vue');

    return `const ${name} = ${reactiveFn}(${printNode(stripThis(initializer)) ?? 'null'});`;
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

    return { name: getPropertyName(event), type };
  },
  Inject(value) {
    throw new Error('Method not implemented.');
  },
  Provider(value) {
    throw new Error('Method not implemented.');
  },
  Ref(value, context) {
    context.importHandler.addNamedImport('ref', 'vue');

    const type = getPropertyType(value);

    return `const ${getPropertyName(value)} = ref${type ? `<${printNode(type)}>` : ''}(${
      printNode(value.initializer) ?? 'null'
    });`;
  },
  Method({ node }) {
    // convert a method to a function declaration
    return printNode(convertMethodToFunction(stripThis(node)));
  },
  OnInit({ body }, context) {
    context.importHandler.addNamedImport('onMounted', 'vue');

    return `onMounted(() => ${printNode(stripThis(body))});`;
  },
  OnDestroy({ body }, context) {
    context.importHandler.addNamedImport('onUnmounted', 'vue');

    return `onUnmounted(() => ${printNode(stripThis(body))});`;
  },
  Template(value, styles, context) {
    return transformTemplate(value, templateTransformer, context);
  },
};
