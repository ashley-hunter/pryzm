import {
  getAttribute,
  getAttributeName,
  getAttributeValue,
  getTagName,
  getText,
  printNode,
  stripParentNode,
} from '@pryzm/ast-utils';
import * as ts from 'typescript';
import { TransformerContext } from './transformer';

export interface TemplateTransformer {
  Element?: (
    metadata: {
      node: ts.JsxElement;
      tagName: string;
      attributes: string;
      children: string;
    },
    context: TransformerContext
  ) => string;
  SelfClosingElement?: (
    metadata: {
      tagName: string;
      node: ts.JsxSelfClosingElement;
      attributes: string;
    },
    context: TransformerContext
  ) => string;
  Slot(name: string, context: TransformerContext): string;
  Fragment?: (value: ts.JsxFragment, children: string, context: TransformerContext) => string;
  Attribute: (
    metadata: {
      name: string;
      value: ts.Expression | undefined;
      node: ts.JsxAttribute;
    },
    context: TransformerContext
  ) => string;
  Event: (
    metadata: {
      name: string;
      value: ts.PropertyAccessExpression;
      node: ts.JsxAttribute;
    },
    context: TransformerContext
  ) => string;
  Ref?: (
    metadata: { node: ts.JsxAttribute; ref: ts.Expression | undefined },
    context: TransformerContext
  ) => string;
  Text?: (value: ts.JsxText, context: TransformerContext) => string;
  Expression: (value: ts.JsxExpression, context: TransformerContext) => string;
  Show: (
    metadata: { node: ts.JsxElement; children: string; fallback?: string; when: ts.Expression },
    context: TransformerContext
  ) => string;
  For: (
    metadata: {
      each: ts.Expression;
      itemName: string;
      indexName?: string;
      children: string;
      key?: string;
      node: ts.JsxElement;
      params: ts.NodeArray<ts.ParameterDeclaration>;
      body: ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment;
      keyNode?: ts.Expression;
    },
    context: TransformerContext
  ) => string;
  Class?: (name: string, context: TransformerContext) => string;
  ConditionalClasses: (
    metadata: {
      classes: Record<string, ts.Expression>;
      node: ts.ObjectLiteralExpression;
    },
    context: TransformerContext
  ) => string;
  Style?: (name: string, context: TransformerContext) => string;
  ConditionalStyles: (
    metadata: {
      styles: Record<string, ts.Expression>;
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
    return this.transformer.Text?.(value, this.context) ?? value.text;
  }

  visitElement(node: ts.JsxElement) {
    const tagName = getTagName(node);

    // if the element is a slot, we need to transform it into a slot element
    if (tagName === 'slot') {
      return this.visitSlot(node.openingElement);
    }

    const attributes = node.openingElement.attributes.properties
      .map(this.visitAttribute.bind(this))
      .join(' ');
    const children = node.children.map(this.visit.bind(this)).join('');

    // if the element is a show, we need to transform it into a show element
    if (tagName === 'Show') {
      return this.visitShow(node, children);
    }

    // if the element is a for, we need to transform it into a for element
    if (tagName === 'For') {
      return this.visitFor(node);
    }

    return (
      this.transformer.Element?.({ node, attributes, children, tagName }, this.context) ??
      `<${tagName} ${attributes}>${children}</${tagName}>`
    );
  }

  visitSelfClosingElement(node: ts.JsxSelfClosingElement) {
    const tagName = getTagName(node);

    // if the element is a slot, we need to transform it into a slot element
    if (tagName === 'slot') {
      return this.visitSlot(node);
    }

    const attributes = node.attributes.properties.map(this.visitAttribute.bind(this)).join(' ');
    return (
      this.transformer.SelfClosingElement?.({ tagName, node, attributes }, this.context) ??
      `<${tagName} ${attributes} />`
    );
  }

  visitFragment(value: ts.JsxFragment) {
    const children = value.children.map(this.visit.bind(this)).join('');
    return this.transformer.Fragment?.(value, children, this.context) ?? children;
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

    if (getAttributeName(node) === 'style') {
      return this.visitStyle(node);
    }

    const name = getAttributeName(node);
    const value = getAttributeValue(node);

    if (name.startsWith('on')) {
      return this.visitEvent(node, name, value);
    }

    return this.transformer.Attribute({ node, name, value }, this.context);
  }

  visitEvent(node: ts.JsxAttribute, name: string, value?: ts.Expression) {
    if (!value) {
      throw new Error(`Event ${name} has no value`);
    }

    if (ts.isPropertyAccessExpression(value)) {
      return this.transformer.Event?.({ node, name, value }, this.context) ?? '';
    }

    throw new Error(`Event ${name} must bind directly to a method`);
  }

  visitClass(node: ts.JsxAttribute) {
    const classValue = getAttributeValue(node);

    if (!classValue) {
      return '';
    }

    if (ts.isStringLiteral(classValue)) {
      return (
        this.transformer.Class?.(classValue.text, this.context) ?? `class="${classValue.text}"`
      );
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

  visitRef(node: ts.JsxAttribute): string {
    return this.transformer.Ref!({ node, ref: getAttributeValue(node) }, this.context);
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

  visitFor(node: ts.JsxElement): string {
    const each = getAttributeValue(getAttribute(node.openingElement.attributes, 'each'));

    // if there is no each attribute, throw an error
    if (!each) {
      throw new Error('Missing "each" attribute on <For> element');
    }

    // find children that are not whitespace
    const nonWhitespaceChildren = node.children.filter(
      child => !(ts.isJsxText(child) && child.containsOnlyTriviaWhiteSpaces)
    );

    // if there is more than one child, throw an error
    if (nonWhitespaceChildren.length > 1) {
      throw new Error('<For> element can only have one child');
    }

    // if the child is not a JSX expression that contains an arrow function, throw an error
    const repeater = nonWhitespaceChildren[0];

    if (!ts.isJsxExpression(repeater)) {
      throw new Error('<For> element can only have one child');
    }

    if (!repeater.expression || !ts.isArrowFunction(repeater.expression)) {
      throw new Error('<For> element must have an arrow function as its child');
    }

    // get the parameters of the arrow function
    const params = repeater.expression.parameters;

    // get the name of the first parameter and use it as the item name
    const itemName = getText(params[0]);

    // if there is a second parameter, use it as the index name
    const indexName = params[1] ? getText(params[1]) : undefined;

    // get the body of the arrow function
    const body = repeater.expression.body;

    // if the body is not a jsx element, a jsx self closing element, or a jsx fragment, throw an error
    if (!ts.isJsxElement(body) && !ts.isJsxSelfClosingElement(body) && !ts.isJsxFragment(body)) {
      throw new Error('The body of the arrow function must be a JSX element');
    }

    // run the body through the transformer
    const children = this.visit(body);

    // find the root element of the body and check if it has a key attribute
    let key: string | undefined;
    let keyNode: ts.Expression | undefined;

    if (ts.isJsxElement(body)) {
      keyNode = getAttributeValue(getAttribute(body.openingElement.attributes, 'key'));
      key = printNode(keyNode);
    } else if (ts.isJsxSelfClosingElement(body)) {
      keyNode = getAttributeValue(getAttribute(body.attributes, 'key'));
      key = printNode(keyNode);
    }

    return this.transformer.For(
      { each, itemName, indexName, children, node, body, params, key, keyNode },
      this.context
    );
  }

  visitConditionalClasses(
    classes: Record<string, ts.Expression>,
    node: ts.ObjectLiteralExpression
  ): string {
    return this.transformer.ConditionalClasses({ classes, node }, this.context);
  }

  visitStyle(node: ts.JsxAttribute): string {
    const styleValue = getAttributeValue(node);

    if (!styleValue) {
      return '';
    }

    if (ts.isStringLiteral(styleValue)) {
      return `style="${styleValue.text}"`;
    }

    if (ts.isObjectLiteralExpression(styleValue)) {
      const styles: Record<string, ts.Expression> = {};

      styleValue.properties.forEach(p => {
        if (ts.isPropertyAssignment(p)) {
          const name = getText(p.name);

          if (name) {
            styles[name] = p.initializer;
          }
        }
      });

      return this.transformer.ConditionalStyles({ styles, node: styleValue }, this.context);
    }

    throw new Error('Invalid style attribute');
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

export function createTemplateTransformer(transformer: TemplateTransformer) {
  return transformer;
}

type JsxNode =
  | ts.JsxText
  | ts.JsxExpression
  | ts.JsxElement
  | ts.JsxSelfClosingElement
  | ts.JsxFragment;
