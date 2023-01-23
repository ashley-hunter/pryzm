import { TransformerResult } from '@pryzm/compiler';
import * as ts from 'typescript';
import { factory } from 'typescript';
import { ReactTransformer } from '../transformer';
import { propsName } from '../utils/names';

export function createPropsInterface(
  metadata: TransformerResult<ReactTransformer>
) {
  return factory.createInterfaceDeclaration(
    [factory.createToken(ts.SyntaxKind.ExportKeyword)],
    factory.createIdentifier(propsName(metadata.name)),
    undefined,
    undefined,
    [
      ...metadata.props.map((prop) => prop.interfaceProperty),
      ...metadata.events.map((event) => event.interfaceProperty),
    ]
  );
}
