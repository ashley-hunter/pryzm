import { convertMethodToArrowFunction, insertComment, printNode } from '@pryzm/ast-utils';
import * as ts from 'typescript';

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
  type?: ts.TypeNode,
  comment = ''
): string {
  const initialValue = initializer ? printNode(initializer) : '';
  const generic = type ? `<${printNode(type)}>` : '';

  return insertComment(`const ${name} = useRef${generic}(${initialValue});`, comment);
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
  type?: ts.TypeNode,
  comment = ''
): string {
  const initialValue = initializer ? printNode(initializer) : '';
  const generic = type ? `<${printNode(type)}>` : '';

  return insertComment(
    `const [${getter}, ${setter}] = useState${generic}(${initialValue});`,
    comment
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
  dependencies: string[],
  comment = ''
): string {
  return insertComment(
    `const ${name} = useMemo(() => ${printNode(initializer)}, [${dependencies.join(', ')}]);`,
    comment
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
  method: ts.MethodDeclaration,
  dependencies: string[],
  comment = ''
): string {
  const arrowFunction = convertMethodToArrowFunction(method);

  return insertComment(
    `const ${name} = useCallback(${printNode(arrowFunction)}, [${dependencies.join(', ')}]);`,
    comment
  );
}

/**
 * Create a useEffect hook
 * @param initializer The initializer of the effect
 * @param dependencies The dependencies of the effect
 * @returns The useEffect hook
 * @example
 * useEffect(() => 'value', []);
 */
export function useEffect(initializer: ts.BlockLike, dependencies: string[]): string {
  return `useEffect(() => ${printNode(initializer)}, [${dependencies.join(', ')}]);`;
}
