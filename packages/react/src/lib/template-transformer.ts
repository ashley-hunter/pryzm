import { getAttribute, getAttributeValue, getChildOrFragment, stripThis } from '@pryzm/ast-utils';
import { TemplateTransformer } from '@pryzm/compiler';
import * as ts from 'typescript';
import { factory } from 'typescript';

export const templateTransformer: TemplateTransformer<
  ts.JsxElement,
  ts.JsxFragment,
  ts.JsxAttribute,
  ts.JsxText,
  ts.JsxExpression,
  ts.JsxExpression,
  ts.JsxExpression,
  ts.JsxSelfClosingElement
> = {
  Element: (value, attributes, children, context) => {
    const id = context.data.get('id') as string | undefined;

    return factory.createJsxElement(
      factory.createJsxOpeningElement(
        value.openingElement.tagName,
        value.openingElement.typeArguments,
        factory.createJsxAttributes(
          id
            ? [...attributes, factory.createJsxAttribute(factory.createIdentifier(id), undefined)]
            : attributes
        )
      ),
      children,
      value.closingElement
    );
  },
  SelfClosingElement: (value, attributes, context) => {
    const id = context.data.get('id') as string | undefined;

    return factory.createJsxSelfClosingElement(
      value.tagName,
      value.typeArguments,
      factory.createJsxAttributes(
        id
          ? [...attributes, factory.createJsxAttribute(factory.createIdentifier(id), undefined)]
          : attributes
      )
    );
  },
  Slot: name => {
    if (name === 'default') {
      name = 'children';
    }

    return factory.createJsxExpression(undefined, factory.createIdentifier(name));
  },
  Fragment: (value, children) =>
    factory.createJsxFragment(
      factory.createJsxOpeningFragment(),
      children,
      factory.createJsxJsxClosingFragment()
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
        return factory.createJsxAttribute(
          factory.createIdentifier('className'),
          factory.createJsxExpression(
            undefined,
            factory.createCallExpression(factory.createIdentifier('clsx'), undefined, [
              stripThis(value.initializer.expression)!,
            ])
          )
        );
      }

      // otherwise simply rename the attribute
      return factory.createJsxAttribute(
        factory.createIdentifier('className'),
        stripThis(value.initializer)
      );
    }

    // otherwise if the attribute value is an expression, we need to strip the "this" keyword
    if (value.initializer && ts.isJsxExpression(value.initializer)) {
      return factory.createJsxAttribute(value.name, stripThis(value.initializer));
    }

    return value;
  },
  Show: node => {
    const condition = getAttribute(node.openingElement.attributes, 'when');

    if (!condition) {
      throw new Error('Missing "when" attribute on <Show> element');
    }

    const when = getAttributeValue(condition);

    // check that the condition is an expression
    if (!when) {
      throw new Error('The "when" attribute on <Show> element must be an expression');
    }

    const child = getChildOrFragment(node);

    return factory.createJsxExpression(
      undefined,
      factory.createBinaryExpression(
        stripThis(when)!,
        factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
        child as ts.JsxExpression
      )
    );
  },
  Expression: value => stripThis(value)!,
  Text: value => value,
};
