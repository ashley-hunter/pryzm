import { TransformerResult } from '@pryzm/compiler';
import * as ts from 'typescript';
import { ReactTransformer } from './transformer';
import { propsName } from './utils/names';

export function generateComponent(
  metadata: TransformerResult<ReactTransformer>
) {
  // TODO: Add support for ordering state, computed, methods, refs, events based on their dependencies
}

export function generateComponentFunction(
  metadata: TransformerResult<ReactTransformer>
) {
  // should generate a react function component
  // e.g. export const Test = (props: TestProps) => { ... }

  return ts.factory.createVariableStatement(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          ts.factory.createIdentifier(metadata.name),
          undefined,
          undefined,
          ts.factory.createArrowFunction(
            undefined,
            undefined,
            [generatePropsParameter(metadata)],
            undefined,
            ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            ts.factory.createBlock([ts.factory.createReturnStatement()], true)
          )
        ),
      ],
      ts.NodeFlags.Const
    )
  );
}

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
