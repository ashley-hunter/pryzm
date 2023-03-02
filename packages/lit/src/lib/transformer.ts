import { getPropertyName, getPropertyType, printNode } from '@pryzm/ast-utils';
import {
  MethodTransformerMetadata,
  PropertyTransformerMetadata,
  Transformer,
  TransformerContext,
  TransformerResult,
  transformTemplate,
} from '@pryzm/compiler';
import * as ts from 'typescript';
import { factory } from 'typescript';
import { templateTransformer } from './template-transformer';

export interface LitTranformer extends Transformer {
  State(metadata: PropertyTransformerMetadata, context: TransformerContext): string;
  Prop(metadata: PropertyTransformerMetadata, context: TransformerContext): string;
  Computed(computed: ts.GetAccessorDeclaration): string;
  Method(method: MethodTransformerMetadata): string;
  OnInit(method: ts.MethodDeclaration): string;
  OnDestroy(method: ts.MethodDeclaration): string;
  Ref(ref: ts.PropertyDeclaration, context: TransformerContext): string;
  Event(event: ts.PropertyDeclaration): {
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
  PostTransform?: (metadata: TransformerResult<LitTranformer>) => TransformerResult<LitTranformer>;
}

export const transformer: LitTranformer = {
  Computed(computed) {
    return printNode(
      factory.createGetAccessorDeclaration(undefined, computed.name, [], undefined, computed.body)
    );
  },
  Prop({ name, type, initializer }, context) {
    context.importHandler.addNamedImport('property', 'lit/decorators.js');

    return printNode(
      factory.createPropertyDeclaration(
        [
          factory.createDecorator(
            factory.createCallExpression(factory.createIdentifier('property'), undefined, [])
          ),
        ],
        name,
        undefined,
        type,
        initializer
      )
    );
  },
  State({ name, type, initializer, isReadonly }, context) {
    context.importHandler.addNamedImport('state', 'lit/decorators.js');

    const modifiers: ts.ModifierLike[] = [
      factory.createDecorator(
        factory.createCallExpression(factory.createIdentifier('state'), undefined, [])
      ),
      factory.createToken(ts.SyntaxKind.PrivateKeyword),
    ];

    if (isReadonly) {
      modifiers.push(factory.createToken(ts.SyntaxKind.ReadonlyKeyword));
    }

    return printNode(
      factory.createPropertyDeclaration(modifiers, name, undefined, type, initializer)
    );
  },
  Method({ node }) {
    return printNode(node);
  },
  OnInit(method) {
    // create a method called connectedCallback and insert the method body into it
    const connectedCallback = factory.createMethodDeclaration(
      method.modifiers,
      method.asteriskToken,
      factory.createIdentifier('connectedCallback'),
      method.questionToken,
      method.typeParameters,
      [],
      method.type,
      method.body
    );

    return printNode(connectedCallback);
  },
  OnDestroy(method) {
    // create a method called disconnectedCallback and insert the method body into it
    const disconnectedCallback = factory.createMethodDeclaration(
      method.modifiers,
      method.asteriskToken,
      factory.createIdentifier('disconnectedCallback'),
      method.questionToken,
      method.typeParameters,
      [],
      method.type,
      method.body
    );

    return printNode(disconnectedCallback);
  },
  Event(event) {
    return { name: getPropertyName(event) };
  },
  Inject(value) {
    throw new Error('Method not implemented.');
  },
  Provider(value) {
    throw new Error('Method not implemented.');
  },
  Ref(value, context) {
    context.importHandler.addNamedImport('createRef', 'lit/directives/ref.js');
    context.importHandler.addNamedImport('ref', 'lit/directives/ref.js');
    context.importHandler.addNamedImport('Ref', 'lit');

    const type = getPropertyType(value);

    return printNode(
      factory.createPropertyDeclaration(
        undefined,
        factory.createIdentifier('inputRef'),
        undefined,
        factory.createTypeReferenceNode(factory.createIdentifier('Ref'), type ? [type] : undefined),
        factory.createCallExpression(factory.createIdentifier('createRef'), undefined, [])
      )
    );
  },
  Styles(value, context) {
    context.importHandler.addNamedImport('css', 'lit');
    return value;
  },
  Template(value, styles, context) {
    context.importHandler.addNamedImport('html', 'lit');
    return transformTemplate(value, templateTransformer, context);
  },
  PreTransform(metadata, context) {
    context.importHandler.addNamedImport('LitElement', 'lit');
    context.importHandler.addNamedImport('customElement', 'lit/decorators.js');
    return metadata;
  },
};
