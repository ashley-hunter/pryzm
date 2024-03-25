import * as ts from 'typescript';

type ValidatorNames = 'readonly' | 'private' | 'public';

export const Validators: Record<ValidatorNames, AstValidator> = {
  /**
   * Ensure the node is readonly
   */
  readonly: (node): boolean => {
    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;

    // if the property is not valid throw an error
    if (!modifiers?.find(modifier => modifier.kind === ts.SyntaxKind.ReadonlyKeyword)) {
      throw new Error(`The property "${node.name.getText()}" is not readonly`);
    }

    return true;
  },
  /**
   * Ensure the node is private
   * @param node The property node
   * @returns True if the property is private
   */
  private: (node): boolean => {
    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;

    if (!modifiers?.find(modifier => modifier.kind === ts.SyntaxKind.PrivateKeyword)) {
      throw new Error(`The property "${node.name.getText()}" is not private`);
    }

    return true;
  },
  /**
   * Ensure the node is public
   * @param node The property node
   * @returns True if the property is public
   */
  public: (node): boolean => {
    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;

    // a property is public if it has the public keyword or missing the private and protected keywords
    const valid =
      !!modifiers?.find(modifier => modifier.kind === ts.SyntaxKind.PublicKeyword) ||
      (!modifiers?.find(modifier => modifier.kind === ts.SyntaxKind.PrivateKeyword) &&
        !modifiers?.find(modifier => modifier.kind === ts.SyntaxKind.ProtectedKeyword));

    if (!valid) {
      throw new Error(`The property "${node.name.getText()}" is not public`);
    }

    return true;
  },
};

export type AstValidator = (
  property:
    | ts.PropertyDeclaration
    | ts.GetAccessorDeclaration
    | ts.SetAccessorDeclaration
    | ts.MethodDeclaration
) => boolean;
