import { getTagName, getText, stripParentNode } from '@pryzm/ast-utils';
import * as ts from 'typescript';
import { TransformerContext } from './transformer';

export interface TemplateTransformer {
  Element: (
    value: ts.JsxElement,
    attributes: string[],
    children: string[],
    context: TransformerContext
  ) => string;
  SelfClosingElement: (
    value: ts.JsxSelfClosingElement,
    attributes: string[],
    context: TransformerContext
  ) => string;
  Slot(name: string, context: TransformerContext): string;
  Fragment: (value: ts.JsxFragment, children: string[], context: TransformerContext) => string;
  Attribute: (value: ts.JsxAttribute, context: TransformerContext) => string;
  Ref?: (value: ts.JsxAttribute, context: TransformerContext) => string;
  Text: (value: ts.JsxText, context: TransformerContext) => string;
  Expression: (value: ts.JsxExpression, context: TransformerContext) => string;
  Show: (value: ts.JsxElement, children: string[], context: TransformerContext) => string;
}

export function transformTemplate(
  value: ts.JsxFragment | ts.JsxElement | ts.JsxSelfClosingElement,
  transformer: TemplateTransformer,
  context: TransformerContext
) {
  const visitor = new TemplateVisitor(transformer, context);

  return visitor.visit(stripParentNode(value));
}

export class TemplateVisitor {
  constructor(private transformer: TemplateTransformer, private context: TransformerContext) {}

  visit(value: JsxNode): string {
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
    // if the element is a slot, we need to transform it into a slot element
    if (getTagName(value) === 'slot') {
      return this.visitSlot(value.openingElement);
    }

    const attributes = value.openingElement.attributes.properties.map(
      this.visitAttribute.bind(this)
    );
    const children = value.children.map(this.visit.bind(this));

    // if the element is a show, we need to transform it into a show element
    if (getTagName(value) === 'Show') {
      return this.visitShow(value, children);
    }

    return this.transformer.Element(value, attributes, children, this.context);
  }

  visitSelfClosingElement(value: ts.JsxSelfClosingElement) {
    // if the element is a slot, we need to transform it into a slot element
    if (getTagName(value) === 'slot') {
      return this.visitSlot(value);
    }

    const attributes = value.attributes.properties.map(this.visitAttribute.bind(this));
    return this.transformer.SelfClosingElement(value, attributes, this.context);
  }

  visitFragment(value: ts.JsxFragment) {
    const children = value.children.map(this.visit.bind(this));
    return this.transformer.Fragment(value, children, this.context);
  }

  visitAttribute(value: ts.JsxAttributeLike): string {
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

  visitExpression(value: ts.JsxExpression): string {
    return this.transformer.Expression(value, this.context);
  }

  visitRef(attribute: ts.JsxAttribute): string {
    return this.transformer.Ref!(attribute, this.context);
  }

  visitShow(value: ts.JsxElement, children: string[]): string {
    return this.transformer.Show(value, children, this.context);
  }

  visitSlot(node: ts.JsxOpeningElement | ts.JsxSelfClosingElement): string {
    const name = node.attributes.properties
      .filter(ts.isJsxAttribute)
      .find(a => getText(a.name) === 'name')?.initializer;

    if (name && ts.isStringLiteral(name)) {
      return this.transformer.Slot(name.text, this.context);
    }

    return this.transformer.Slot('default', this.context);
  }
}

type JsxNode =
  | ts.JsxText
  | ts.JsxExpression
  | ts.JsxElement
  | ts.JsxSelfClosingElement
  | ts.JsxFragment;
