import { stripParentNode } from '@pryzm/ast-utils';
import * as ts from 'typescript';

export interface TemplateTransformer<
  TElement,
  TFragment,
  TAttribute,
  TText,
  TExpression,
  TSelfClosing = TElement
> {
  Element: (
    value: ts.JsxElement,
    attributes: TAttribute[],
    children: (TElement | TFragment | TSelfClosing | TText | TExpression)[]
  ) => TElement;
  SelfClosingElement: (value: ts.JsxSelfClosingElement, attributes: TAttribute[]) => TSelfClosing;
  Fragment: (
    value: ts.JsxFragment,
    children: (TElement | TFragment | TSelfClosing | TText | TExpression)[]
  ) => TFragment;
  Attribute: (value: ts.JsxAttribute) => TAttribute;
  Text: (value: ts.JsxText) => TText;
  Expression: (value: ts.JsxExpression) => TExpression;
}

export function transformTemplate<
  TElement,
  TFragment,
  TAttribute,
  TText,
  TExpression,
  TSelfClosing = TElement
>(
  value: ts.JsxFragment | ts.JsxElement | ts.JsxSelfClosingElement,
  transformer: TemplateTransformer<
    TElement,
    TFragment,
    TAttribute,
    TText,
    TExpression,
    TSelfClosing
  >
) {
  const visitor = new TemplateVisitor(transformer);

  return visitor.visit(stripParentNode(value));
}

export class TemplateVisitor<
  TElement,
  TFragment,
  TAttribute,
  TText,
  TExpression,
  TSelfClosing = TElement
> {
  constructor(
    private transformer: TemplateTransformer<
      TElement,
      TFragment,
      TAttribute,
      TText,
      TExpression,
      TSelfClosing
    >
  ) {}

  visit(value: JsxNode): TText | TElement | TFragment | TSelfClosing | TExpression {
    if (ts.isJsxText(value)) {
      return this.visitText(value);
    }

    if (ts.isJsxElement(value)) {
      return this.visitElement(value);
    }

    if (ts.isJsxSelfClosingElement(value)) {
      return this.visitSelfClosingElement(value);
    }

    if (ts.isJsxFragment(value)) {
      return this.visitFragment(value);
    }

    if (ts.isJsxExpression(value)) {
      return this.visitExpression(value);
    }

    throw new Error('Unknown node type');
  }

  visitText(value: ts.JsxText) {
    return this.transformer.Text(value);
  }

  visitElement(value: ts.JsxElement) {
    const attributes = value.openingElement.attributes.properties.map(
      this.visitAttribute.bind(this)
    );
    const children = value.children.map(this.visit.bind(this));
    return this.transformer.Element(value, attributes, children);
  }

  visitSelfClosingElement(value: ts.JsxSelfClosingElement) {
    const attributes = value.attributes.properties.map(this.visitAttribute.bind(this));
    return this.transformer.SelfClosingElement(value, attributes);
  }

  visitFragment(value: ts.JsxFragment) {
    const children = value.children.map(this.visit.bind(this));
    return this.transformer.Fragment(value, children);
  }

  visitAttribute(value: ts.JsxAttributeLike) {
    if (ts.isJsxSpreadAttribute(value)) {
      throw new Error('Spread attributes are not supported as they cannot be statically analyzed');
    }

    return this.transformer.Attribute(value);
  }

  visitChildren(value: ts.NodeArray<ts.JsxChild>) {
    return value.map(this.visit.bind(this));
  }

  visitAttributes(value: ts.NodeArray<ts.JsxAttributeLike>) {
    return value.map(this.visitAttribute.bind(this));
  }

  visitExpression(value: ts.JsxExpression): TExpression {
    return this.transformer.Expression(value);
  }
}

type JsxNode =
  | ts.JsxText
  | ts.JsxExpression
  | ts.JsxElement
  | ts.JsxSelfClosingElement
  | ts.JsxFragment;