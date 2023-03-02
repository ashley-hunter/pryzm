import { getPropertyName, getReturnExpression, printNode, stripThis } from '@pryzm/ast-utils';
import {
  PropertyTransformerMetadata,
  Transformer,
  TransformerContext,
  TransformerResult,
  transformTemplate,
} from '@pryzm/compiler';
import * as ts from 'typescript';
import { templateTransformer } from './template-transformer';

export interface SvelteTranformer extends Transformer {
  State(metadata: PropertyTransformerMetadata): string;
  Prop(metadata: PropertyTransformerMetadata): string;
  Computed(computed: ts.GetAccessorDeclaration): string;
  Ref(ref: ts.PropertyDeclaration): string;
  Method(method: ts.MethodDeclaration): string;
  Event(
    event: ts.PropertyDeclaration,
    context: TransformerContext
  ): {
    name: string;
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
  PostTransform?: (
    metadata: TransformerResult<SvelteTranformer>
  ) => TransformerResult<SvelteTranformer>;
}

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

    return { name: getPropertyName(event) };
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
  Method(method) {
    return `function ${getPropertyName(method)}(${method.parameters.map(printNode).join(', ')})${
      method.type ? `: ${method.type}` : ''
    } ${printNode(stripThis(method.body))}`;
  },
  Template(value, styles, context) {
    return transformTemplate(value, templateTransformer, context);
  },
};
