import { Transformer } from '@emblazon/compiler';
import * as ts from 'typescript';
import { factory } from 'typescript';

export interface ReactTransformer extends Transformer {
  State?: (value: ts.PropertyDeclaration) => ts.VariableStatement;
}

export const transformer: ReactTransformer = {
  State: (state) => {
    // get the name of the state
    const getterName = state.name.getText();

    // create a new name for the prop setter
    const setterName = `set${getterName[0].toUpperCase()}${getterName.slice(
      1
    )}`;

    // get the type of the prop if it exists
    const type = state.type;

    // get the initializer of the prop if it exists
    const initializer = state.initializer;

    // convert the property to a useState hook
    return factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createArrayBindingPattern([
              factory.createBindingElement(
                undefined,
                undefined,
                factory.createIdentifier(getterName),
                undefined
              ),
              factory.createBindingElement(
                undefined,
                undefined,
                factory.createIdentifier(setterName),
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
  },
};
