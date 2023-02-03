import * as ts from 'typescript';
import { getText } from './name';

export function getTagName(
  node: ts.JsxElement | ts.JsxSelfClosingElement
): string {
  if (ts.isJsxElement(node)) {
    return getText(node.openingElement.tagName);
  }

  if (ts.isJsxSelfClosingElement(node)) {
    return getText(node.tagName);
  }

  throw new Error('Invalid JSX node');
}

export function getAttributeName(node: ts.JsxAttribute): string {
  return getText(node.name);
}

export function getAttributeValue(
  node: ts.JsxAttribute
): ts.Expression | undefined {
  if (node.initializer && ts.isJsxExpression(node.initializer)) {
    return node.initializer.expression;
  }

  // if there is a string literal then we return it
  if (node.initializer && ts.isStringLiteral(node.initializer)) {
    return node.initializer;
  }

  // if there is no value then we assume it's a boolean attribute and return "true"
  return ts.factory.createTrue();
}
