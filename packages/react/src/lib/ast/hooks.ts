import { printNode, stripThis } from '@pryzm/ast-utils';
import * as ts from 'typescript';
import { transformAssignment } from '../utils/assignment';

/**
 * Create a useRef hook
 * @param name The name of the variable
 * @param initializer The initializer of the ref
 * @param type The type of the ref
 * @returns The useRef hook
 */
export function useRef(name: string, initializer: ts.Expression, type?: ts.TypeNode): string {
  const initialValue = initializer ? printNode(initializer) : '';
  const generic = type ? `<${printNode(type)}>` : '';

  return `const ${name} = useRef${generic}(${initialValue});`;
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
): string {
  const initialValue = initializer ? printNode(initializer) : '';
  const generic = type ? `<${printNode(type)}>` : '';

  return `const [${getter}, ${setter}] = useState${generic}(${initialValue});`;
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
export function useMemo(name: string, initializer: ts.BlockLike, dependencies: string[]): string {
  return `const ${name} = useMemo(() => ${printNode(stripThis(initializer)!)}, [${dependencies.join(
    ', '
  )}]);`;
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
): string {
  return `const ${name} = useCallback((${parameters
    .map(p => printNode(p))
    .join(', ')}) => ${printNode(
    stripThis(transformAssignment(initializer))!
  )}, [${dependencies.join(', ')}]);`;
}
