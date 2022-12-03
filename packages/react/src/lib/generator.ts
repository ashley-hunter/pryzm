import { TransformerResult } from '@emblazon/compiler';
import * as ts from 'typescript';
import { ReactTransformer } from './transformer';
import { propsName } from './utils/names';

export function generateComponent(
  metadata: TransformerResult<ReactTransformer>
) {}

export function generatePropsParameter(
  metadata: TransformerResult<ReactTransformer>
) {
  return ts.factory.createParameterDeclaration(
    undefined,
    undefined,
    ts.factory.createObjectBindingPattern(
      metadata.props.map((prop) => prop.destructuredProperty)
    ),
    undefined,
    ts.factory.createTypeReferenceNode(
      ts.factory.createIdentifier(propsName(metadata.name)),
      undefined
    ),
    undefined
  );
}

export function generatePropsInterface(
  metadata: TransformerResult<ReactTransformer>
) {
  const props = metadata.props.map((prop) => prop.interfaceProperty);

  return ts.factory.createInterfaceDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createIdentifier(propsName(metadata.name)),
    undefined,
    undefined,
    props
  );
}
