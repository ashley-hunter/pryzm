import * as ts from 'typescript';
import { stripThis } from '../utils/strip-this';

/**
 * Create a useRef hook
 * @param name The name of the variable
 * @param initializer The initializer of the ref
 * @returns The useRef hook
 */
export function useRef(
  name: string,
  initializer: ts.Expression
): ts.VariableStatement {
  return ts.factory.createVariableStatement(
    undefined,
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          ts.factory.createIdentifier(name),
          undefined,
          undefined,
          ts.factory.createCallExpression(
            ts.factory.createIdentifier('useRef'),
            undefined,
            [stripThis(initializer)!]
          )
        ),
      ],
      ts.NodeFlags.Const
    )
  );
}

/**
 * Create a useState hook
 * @param getter The name of the variable
 * @param initializer The initializer of the state
 * @param type The type of the state
 * @returns The useState hook
 * @example
 * const [name, setName] = useState('value');
 */
export function useState(
  getter: string,
  setter: string,
  initializer?: ts.Expression,
  type?: ts.TypeNode
): ts.VariableStatement {
  return ts.factory.createVariableStatement(
    undefined,
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          ts.factory.createArrayBindingPattern([
            ts.factory.createBindingElement(
              undefined,
              undefined,
              ts.factory.createIdentifier(getter)
            ),
            ts.factory.createBindingElement(
              undefined,
              undefined,
              ts.factory.createIdentifier(setter)
            ),
          ]),
          undefined,
          undefined,
          ts.factory.createCallExpression(
            ts.factory.createIdentifier('useState'),
            type ? [type] : undefined,
            initializer ? [stripThis(initializer)!] : undefined
          )
        ),
      ],
      ts.NodeFlags.Const
    )
  );
}
