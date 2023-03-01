import {
  getPropertyName,
  getReturnExpression,
  isPropertyReadonly,
  stripThis,
} from '@pryzm/ast-utils';
import {
  Transformer,
  TransformerContext,
  TransformerResult,
  transformTemplate,
} from '@pryzm/compiler';
import * as ts from 'typescript';
import { factory } from 'typescript';
import { templateTransformer } from './template-transformer';

export interface SvelteTranformer extends Transformer {
  State(state: ts.PropertyDeclaration): {
    statement: ts.VariableStatement;
  };
  Prop(prop: ts.PropertyDeclaration): {
    statement: ts.VariableStatement;
  };
  Computed(computed: ts.GetAccessorDeclaration): {
    statement: ts.LabeledStatement;
  };
  Ref(ref: ts.PropertyDeclaration): ts.VariableStatement;
  Method(method: ts.MethodDeclaration): {
    statement: ts.FunctionDeclaration;
  };
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

    const statement = factory.createLabeledStatement(
      factory.createIdentifier('$'),
      factory.createExpressionStatement(
        factory.createBinaryExpression(
          factory.createIdentifier(name),
          factory.createToken(ts.SyntaxKind.EqualsToken),
          stripThis(initializer)!
        )
      )
    );

    return { statement };
  },
  Prop(prop) {
    // prop is a property declaration, we need to convert it to a variable statement
    const name = getPropertyName(prop);
    const initializer = prop.initializer;

    const statement = factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier(name),
            undefined,
            undefined,
            stripThis(initializer)
          ),
        ],
        ts.NodeFlags.Let
      )
    );

    return { statement };
  },
  State(state) {
    // state is a property declaration, we need to convert it to a variable statement
    const name = getPropertyName(state);
    const isReadonly = isPropertyReadonly(state);
    const initializer = state.initializer;

    const statement = factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier(name),
            undefined,
            undefined,
            stripThis(initializer)
          ),
        ],
        isReadonly ? ts.NodeFlags.Const : ts.NodeFlags.Let
      )
    );

    return { statement };
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
    return factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier(getPropertyName(value)),
            undefined,
            undefined,
            undefined
          ),
        ],
        ts.NodeFlags.Let
      )
    );
  },
  Method(method) {
    // convert a method to a function declaration
    const name = getPropertyName(method);
    const returnType = method.type;
    const statement = ts.factory.createFunctionDeclaration(
      undefined,
      undefined,
      name,
      undefined,
      method.parameters,
      returnType,
      stripThis(method.body)
    );

    return { statement };
  },
  Template(value, styles, context) {
    return transformTemplate(value, templateTransformer, context);
  },
};
