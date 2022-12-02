import { Transformer } from '@emblazon/compiler';
import * as ts from 'typescript';
import { factory } from 'typescript';
import { addComment, extractComment } from './utils/comment';
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
}

export const transformer: ReactTransformer = {
  Prop(prop) {
    // get the name of the prop
    const name = prop.name.getText();

    // get the default value of the prop if it exists
    const initializer = prop.initializer;

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
    const initializer = state.initializer;

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
};
