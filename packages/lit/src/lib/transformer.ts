import { getPropertyName, printNode } from '@pryzm/ast-utils';
import { StringTransformer, transformTemplate } from '@pryzm/compiler';
import * as ts from 'typescript';
import { factory } from 'typescript';
import { templateTransformer } from './template-transformer';

export type LitTranformer = StringTransformer;

export const transformer: LitTranformer = {
  Computed({ name, body }) {
    return printNode(factory.createGetAccessorDeclaration(undefined, name, [], undefined, body));
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
  OnInit({ node }) {
    // create a method called connectedCallback and insert the method body into it
    const connectedCallback = factory.createMethodDeclaration(
      node.modifiers,
      node.asteriskToken,
      factory.createIdentifier('connectedCallback'),
      node.questionToken,
      node.typeParameters,
      [],
      node.type,
      node.body
    );

    return printNode(connectedCallback);
  },
  OnDestroy({ node }) {
    // create a method called disconnectedCallback and insert the method body into it
    const disconnectedCallback = factory.createMethodDeclaration(
      node.modifiers,
      node.asteriskToken,
      factory.createIdentifier('disconnectedCallback'),
      node.questionToken,
      node.typeParameters,
      [],
      node.type,
      node.body
    );

    return printNode(disconnectedCallback);
  },
  Event(event) {
    return getPropertyName(event);
  },
  Inject(value) {
    throw new Error('Method not implemented.');
  },
  Provider(value) {
    throw new Error('Method not implemented.');
  },
  Ref({ name, type }, context) {
    context.importHandler.addNamedImport('createRef', 'lit/directives/ref.js');
    context.importHandler.addNamedImport('ref', 'lit/directives/ref.js');
    context.importHandler.addNamedImport('Ref', 'lit');

    return printNode(
      factory.createPropertyDeclaration(
        undefined,
        factory.createIdentifier(name),
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
    // if there is no selector then throw an error
    if (!metadata.selector) {
      throw new Error('Missing selector');
    }

    context.importHandler.addNamedImport('LitElement', 'lit');
    context.importHandler.addNamedImport('customElement', 'lit/decorators.js');
    return metadata;
  },
};
