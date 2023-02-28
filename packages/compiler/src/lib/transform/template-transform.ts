import { stripParentNode } from '@pryzm/ast-utils';
import * as ts from 'typescript';
import { TransformerContext } from './transformer';

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
    children: (TElement | TFragment | TSelfClosing | TText | TExpression)[],
    context: TransformerContext
  ) => TElement;
  SelfClosingElement: (
    value: ts.JsxSelfClosingElement,
    attributes: TAttribute[],
    context: TransformerContext
  ) => TSelfClosing;
  Fragment: (
    value: ts.JsxFragment,
    children: (TElement | TFragment | TSelfClosing | TText | TExpression)[],
    context: TransformerContext
  ) => TFragment;
  Attribute: (value: ts.JsxAttribute, context: TransformerContext) => TAttribute;
  Ref?: (value: ts.JsxAttribute, context: TransformerContext) => TAttribute;
  Text: (value: ts.JsxText, context: TransformerContext) => TText;
  Expression: (value: ts.JsxExpression, context: TransformerContext) => TExpression;
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
  >,
  context: TransformerContext
) {
  const visitor = new TemplateVisitor(transformer, context);

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
    >,
    private context: TransformerContext
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
    return this.transformer.Text(value, this.context);
  }

  visitElement(value: ts.JsxElement) {
    const attributes = value.openingElement.attributes.properties.map(
      this.visitAttribute.bind(this)
    );
    const children = value.children.map(this.visit.bind(this));
    return this.transformer.Element(value, attributes, children, this.context);
  }

  visitSelfClosingElement(value: ts.JsxSelfClosingElement) {
    const attributes = value.attributes.properties.map(this.visitAttribute.bind(this));
    return this.transformer.SelfClosingElement(value, attributes, this.context);
  }

  visitFragment(value: ts.JsxFragment) {
    const children = value.children.map(this.visit.bind(this));
    return this.transformer.Fragment(value, children, this.context);
  }

  visitAttribute(value: ts.JsxAttributeLike): TAttribute {
    if (ts.isJsxSpreadAttribute(value)) {
      throw new Error('Spread attributes are not supported as they cannot be statically analyzed');
    }

    if (value.name.escapedText === 'ref' && this.transformer.Ref) {
      return this.visitRef(value);
    }

    return this.transformer.Attribute(value, this.context);
  }

  visitChildren(value: ts.NodeArray<ts.JsxChild>) {
    return value.map(this.visit.bind(this));
  }

  visitExpression(value: ts.JsxExpression): TExpression {
    return this.transformer.Expression(value, this.context);
  }

  visitRef(attribute: ts.JsxAttribute): TAttribute {
    return this.transformer.Ref!(attribute, this.context);
  }
}

type JsxNode =
  | ts.JsxText
  | ts.JsxExpression
  | ts.JsxElement
  | ts.JsxSelfClosingElement
  | ts.JsxFragment;
