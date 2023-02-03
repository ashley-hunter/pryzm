import { stripThis } from '@pryzm/ast-utils';
import * as ts from 'typescript';
import { transformAssignment } from '../utils/assignment';

/**
 * Create a useRef hook
 * @param name The name of the variable
 * @param initializer The initializer of the ref
 * @param type The type of the ref
 * @returns The useRef hook
 */
export function useRef(
  name: string,
  initializer: ts.Expression,
  type?: ts.TypeNode
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
            type ? [type] : undefined,
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

/**
 * Create a useMemo hook
 * @param name The name of the variable
 * @param initializer The initializer of the memo
 * @param dependencies The dependencies of the memo
 * @returns The useMemo hook
 * @example
 * const name = useMemo(() => 'value', []);
 */
export function useMemo(
  name: string,
  initializer: ts.BlockLike,
  dependencies: string[]
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
            ts.factory.createIdentifier('useMemo'),
            undefined,
            [
              ts.factory.createArrowFunction(
                undefined,
                undefined,
                [],
                undefined,
                undefined,
                stripThis(initializer)!
              ),
              ts.factory.createArrayLiteralExpression(
                dependencies.map((dep) => ts.factory.createIdentifier(dep)),
                false
              ),
            ]
          )
        ),
      ],
      ts.NodeFlags.Const
    )
  );
}

/**
 * Create a useCallback hook
 * @param name The name of the variable
 * @param parameters The parameters of the callback
 * @param initializer The initializer of the callback
 * @param dependencies The dependencies of the callback
 * @returns The useCallback hook
 * @example
 * const name = useCallback(() => 'value', []);
 */
export function useCallback(
  name: string,
  parameters: ts.NodeArray<ts.ParameterDeclaration>,
  initializer: ts.BlockLike,
  dependencies: string[]
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
            ts.factory.createIdentifier('useCallback'),
            undefined,
            [
              ts.factory.createArrowFunction(
                undefined,
                undefined,
                parameters,
                undefined,
                undefined,
                stripThis(transformAssignment(initializer))!
              ),
              ts.factory.createArrayLiteralExpression(
                dependencies.map((dep) => ts.factory.createIdentifier(dep)),
                false
              ),
            ]
          )
        ),
      ],
      ts.NodeFlags.Const
    )
  );
}
