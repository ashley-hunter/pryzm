import { TransformerResult } from '@pryzm/compiler';
import * as ts from 'typescript';
import { factory } from 'typescript';
import { ReactTransformer } from '../transformer';
import { propsName } from '../utils/names';

export function createComponent(metadata: TransformerResult<ReactTransformer>) {
  return factory.createFunctionDeclaration(
    [
      factory.createToken(ts.SyntaxKind.ExportKeyword),
      factory.createToken(ts.SyntaxKind.DefaultKeyword),
    ],
    undefined,
    factory.createIdentifier(metadata.name),
    undefined,
    [
      factory.createParameterDeclaration(
        undefined,
        undefined,
        factory.createObjectBindingPattern([
          ...metadata.props.map(prop => prop.destructuredProperty),
          ...metadata.events.map(event => event.destructuredProperty),
          ...metadata.slots.map(slot => slot.destructuredProperty),
        ]),
        undefined,
        factory.createTypeReferenceNode(
          factory.createIdentifier(propsName(metadata.name)),
          undefined
        ),
        undefined
      ),
    ],
    undefined,
    factory.createBlock(
      [
        ...metadata.refs.map(ref => ref.statement),
        ...metadata.states.map(state => state.statement),
        ...metadata.computed.map(computed => computed.statement),
        ...metadata.methods.map(method => method.statement),
        factory.createReturnStatement(metadata.template),
      ],
      true
    )
  );
}
