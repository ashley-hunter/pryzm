import {
  getAttribute,
  getAttributeName,
  getAttributeValue,
  getChildOrFragment,
  getTagName,
  printNode,
  stripThis,
} from '@pryzm/ast-utils';
import { TemplateTransformer } from '@pryzm/compiler';
import * as ts from 'typescript';

export const templateTransformer: TemplateTransformer = {
  Element: (value, attributes, children, context) => {
    const id = context.data.get('id') ?? '';

    const tagName = getTagName(value);

    return `<${tagName} ${id} ${attributes.join(' ')}>${children.join('\n')}</${tagName}>`;
  },
  SelfClosingElement: (value, attributes, context) => {
    const id = context.data.get('id') ?? '';

    const tagName = getTagName(value);

    return `<${tagName} ${id} ${attributes.join(' ')} />`;
  },
  Slot: name => {
    return `{${name === 'default' ? 'children' : name}}`;
  },
  Fragment: (value, children) => {
    return `<>${children.join('\n')}</>`;
  },
  Attribute: value => {
    let attributeName = getAttributeName(value);
    const attributeValue = getAttributeValue(value);

    // if the attribute is called "class", we need to rename it to "className"
    if (attributeName === 'class') {
      attributeName = 'className';
    }

    // ensure the name is in camelCase
    attributeName = attributeName.replace(/-([a-z])/g, g => g[1].toUpperCase());

    // if the attribute value is a string literal, we can just print it
    if (attributeValue && ts.isStringLiteral(attributeValue)) {
      return `${attributeName}="${attributeValue.text}"`;
    }

    return `${attributeName}={${printNode(stripThis(attributeValue)!)}}`;
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

    return `{ ${printNode(stripThis(when)!)} && ${printNode(child)} }`;

    // return factory.createJsxExpression(
    //   undefined,
    //   factory.createBinaryExpression(
    //     stripThis(when)!,
    //     factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
    //     child as ts.JsxExpression
    //   )
    // );
  },
  Expression: value => printNode(stripThis(value)!),
  Text: value => value.text,
};
