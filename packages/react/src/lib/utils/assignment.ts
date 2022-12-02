import * as ts from 'typescript';
import { setterName } from './names';
import { stripThis } from './strip-this';

/**
 * Any assignments to state variables must be converted to a setState call.
 */
export function transformAssignment<T extends ts.Node>(node: T): T {
  // run the ts transformer
  return ts.transform(node, [convertAssignmentTransformer()]).transformed[0];
}

// create a ts transformer factory
function convertAssignmentTransformer<
  T extends ts.Node
>(): ts.TransformerFactory<T> {
  return (context) => {
    const visitor = (node: ts.Node): ts.Node => {
      // e.g. this.test = 'test'; => setTest('test');
      // e.g. this.test += 'test'; => setTest(test => test + 'test');
      if (
        ts.isExpressionStatement(node) &&
        ts.isBinaryExpression(node.expression) &&
        ts.isPropertyAccessExpression(node.expression.left) &&
        isThisExpression(node.expression.left.expression)
      ) {
        // determine the setter name
        const getter = node.expression.left.name.getText();
        const setter = setterName(getter);

        // determine the operator
        let operator: ts.BinaryOperator;

        switch (node.expression.operatorToken.kind) {
          case ts.SyntaxKind.EqualsToken:
            operator = ts.SyntaxKind.EqualsToken;
            break;

          case ts.SyntaxKind.PlusEqualsToken:
            operator = ts.SyntaxKind.PlusToken;
            break;

          case ts.SyntaxKind.MinusEqualsToken:
            operator = ts.SyntaxKind.MinusToken;
            break;

          case ts.SyntaxKind.AsteriskEqualsToken:
            operator = ts.SyntaxKind.AsteriskToken;
            break;

          case ts.SyntaxKind.SlashEqualsToken:
            operator = ts.SyntaxKind.SlashToken;
            break;

          case ts.SyntaxKind.PercentEqualsToken:
            operator = ts.SyntaxKind.PercentToken;
            break;

          case ts.SyntaxKind.AmpersandEqualsToken:
            operator = ts.SyntaxKind.AmpersandToken;
            break;

          case ts.SyntaxKind.BarEqualsToken:
            operator = ts.SyntaxKind.BarToken;
            break;

          case ts.SyntaxKind.CaretEqualsToken:
            operator = ts.SyntaxKind.CaretToken;
            break;

          case ts.SyntaxKind.LessThanLessThanEqualsToken:
            operator = ts.SyntaxKind.LessThanLessThanToken;
            break;

          case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
            operator = ts.SyntaxKind.GreaterThanGreaterThanToken;
            break;

          case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
            operator = ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken;
            break;

          case ts.SyntaxKind.AsteriskAsteriskEqualsToken:
            operator = ts.SyntaxKind.AsteriskAsteriskToken;
            break;

          default:
            throw new Error(
              `Unknown operator: ${node.expression.operatorToken.getText()}`
            );
        }

        // if the operator is an equals, then just call the setter
        if (operator === ts.SyntaxKind.EqualsToken) {
          return ts.factory.createExpressionStatement(
            ts.factory.createCallExpression(
              ts.factory.createIdentifier(setter),
              undefined,
              [stripThis(node.expression.right)!]
            )
          );
        }

        return ts.factory.createExpressionStatement(
          ts.factory.createCallExpression(
            ts.factory.createIdentifier(setter),
            undefined,
            [
              ts.factory.createArrowFunction(
                undefined,
                undefined,
                [
                  ts.factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    getter
                  ),
                ],
                undefined,
                undefined,
                ts.factory.createBinaryExpression(
                  ts.factory.createIdentifier(getter),
                  operator,
                  stripThis(node.expression.right)!
                )
              ),
            ]
          )
        );
      }

      // e.g. this.test++; => setTest(test => test + 1);
      if (
        ts.isExpressionStatement(node) &&
        ts.isPostfixUnaryExpression(node.expression) &&
        ts.isPropertyAccessExpression(node.expression.operand) &&
        isThisExpression(node.expression.operand.expression)
      ) {
        // determine the setter name
        const getter = node.expression.operand.name.getText();
        const setter = setterName(getter);

        // determine the operator
        let operator: ts.BinaryOperator;

        switch (node.expression.operator) {
          case ts.SyntaxKind.PlusPlusToken:
            operator = ts.SyntaxKind.PlusToken;
            break;

          case ts.SyntaxKind.MinusMinusToken:
            operator = ts.SyntaxKind.MinusToken;
            break;
        }

        return ts.factory.createExpressionStatement(
          ts.factory.createCallExpression(
            ts.factory.createIdentifier(setter),
            undefined,
            [
              ts.factory.createArrowFunction(
                undefined,
                undefined,
                [
                  ts.factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    getter
                  ),
                ],
                undefined,
                undefined,
                ts.factory.createBinaryExpression(
                  ts.factory.createIdentifier(getter),
                  operator,
                  ts.factory.createNumericLiteral(1)
                )
              ),
            ]
          )
        );
      }

      // e.g. this.test.x = 'test'; => setTest(test => { ...test, x: 'test' });
      // this also needs to work with arbitrary depth of property access
      if (
        ts.isExpressionStatement(node) &&
        ts.isBinaryExpression(node.expression) &&
        ts.isPropertyAccessExpression(node.expression.left) &&
        ts.isPropertyAccessExpression(node.expression.left.expression) &&
        isThisExpression(node.expression.left.expression.expression)
      ) {
        // determine the setter name
        const setter = setterName(
          node.expression.left.expression.name.getText()
        );

        // determine the property name
        const property = node.expression.left.name.getText();

        // convert to the setter that is a function that takes the current value and spreads the existing properties and adds the new property
        return ts.factory.createExpressionStatement(
          ts.factory.createCallExpression(
            ts.factory.createIdentifier(setter),
            undefined,
            [
              ts.factory.createArrowFunction(
                undefined,
                undefined,
                [
                  ts.factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    node.expression.left.expression.name.getText()
                  ),
                ],
                undefined,
                undefined,
                ts.factory.createObjectLiteralExpression(
                  [
                    ts.factory.createSpreadAssignment(
                      ts.factory.createIdentifier(
                        node.expression.left.expression.name.getText()
                      )
                    ),
                    ts.factory.createPropertyAssignment(
                      property,
                      stripThis(node.expression.right)!
                    ),
                  ],
                  true
                )
              ),
            ]
          )
        );
      }

      // transform any mutable array methods
      // e.g. this.test.push('test'); => setTest(test => { test.push('test'); return test; });
      if (isMutableArrayCallExpression(node)) {
        if (!ts.isPropertyAccessExpression(node.expression)) {
          throw new Error('Expected property access expression');
        }

        // strip the this
        const expression = stripThis(node)!;

        // determine the array name
        const arrayName = getPropertyName(
          node.expression as ts.PropertyAccessExpression
        );

        // determine the setter name
        const setter = setterName(arrayName);

        // call the setter function with a function that gets the current value, calls the method, and returns the value
        return ts.factory.createCallExpression(
          ts.factory.createIdentifier(setter),
          undefined,
          [
            ts.factory.createArrowFunction(
              undefined,
              undefined,
              [
                ts.factory.createParameterDeclaration(
                  undefined,
                  undefined,
                  arrayName
                ),
              ],
              undefined,
              undefined,
              ts.factory.createBlock(
                [
                  // insert the original expression stripped of the this
                  ts.factory.createExpressionStatement(expression),

                  ts.factory.createReturnStatement(
                    ts.factory.createIdentifier(arrayName)
                  ),
                ],
                true
              )
            ),
          ]
        );
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return (root) => ts.visitNode(root, visitor);
  };
}

function isThisExpression(node: ts.Node): node is ts.ThisExpression {
  return node.kind === ts.SyntaxKind.ThisKeyword;
}

function isMutableArrayCallExpression(
  node: ts.Node
): node is ts.CallExpression {
  const mutableArrayMethods = [
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'sort',
    'reverse',
  ];

  if (
    !ts.isCallExpression(node) ||
    !ts.isPropertyAccessExpression(node.expression)
  ) {
    return false;
  }

  // check that the name of the root property access expression is an array method
  if (!mutableArrayMethods.includes(node.expression.name.getText())) {
    return false;
  }

  // there may be multiple levels of property access so we need to traverse down to the last one
  let expression = node.expression;

  while (ts.isPropertyAccessExpression(expression.expression)) {
    expression = expression.expression;
  }

  // check that the root property access expression uses "this"
  return isThisExpression(expression.expression);
}

function getPropertyName(node: ts.PropertyAccessExpression): string {
  // there may be multiple levels of property access so we need to traverse down to the last one
  let expression = node;

  while (ts.isPropertyAccessExpression(expression.expression)) {
    expression = expression.expression;
  }

  return expression.name.getText();
}
