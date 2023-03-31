import * as ts from 'typescript';

export class ProviderMetadata {
  /**
   * Create a new provider metadata instance
   */
  constructor(
    /**
     * Store the file path
     */
    public readonly filePath: string,
    /**
     * Store the provider name
     */
    public readonly name: string,
    /**
     * Store the provider properties
     */
    public readonly properties: ts.PropertyDeclaration[] = [],
    /**
     * Store the provider methods
     */
    public readonly methods: ts.MethodDeclaration[] = []
  ) {}
}
