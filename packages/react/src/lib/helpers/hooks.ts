import { convertMethodToArrowFunction, insertComment, printNode } from '@pryzm/ast-utils';
import { Injection } from '@pryzm/compiler';
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

/**
 * Create createContext function call
 * @param provider The provider identifier
 */
export function createContext(provider: ts.Identifier): string {
  // if the provider was called Service then the output would be
  // const ServiceContext = createContext<Service>(null);
  return `const ${provider.text}Context = createContext<${provider.text}>(null);`;
}

/**
 * Create a Provider component
 * @param provider The provider identifier
 * @param injects The injects in the class, used to determine if the class requires access to the context
 */
export function createProvider(provider: ts.Identifier, injects: Injection[]) {
  // if the provider was called Service then the provider name would be ServiceContext.Provider
  // if the class injects this service then the value would be the service, otherwise we would instantiate the service class
  const inject = injects.find(inject => inject.provider.getText() === provider.text && inject.self);

  return {
    name: `${provider.text}Context.Provider`,
    value: inject ? inject.identifier.getText() : `new ${provider.text}()`,
  };
}

export interface ProviderResult {
  name: string;
  value: string;
}
