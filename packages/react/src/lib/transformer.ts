import { Transformer } from '@emblazon/compiler';
import * as ts from 'typescript';
import { factory } from 'typescript';
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
    statement: ts.VariableStatement;
  };
  Ref(ref: ts.PropertyDeclaration): {
    name: string;
    statement: ts.VariableStatement;
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
                  true
                ),
              ]
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    );

    return { name, statement };
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
    return value;
  },
  Inject(value) {
    return value;
  },
  Method(value) {
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
};
