import * as ts from 'typescript';
import { factory } from 'typescript';
import { getText } from './name';

export function getTagName(node: ts.JsxElement | ts.JsxSelfClosingElement): string {
  if (ts.isJsxElement(node)) {
    return getText(node.openingElement.tagName);
  }

  if (ts.isJsxSelfClosingElement(node)) {
    return getText(node.tagName);
  }

  throw new Error('Invalid JSX node');
}

export function getAttribute(node: ts.JsxAttributes, name: string): ts.JsxAttribute | undefined {
  return node.properties.find(
    (property): property is ts.JsxAttribute =>
      ts.isJsxAttribute(property) && getAttributeName(property) === name
  );
}

export function getAttributeName(node: ts.JsxAttribute): string {
  return getText(node.name);
}

export function getAttributeValue(node: ts.JsxAttribute | undefined): ts.Expression | undefined {
  if (!node) {
    return;
  }

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

export function getChildOrFragment(node: ts.JsxElement): ts.JsxChild {
  // find all children that are not whitespace
  const nonWhitespaceChildren = node.children.filter(
    child => !ts.isJsxText(child) || !child.containsOnlyTriviaWhiteSpaces
  );

  if (nonWhitespaceChildren.length === 0) {
    return factory.createJsxFragment(
      factory.createJsxOpeningFragment(),
      [],
      factory.createJsxJsxClosingFragment()
    );
  }

  if (nonWhitespaceChildren.length === 1 && ts.isJsxText(nonWhitespaceChildren[0])) {
    return factory.createJsxFragment(
      factory.createJsxOpeningFragment(),
      node.children,
      factory.createJsxJsxClosingFragment()
    );
  }

  // get the children of the <Show> element, if there are more than one then we need to wrap them in a fragment
  return nonWhitespaceChildren.length > 1
    ? factory.createJsxFragment(
        factory.createJsxOpeningFragment(),
        node.children,
        factory.createJsxJsxClosingFragment()
      )
    : nonWhitespaceChildren[0];
}

/**
 * Ensure the quotes are handled in the attribute value
 * @param value The original value of the attribute
 */
export function sanitizeAttribute(value: string): string {
  // replace double quotes with single quotes
  return value.replace(/"/g, "'");
}

/**
 * Remove any surrounding quotes from a string literal
 */
export function stripQuotes(value: string): string {
  return value.replace(/^['"]|['"]$/g, '');
}
