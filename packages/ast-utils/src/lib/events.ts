import * as ts from 'typescript';
import { getPropertyName } from './name';

/**
 * Determines if the node is an event emitter call
 * @example `this.onSelect.emit()`
 * @param node The node to test
 * @returns True if the node is an event emitter call
 */
export function isEventEmitterCall(
  node: ts.Node,
  events: ts.PropertyDeclaration[]
): node is ts.CallExpression {
  if (
    ts.isExpressionStatement(node) &&
    ts.isCallExpression(node.expression) &&
    ts.isPropertyAccessExpression(node.expression.expression) &&
    node.expression.expression.name.text === 'emit'
  ) {
    const eventName = getEventNameFromEmitterCall(node);

    // if the event name is not in the list of events, then it is not an event emitter
    return events.some(e => getPropertyName(e) === eventName);
  }

  return false;
}

/**
 * Get the event name from the event emitter call
 * @example `this.onSelect.emit()` => `onSelect`
 * @param node The node to test
 * @returns The event name
 * @throws If the node is not an event emitter call
 */
export function getEventNameFromEmitterCall<T extends ts.Node>(node: T): string {
  if (!ts.isExpressionStatement(node)) {
    throw new Error('Node is not an expression statement');
  }

  if (!ts.isCallExpression(node.expression)) {
    throw new Error('Node is not a call expression');
  }

  if (!ts.isPropertyAccessExpression(node.expression.expression)) {
    throw new Error('Node is not a property access expression');
  }

  if (node.expression.expression.name.text !== 'emit') {
    throw new Error('Node is not an emit call');
  }

  // if this is a property access expression, then strip this
  if (ts.isPropertyAccessExpression(node.expression.expression.expression)) {
    return getPropertyName(node.expression.expression.expression as ts.PropertyAccessExpression);
  }

  if (!ts.isIdentifier(node.expression.expression.expression)) {
    throw new Error('Node is not an identifier');
  }

  return node.expression.expression.expression.text;
}

/**
 * Get the argument from the event emitter call
 * @example `this.onSelect.emit('foo')` => `'foo'`
 * @param node The node to test
 * @returns The event name
 * @throws If the node is not an event emitter call
 */
export function getValueFromEmitterCall<T extends ts.Node>(node: T): ts.Expression | undefined {
  if (!ts.isExpressionStatement(node)) {
    throw new Error('Node is not an expression statement');
  }

  if (!ts.isCallExpression(node.expression)) {
    throw new Error('Node is not a call expression');
  }

  return node.expression.arguments[0];
}
