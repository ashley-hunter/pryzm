import * as ts from 'typescript';

type ValidatorNames = 'readonly' | 'private' | 'public' | 'protected';

export const Validators: Record<ValidatorNames, AstValidator> = {
  /**
   * Ensure the node is readonly
   */
  readonly: (node): boolean => {
    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;

    return !!modifiers?.find(modifier => modifier.kind === ts.SyntaxKind.ReadonlyKeyword);
  },
  /**
   * Ensure the node is private
   * @param node The property node
   * @returns True if the property is private
   */
  private: (node): boolean => {
    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;

    return !!modifiers?.find(modifier => modifier.kind === ts.SyntaxKind.PrivateKeyword);
  },
  /**
   * Ensure the node is public
   * @param node The property node
   * @returns True if the property is public
   */
  public: (node): boolean => {
    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;

    // a property is public if it has the public keyword or missing the private and protected keywords
    return (
      !!modifiers?.find(modifier => modifier.kind === ts.SyntaxKind.PublicKeyword) ||
      (!modifiers?.find(modifier => modifier.kind === ts.SyntaxKind.PrivateKeyword) &&
        !modifiers?.find(modifier => modifier.kind === ts.SyntaxKind.ProtectedKeyword))
    );
  },
  /**
   * Ensure the node is protected
   * @param node The property node
   * @returns True if the property is protected
   */
  protected: (node): boolean => {
    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;

    return !!modifiers?.find(modifier => modifier.kind === ts.SyntaxKind.ProtectedKeyword);
  },
};

export type AstValidator = (property: ts.PropertyLikeDeclaration | ts.MethodDeclaration) => boolean;
