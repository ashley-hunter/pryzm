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
    let name = getAttributeName(attribute);
    const value = getAttributeValue(attribute);

    // if the attribute name starts with `on` then it is an event and we need to convert it to `@`
    // the first letter may then be upper case which we need to convert to lower case
    // e.g `onClick` becomes `@click`
    if (name.startsWith('on')) {
      name = `@${name[2].toLowerCase()}${name.slice(3)}`;
    }

    return `${name}="${printNode(stripThis(value)!)}"`;
  },
  Expression: value => `{{${printNode(stripThis(value.expression)!)}}}`,
  Text: value => value.text,
};
