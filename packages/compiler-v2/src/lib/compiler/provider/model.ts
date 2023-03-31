import * as ts from 'typescript';

export interface ProviderMetadata {
  /**
   * Store the file path
   */
  readonly path: string;
  /**
   * Store the provider name
   */
  readonly name: string;
  /**
   * Store the provider properties
   */
  readonly properties: ts.PropertyDeclaration[];
  /**
   * Store the provider methods
   */
  readonly methods: ts.MethodDeclaration[];
}
