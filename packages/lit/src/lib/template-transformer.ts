import {
  getAttributeName,
  getAttributeValue,
  getTagName,
  printNode,
  stripThis,
} from '@pryzm/ast-utils';
import { TemplateTransformer } from '@pryzm/compiler';

export const templateTransformer: TemplateTransformer<
  string,
  string,
  string,
  string,
  string,
  string
> = {
  Element: (value, attributes, children) => {
    const tagName = getTagName(value);

    return `<${tagName} ${attributes.join(' ')}>${children.join('\n')}</${tagName}>`;
  },
  SelfClosingElement: (value, attributes) => {
    const tagName = getTagName(value);

    return `<${tagName} ${attributes.join(' ')} />`;
  },
  Fragment: (value, children) => {
    return children.join('\n');
  },
  Attribute: attribute => {
    const name = getAttributeName(attribute);
    const value = getAttributeValue(attribute);

    return `${name}={${printNode(stripThis(value)!)}}`;
  },
  Expression: value => `{${printNode(stripThis(value.expression)!)}}`,
  Text: value => value.text,
};
