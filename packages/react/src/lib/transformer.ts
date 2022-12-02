import { Transformer } from '@emblazon/compiler';
import * as ts from 'typescript';
import { factory } from 'typescript';
import { transformAssignment } from './utils/assignment';
import { addComment, extractComment } from './utils/comment';
import { findDependencies } from './utils/find-dependencies';
import { stripThis } from './utils/strip-this';
import { inferType } from './utils/type-inference';

export interface ReactTransformer extends Transformer {
  State(state: ts.PropertyDeclaration): {
    getter: string;
    setter: string;
    statement: ts.VariableStatement;
  };
  Prop(prop: ts.PropertyDeclaration): {
    name: string;
    interfaceProperty: ts.PropertySignature;
    destructuredProperty: ts.BindingElement;
  };
  Computed(computed: ts.GetAccessorDeclaration): {
    name: string;
    dependencies: string[];
    statement: ts.VariableStatement;
  };
  Ref(ref: ts.PropertyDeclaration): {
    name: string;
    statement: ts.VariableStatement;
  };
  Method(method: ts.MethodDeclaration): {
    name: string;
    dependencies: string[];
    statement: ts.VariableStatement;
  };
  Event(event: ts.PropertyDeclaration): {
    name: string;
    interfaceProperty: ts.PropertySignature;
    destructuredProperty: ts.BindingElement;
  };
}

export const transformer: ReactTransformer = {
  Computed(computed) {
    const name = computed.name.getText();

    // scan the body for any dependencies
    const dependencies = findDependencies(computed.body!);

    // convert a getter to use memo
    // e.g. @Computed() get test() { return 'test'; } => const test = useMemo(() => { return 'test'; }, []);
    const statement = factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier(name),
            undefined,
            undefined,
            factory.createCallExpression(
              factory.createIdentifier('useMemo'),
              undefined,
              [
                factory.createArrowFunction(
                  undefined,
                  undefined,
                  [],
                  undefined,
                  undefined,
                  stripThis(computed.body)!
                ),
                // add the dependencies array
                factory.createArrayLiteralExpression(
                  dependencies.map((dep) => factory.createIdentifier(dep)),
                  false
                ),
              ]
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    );

    return { name, statement, dependencies };
  },
  Prop(prop) {
    // get the name of the prop
    const name = prop.name.getText();

    // get the default value of the prop if it exists
    const initializer = stripThis(prop.initializer);

    // get the type of the prop if it exists
    const type = prop.type ?? inferType(initializer, true);

    const comment = extractComment(prop);

    // create the interface property with the type attached
    const interfaceProperty = factory.createPropertySignature(
      undefined,
      name,
      undefined,
      type
    );

    // attach the comment to the interface property
    addComment(interfaceProperty, comment);

    // create the destructured property with the default value attached
    const destructuredProperty = factory.createBindingElement(
      undefined,
      undefined,
      name,
      initializer
    );

    return { name, interfaceProperty, destructuredProperty };
  },
  State(state) {
    // get the name of the state
    const getter = state.name.getText();

    // create a new name for the prop setter
    const setter = `set${getter[0].toUpperCase()}${getter.slice(1)}`;

    // get the initializer of the prop if it exists
    const initializer = stripThis(state.initializer);

    // get the type of the prop if it exists
    const type = state.type ?? inferType(initializer, false);

    // convert the property to a useState hook
    const statement = factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createArrayBindingPattern([
              factory.createBindingElement(
                undefined,
                undefined,
                factory.createIdentifier(getter),
                undefined
              ),
              factory.createBindingElement(
                undefined,
                undefined,
                factory.createIdentifier(setter),
                undefined
              ),
            ]),
            undefined,
            undefined,
            factory.createCallExpression(
              factory.createIdentifier('useState'),
              type ? [type] : undefined,
              initializer ? [initializer] : undefined
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    );

    return { getter, setter, statement };
  },
  Event(value) {
    // get the name of the prop
    const name = value.name.getText();

    // get the default value of the prop if it exists
    const initializer = value.initializer;

    // the event initializer will always be EventEmitter, but we need to get the type from the EventEmitter generic
    if (!initializer || !ts.isNewExpression(initializer)) {
      throw new Error('Event initializers must be an EventEmitter');
    }

    // get the type of the event
    const eventType = initializer.typeArguments?.[0];

    // create the type of the prop which is a function with a parameter of the event type
    const type = factory.createFunctionTypeNode(
      undefined,
      eventType
        ? [
            factory.createParameterDeclaration(
              undefined,
              undefined,
              factory.createIdentifier('event'),
              undefined,
              eventType,
              undefined
            ),
          ]
        : [],
      factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)
    );

    const comment = extractComment(value);

    // create the interface property with the type attached
    const interfaceProperty = factory.createPropertySignature(
      undefined,
      name,
      undefined,
      type
    );

    // attach the comment to the interface property
    addComment(interfaceProperty, comment);

    // create the destructured property with the default value attached
    const destructuredProperty = factory.createBindingElement(
      undefined,
      undefined,
      name,
      initializer
    );

    return { name, interfaceProperty, destructuredProperty };
  },
  Inject(value) {
    return value;
  },
  Provider(value) {
    return value;
  },
  Ref(value) {
    // get the name of the ref
    const name = value.name.getText();

    // get the type of the ref if it exists
    const type =
      value.type ??
      factory.createTypeReferenceNode(
        factory.createIdentifier('HTMLElement'),
        undefined
      );

    // convert the property to a useRef hook
    const statement = factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier(name),
            undefined,
            undefined,
            factory.createCallExpression(
              factory.createIdentifier('useRef'),
              [type],
              [factory.createNull()]
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    );

    return { name, statement };
  },
  Method(method) {
    let name = method.name.getText();

    // scan the body for any dependencies
    const dependencies = findDependencies(method.body!);

    // convert a method to a useCallback hook
    // e.g. test() { return 'test'; } => const test = useCallback(() => { return 'test'; }, []);
    const statement = factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier(name),
            undefined,
            undefined,
            factory.createCallExpression(
              factory.createIdentifier('useCallback'),
              undefined,
              [
                factory.createArrowFunction(
                  undefined,
                  undefined,
                  method.parameters,
                  undefined,
                  undefined,
                  stripThis(transformAssignment(method.body!))!
                ),
                // add the dependencies array
                factory.createArrayLiteralExpression(
                  dependencies.map((dep) => factory.createIdentifier(dep)),
                  false
                ),
              ]
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    );

    return { name, statement, dependencies };
  },
};
