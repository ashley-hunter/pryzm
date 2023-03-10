import * as ts from 'typescript';

export interface PropertyTransformerMetadata {
  name: string;
  type?: ts.TypeNode;
  isReadonly: boolean;
  initializer?: ts.Expression;
  node: ts.PropertyDeclaration;
  comment?: string;
}

export interface MethodTransformerMetadata {
  name: string;
  returnType?: ts.TypeNode;
  parameters: ts.NodeArray<ts.ParameterDeclaration>;
  body?: ts.Block;
  node: ts.MethodDeclaration;
  comment?: string;
}

export interface ComputedTransformerMetadata {
  name: string;
  body: ts.Block;
  node: ts.GetAccessorDeclaration;
  comment?: string;
}

export interface RefTransformerMetadata {
  name: string;
  type?: ts.TypeNode;
  initializer?: ts.Expression;
  node: ts.PropertyDeclaration;
  comment?: string;
}

export interface EventTransformerMetadata {
  name: string;
  type?: ts.TypeNode;
  initializer: ts.NewExpression;
  node: ts.PropertyDeclaration;
  comment?: string;
}
