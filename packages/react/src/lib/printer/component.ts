import { TransformerResult } from '@pryzm/compiler';
import * as ts from 'typescript';
import { factory } from 'typescript';
import { ReactTransformer } from '../transformer';

export function createComponent(metadata: TransformerResult<ReactTransformer>) {
  return factory.createFunctionDeclaration(
    [factory.createToken(ts.SyntaxKind.ExportKeyword)],
    undefined,
    factory.createIdentifier('UxaAlert'),
    undefined,
    [
      factory.createParameterDeclaration(
        undefined,
        undefined,
        factory.createObjectBindingPattern(metadata.props.map(prop => prop.destructuredProperty)),
        undefined,
        undefined,
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

  // return factory.createVariableStatement(
  //   [factory.createToken(ts.SyntaxKind.ExportKeyword)],
  //   factory.createVariableDeclarationList(
  //     [
  //       factory.createVariableDeclaration(
  //         factory.createIdentifier(metadata.name),
  //         undefined,
  //         factory.createTypeReferenceNode(factory.createIdentifier('FC'), [
  //           factory.createTypeReferenceNode(
  //             factory.createIdentifier(propsName(metadata.name)),
  //             undefined
  //           ),
  //         ]),
  //         factory.createArrowFunction(
  //           undefined,
  //           undefined,
  //           [
  //             factory.createParameterDeclaration(
  //               undefined,
  //               undefined,
  //               factory.createObjectBindingPattern(
  //                 metadata.props.map(prop => prop.destructuredProperty)
  //               ),
  //               undefined,
  //               undefined,
  //               undefined
  //             ),
  //           ],
  //           undefined,
  //           factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
  //           factory.createBlock(
  //             [
  //               ...metadata.states.map(state => state.statement),
  //               ...metadata.computed.map(computed => computed.statement),
  //               ...metadata.methods.map(method => method.statement),
  //               factory.createReturnStatement(metadata.template),
  //             ],
  //             true
  //           )
  //         )
  //       ),
  //     ],
  //     ts.NodeFlags.Const
  //   )
  // );

  // return factory.createVariableStatement(
  //   [factory.createToken(ts.SyntaxKind.ExportKeyword)],
  //   factory.createVariableDeclarationList(
  //     [
  //       factory.createVariableDeclaration(
  //         factory.createIdentifier(metadata.name),
  //         undefined,
  //         undefined,
  //         factory.createCallExpression(
  //           factory.createIdentifier('forwardRef'),
  //           [
  //             factory.createTypeReferenceNode(factory.createIdentifier('HTMLElement'), undefined),
  //             factory.createTypeReferenceNode(
  //               factory.createIdentifier(propsName(metadata.name)),
  //               undefined
  //             ),
  //           ],
  //           [
  //             factory.createArrowFunction(
  //               undefined,
  //               undefined,
  //               [
  //                 factory.createParameterDeclaration(
  //                   undefined,
  //                   undefined,
  //                   factory.createObjectBindingPattern(
  //                     metadata.props.map(prop => prop.destructuredProperty)
  //                   ),
  //                   undefined,
  //                   undefined,
  //                   undefined
  //                 ),
  //                 factory.createParameterDeclaration(
  //                   undefined,
  //                   undefined,
  //                   factory.createIdentifier('ref'),
  //                   undefined,
  //                   undefined,
  //                   undefined
  //                 ),
  //               ],
  //               undefined,
  //               factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
  //               factory.createBlock(
  //                 [
  //                   ...metadata.states.map(state => state.statement),
  //                   ...metadata.computed.map(computed => computed.statement),
  //                   ...metadata.methods.map(method => method.statement),
  //                   factory.createReturnStatement(metadata.template),
  //                 ],
  //                 true
  //               )
  //             ),
  //           ]
  //         )
  //       ),
  //     ],
  //     ts.NodeFlags.Const
  //   )
  // );
}
