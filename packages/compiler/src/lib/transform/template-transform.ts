import {
  getAttribute,
  getAttributeName,
  getAttributeValue,
  getTagName,
  getText,
  stripParentNode,
} from '@pryzm/ast-utils';
import * as ts from 'typescript';
import { TransformerContext } from './transformer';

export interface TemplateTransformer {
  Element: (
    metadata: {
      node: ts.JsxElement;
      tagName: string;
      attributes: string[];
      children: string;
    },
    context: TransformerContext
  ) => string;
  SelfClosingElement: (
    metadata: {
      tagName: string;
      node: ts.JsxSelfClosingElement;
      attributes: string[];
    },
    context: TransformerContext
  ) => string;
  Slot(name: string, context: TransformerContext): string;
  Fragment: (value: ts.JsxFragment, children: string, context: TransformerContext) => string;
  Attribute: (
    metadata: { name: string; value: ts.Expression | undefined; node: ts.JsxAttribute },
    context: TransformerContext
  ) => string;
  Ref?: (value: ts.JsxAttribute, context: TransformerContext) => string;
  Text: (value: ts.JsxText, context: TransformerContext) => string;
  Expression: (value: ts.JsxExpression, context: TransformerContext) => string;
  Show: (
    metadata: { node: ts.JsxElement; children: string; fallback?: string; when: ts.Expression },
    context: TransformerContext
  ) => string;
  Class: (name: string, context: TransformerContext) => string;
  ConditionalClasses: (
    metadata: {
      classes: Record<string, ts.Expression>;
      node: ts.ObjectLiteralExpression;
    },
    context: TransformerContext
  ) => string;
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

  visitElement(node: ts.JsxElement) {
    const tagName = getTagName(node);

    // if the element is a slot, we need to transform it into a slot element
    if (tagName === 'slot') {
      return this.visitSlot(node.openingElement);
    }

    const attributes = node.openingElement.attributes.properties.map(
      this.visitAttribute.bind(this)
    );
    const children = node.children.map(this.visit.bind(this)).join('');

    // if the element is a show, we need to transform it into a show element
    if (tagName === 'Show') {
      return this.visitShow(node, children);
    }

    return this.transformer.Element({ node, attributes, children, tagName }, this.context);
  }

  visitSelfClosingElement(node: ts.JsxSelfClosingElement) {
    const tagName = getTagName(node);

    // if the element is a slot, we need to transform it into a slot element
    if (tagName === 'slot') {
      return this.visitSlot(node);
    }

    const attributes = node.attributes.properties.map(this.visitAttribute.bind(this));
    return this.transformer.SelfClosingElement({ tagName, node, attributes }, this.context);
  }

  visitFragment(value: ts.JsxFragment) {
    const children = value.children.map(this.visit.bind(this)).join('');
    return this.transformer.Fragment(value, children, this.context);
  }

  visitAttribute(node: ts.JsxAttributeLike): string {
    if (ts.isJsxSpreadAttribute(node)) {
      throw new Error('Spread attributes are not supported as they cannot be statically analyzed');
    }

    if (getAttributeName(node) === 'class') {
      this.visitClass(node);
    }

    if (getAttributeName(node) === 'ref' && this.transformer.Ref) {
      return this.visitRef(node);
    }

    const name = getAttributeName(node);
    const value = getAttributeValue(node);

    return this.transformer.Attribute({ node, name, value }, this.context);
  }

  visitClass(node: ts.JsxAttribute) {
    const classValue = getAttributeValue(node);

    if (!classValue) {
      return '';
    }

    if (ts.isStringLiteral(classValue)) {
      return this.transformer.Class(classValue.text, this.context);
    }

    if (ts.isObjectLiteralExpression(classValue)) {
      const classes: Record<string, ts.Expression> = {};

      classValue.properties.forEach(p => {
        if (ts.isPropertyAssignment(p)) {
          const name = getText(p.name);

          if (name) {
            classes[name] = p.initializer;
          }
        }
      });

      return this.visitConditionalClasses(classes, classValue);
    }

    throw new Error('Invalid class attribute');
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

  visitShow(node: ts.JsxElement, children: string): string {
    const condition = getAttribute(node.openingElement.attributes, 'when');

    if (!condition) {
      throw new Error('Missing "when" attribute on <Show> element');
    }

    const when = getAttributeValue(condition);

    // check that the condition is an expression
    if (!when) {
      throw new Error('The "when" attribute on <Show> element must be an expression');
    }

    const fallbackAttr = getAttribute(node.openingElement.attributes, 'fallback');

    let fallback: string | undefined;

    if (fallbackAttr) {
      const fallbackValue = getAttributeValue(fallbackAttr);

      if (!fallbackValue) {
        throw new Error('Fallback attribute must have a value');
      }

      if (
        !ts.isJsxElement(fallbackValue) &&
        !ts.isJsxSelfClosingElement(fallbackValue) &&
        !ts.isJsxFragment(fallbackValue)
      ) {
        throw new Error('Fallback attribute must be a JSX element');
      }

      fallback = this.visit(fallbackValue!);
    }

    return this.transformer.Show({ node, children, when, fallback }, this.context);
  }

  visitConditionalClasses(
    classes: Record<string, ts.Expression>,
    node: ts.ObjectLiteralExpression
  ): string {
    return this.transformer.ConditionalClasses({ classes, node }, this.context);
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
