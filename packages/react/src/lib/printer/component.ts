import { TransformerResult } from '@pryzm/compiler';
import * as ts from 'typescript';
import { factory } from 'typescript';
import { ReactTransformer } from '../transformer';
import { propsName } from '../utils/names';

export function createComponent(metadata: TransformerResult<ReactTransformer>) {
  return factory.createVariableStatement(
    [factory.createToken(ts.SyntaxKind.ExportKeyword)],
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          factory.createIdentifier(metadata.name),
          undefined,
          undefined,
          factory.createCallExpression(
            factory.createIdentifier('forwardRef'),
            [
              factory.createTypeReferenceNode(
                factory.createIdentifier('HTMLElement'),
                undefined
              ),
              factory.createTypeReferenceNode(
                factory.createIdentifier(propsName(metadata.name)),
                undefined
              ),
            ],
            [
              factory.createArrowFunction(
                undefined,
                undefined,
                [
                  factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    factory.createObjectBindingPattern(
                      metadata.props.map((prop) => prop.destructuredProperty)
                    ),
                    undefined,
                    undefined,
                    undefined
                  ),
                  factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    factory.createIdentifier('ref'),
                    undefined,
                    undefined,
                    undefined
                  ),
                ],
                undefined,
                factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                factory.createBlock(
                  [
                    factory.createReturnStatement(
                      factory.createJsxSelfClosingElement(
                        factory.createIdentifier('div'),
                        undefined,
                        factory.createJsxAttributes([])
                      )
                    ),
                  ],
                  true
                )
              ),
            ]
          )
        ),
      ],
      ts.NodeFlags.Const
    )
  );
}
