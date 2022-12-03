import { TransformerResult } from '@emblazon/compiler';
import * as ts from 'typescript';
import { ReactTransformer } from './transformer';

export function generateComponent(
  metadata: TransformerResult<ReactTransformer>
): string {
  return 'react';
}

export function generatePropsInterface(
  metadata: TransformerResult<ReactTransformer>
) {
  // get the component name and upper camel case it and add Props to the end
  const name = metadata.name.charAt(0).toUpperCase() + metadata.name.slice(1);
  const interfaceName = `${name}Props`;

  const props = metadata.props.map((prop) => prop.interfaceProperty);

  return ts.factory.createInterfaceDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createIdentifier(interfaceName),
    undefined,
    undefined,
    props
  );
}
