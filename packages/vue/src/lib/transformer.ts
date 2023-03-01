import { getPropertyName, getPropertyType, getReturnExpression, stripThis } from '@pryzm/ast-utils';
import { Transformer, TransformerContext, transformTemplate } from '@pryzm/compiler';
import * as ts from 'typescript';
import { factory } from 'typescript';
import { templateTransformer } from './template-transformer';

export interface VueTranformer extends Transformer {
  State(
    state: ts.PropertyDeclaration,
    context: TransformerContext
  ): {
    statement: ts.VariableStatement;
  };
  Prop(
    prop: ts.PropertyDeclaration,
    context: TransformerContext
  ): {
    name: string;
    type: ts.TypeNode | undefined;
    initializer: ts.Expression | undefined;
  };
  Computed(
    computed: ts.GetAccessorDeclaration,
    context: TransformerContext
  ): {
    statement: ts.VariableStatement;
  };
  Ref(ref: ts.PropertyDeclaration, context: TransformerContext): ts.VariableStatement;
  Method(method: ts.MethodDeclaration): {
    statement: ts.FunctionDeclaration;
  };
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
    const type = getPropertyType(computed);
    const initializer = getReturnExpression(computed);

    const statement = factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier(name),
            undefined,
            undefined,
            factory.createCallExpression(
              factory.createIdentifier('computed'),
              type ? [type] : undefined,
              [
                factory.createArrowFunction(
                  undefined,
                  undefined,
                  [],
                  undefined,
                  factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                  stripThis(initializer) as ts.ConciseBody
                ),
              ]
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    );

    return { statement };
  },
  Prop(prop) {
    // prop is a property declaration, we need to convert it to a variable statement
    const name = getPropertyName(prop);
    const type = getPropertyType(prop);
    const initializer = prop.initializer;

    return { name, type, initializer };
  },
  State(state, context) {
    // state is a property declaration, we need to convert it to a variable statement
    const name = getPropertyName(state);
    const type = getPropertyType(state);
    const initializer = state.initializer;

    // if the type is a primitive, we use `ref` to create a reactive variable
    // otherwise, we use `reactive` to create a reactive object
    const createReactive = ts.isTypeReferenceNode(type!) ? 'reactive' : 'ref';

    context.importHandler.addNamedImport(createReactive, 'vue');

    const statement = factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier(name),
            undefined,
            undefined,
            factory.createCallExpression(
              factory.createIdentifier(createReactive),
              type ? [type] : undefined,
              [initializer || factory.createNull()]
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    );

    return { statement };
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

    return factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier(getPropertyName(value)),
            undefined,
            undefined,
            factory.createCallExpression(
              factory.createIdentifier('ref'),
              type ? [type] : undefined,
              [factory.createNull()]
            )
          ),
        ],
        ts.NodeFlags.Const
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
