import { TemplateTransformer } from '@pryzm/compiler';
import * as ts from 'typescript';

export const templateTransformer: TemplateTransformer<
  ts.JsxElement,
  ts.JsxFragment,
  ts.JsxAttribute,
  ts.JsxExpression,
  ts.JsxText,
  ts.JsxSelfClosingElement
> = {
  Element: (value, attributes, children) => {
    return ts.factory.createJsxElement(
      value.openingElement,
      children,
      value.closingElement
    );
  },
  SelfClosingElement: (value, attributes) =>
    ts.factory.createJsxSelfClosingElement(
      value.tagName,
      value.typeArguments,
      ts.factory.createJsxAttributes(attributes)
    ),
  Fragment: (value, children) =>
    ts.factory.createJsxFragment(
      ts.factory.createJsxOpeningFragment(),
      children,
      ts.factory.createJsxJsxClosingFragment()
    ),
  Attribute: (value) => {
    // if the attribute is called "class", we need to rename it to "className"
    if (ts.isIdentifier(value.name) && value.name.escapedText === 'class') {
      return ts.factory.createJsxAttribute(
        ts.factory.createIdentifier('className'),
        value.initializer
      );
    }

    return value;
  },
  Expression: (value) => value,
  Text: (value) => value,
};
