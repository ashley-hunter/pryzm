import {
  getPropertyName,
  getPropertyType,
  getReturnExpression,
  printNode,
  stripThis,
} from '@pryzm/ast-utils';
import {
  MethodTransformerMetadata,
  PropertyTransformerMetadata,
  Transformer,
  TransformerContext,
  transformTemplate,
} from '@pryzm/compiler';
import * as ts from 'typescript';
import { templateTransformer } from './template-transformer';

export interface VueTranformer extends Transformer {
  State(metadata: PropertyTransformerMetadata, context: TransformerContext): string;
  Prop(
    metadata: PropertyTransformerMetadata,
    context: TransformerContext
  ): {
    name: string;
    type: string | undefined;
    initializer: string | undefined;
  };
  Computed(computed: ts.GetAccessorDeclaration, context: TransformerContext): string;
  Ref(ref: ts.PropertyDeclaration, context: TransformerContext): string;
  Method(metadata: MethodTransformerMetadata): string;
  OnInit(metadata: MethodTransformerMetadata, context: TransformerContext): string;
  OnDestroy(metadata: MethodTransformerMetadata, context: TransformerContext): string;
  Event(
    event: ts.PropertyDeclaration,
    context: TransformerContext
  ): {
    name: string;
    type: ts.TypeNode | undefined;
  };
  Provider(provider: ts.PropertyDeclaration): {
    name: string;
    token: ts.Identifier;
    statement: ts.VariableStatement;
  };
  Inject(inject: ts.PropertyDeclaration): {
    name: string;
    token: ts.Identifier;
    type: ts.TypeNode | undefined;
  };
  Template?: (
    value: ts.JsxFragment | ts.JsxElement | ts.JsxSelfClosingElement,
    styles: string,
    context: TransformerContext
  ) => string;
}

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
    const reactiveFn = ts.isTypeReferenceNode(type!) ? 'reactive' : 'ref';

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
  Method({ name, returnType, parameters, body }) {
    // convert a method to a function declaration
    return `function ${name}(${parameters.map(printNode).join(', ')})${
      returnType ? `: ${printNode(returnType)}` : ''
    } ${printNode(stripThis(body))};`;
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
