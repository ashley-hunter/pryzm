import { stripThis } from '@pryzm/ast-utils';
import { TemplateTransformer } from '@pryzm/compiler';
import * as ts from 'typescript';

export const templateTransformer: TemplateTransformer<
  ts.JsxElement,
  ts.JsxFragment,
  ts.JsxAttribute,
  ts.JsxText,
  ts.JsxExpression,
  ts.JsxSelfClosingElement
> = {
  Element: (value, attributes, children, context) => {
    const id = context.data.get('id') as string | undefined;

    return ts.factory.createJsxElement(
      ts.factory.createJsxOpeningElement(
        value.openingElement.tagName,
        value.openingElement.typeArguments,
        ts.factory.createJsxAttributes(
          id
            ? [
                ...attributes,
                ts.factory.createJsxAttribute(ts.factory.createIdentifier(id), undefined),
              ]
            : attributes
        )
      ),
      children,
      value.closingElement
    );
  },
  SelfClosingElement: (value, attributes, context) => {
    const id = context.data.get('id') as string | undefined;

    return ts.factory.createJsxSelfClosingElement(
      value.tagName,
      value.typeArguments,
      ts.factory.createJsxAttributes(
        id
          ? [
              ...attributes,
              ts.factory.createJsxAttribute(ts.factory.createIdentifier(id), undefined),
            ]
          : attributes
      )
    );
  },
  Fragment: (value, children) =>
    ts.factory.createJsxFragment(
      ts.factory.createJsxOpeningFragment(),
      children,
      ts.factory.createJsxJsxClosingFragment()
    ),
  Attribute: value => {
    // if the attribute is called "class", we need to rename it to "className"
    if (ts.isIdentifier(value.name) && value.name.escapedText === 'class') {
      // if the attribute value is an object then we want to wrap it in a call to the "clsx" function
      if (
        value.initializer &&
        ts.isJsxExpression(value.initializer) &&
        value.initializer.expression &&
        ts.isObjectLiteralExpression(value.initializer.expression)
      ) {
        return ts.factory.createJsxAttribute(
          ts.factory.createIdentifier('className'),
          ts.factory.createJsxExpression(
            undefined,
            ts.factory.createCallExpression(ts.factory.createIdentifier('clsx'), undefined, [
              stripThis(value.initializer.expression)!,
            ])
          )
        );
      }

      // otherwise simply rename the attribute
      return ts.factory.createJsxAttribute(
        ts.factory.createIdentifier('className'),
        stripThis(value.initializer)
      );
    }

    // otherwise if the attribute value is an expression, we need to strip the "this" keyword
    if (value.initializer && ts.isJsxExpression(value.initializer)) {
      return ts.factory.createJsxAttribute(value.name, stripThis(value.initializer));
    }

    return value;
  },
  Expression: value => stripThis(value)!,
  Text: value => value,
};
