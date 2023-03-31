import { tsquery } from '@phenomnomnominal/tsquery';
import * as ts from 'typescript';
import { AstValidator } from './validators';

/**
 * Find a method by name
 * @param node The class declaration node
 * @param name The method name
 */
export function findMethod(
  node: ts.ClassDeclaration,
  name: string,
  validators: AstValidator[] = []
): ts.MethodDeclaration | undefined {
  const methods = tsquery<ts.MethodDeclaration>(node, `MethodDeclaration[name.name="${name}"]`);

  // run the method through the validators
  return methods.find(method => validators.every(validator => validator(method)));
}

/**
 * Find all methods methods
 * @param node The class declaration node
 */
export function findMethods(
  node: ts.ClassDeclaration,
  validators: AstValidator[] = []
): ts.MethodDeclaration[] {
  const methods = tsquery<ts.MethodDeclaration>(node, 'MethodDeclaration');

  // run all methods through the validators
  return methods.filter(method => validators.every(validator => validator(method)));
}

/**
 * Find all properties with a decorator
 * @param node The class declaration node
 * @param name The decorator name
 */
export function findPropertiesWithDecorator(
  node: ts.ClassDeclaration,
  name: string,
  validators: AstValidator[] = []
): ts.PropertyDeclaration[] {
  const properties = tsquery<ts.PropertyDeclaration>(node, `PropertyDeclaration`).filter(property =>
    hasDecorator(property, name)
  );

  // run all properties through the validators
  return properties.filter(property => validators.every(validator => validator(property)));
}

/**
 * Find all getters with a decorator
 */
export function findGettersWithDecorator(
  node: ts.ClassDeclaration,
  name: string,
  validators: AstValidator[] = []
): ts.GetAccessorDeclaration[] {
  const getters = tsquery<ts.GetAccessorDeclaration>(node, `GetAccessor`).filter(getter =>
    hasDecorator(getter, name)
  );

  // run all getters through the validators
  return getters.filter(getter => validators.every(validator => validator(getter)));
}

/**
 * Find all the classes with a decorator
 * @param node The source file node
 * @param name The decorator name
 */
export function findClassWithDecorator(node: ts.SourceFile, name: string): ts.ClassDeclaration[] {
  const classes = tsquery<ts.ClassDeclaration>(node, `ClassDeclaration`);

  return classes.filter(node => hasDecorator(node, name));
}

/**
 * Find the name of a decorator
 */
export function findDecoratorName(node: ts.Decorator): string {
  return ts.isCallExpression(node.expression) && ts.isIdentifier(node.expression.expression)
    ? node.expression.expression.text
    : '';
}

/**
 * Find decorators on a node
 * @param node The node
 */
export function findDecorators(node: ts.Node): readonly ts.Decorator[] {
  return ts.canHaveDecorators(node) ? ts.getDecorators(node) ?? [] : [];
}

/**
 * Find a decorator with a specific name
 * @param node The node
 * @param name The decorator name
 */
export function findDecorator(node: ts.Node, name: string): ts.Decorator | undefined {
  return findDecorators(node).find(decorator => findDecoratorName(decorator) === name);
}

/**
 * Check if a node has a decorator
 * @param node The node
 * @param name The decorator name
 */
export function hasDecorator(node: ts.Node, name: string): boolean {
  return findDecorator(node, name) !== undefined;
}

/**
 * Find the render method
 * @param node The class declaration node
 */
export function findRenderMethod(node: ts.ClassDeclaration): ts.MethodDeclaration | undefined {
  return tsquery<ts.MethodDeclaration>(node, 'MethodDeclaration[name.name="render"]')[0];
}

/**
 * Find the value returned by the render method. The value might be a JSX element or a JSX fragment.
 * Any other value will throw an error.
 * @param node The class declaration node
 */
export function findTemplate(node: ts.ClassDeclaration): ts.JsxElement | ts.JsxFragment {
  const renderMethod = findRenderMethod(node);
  if (!renderMethod) {
    throw new Error('A component class must contain a render method');
  }

  const returnStatement = tsquery<ts.ReturnStatement>(renderMethod, 'ReturnStatement')[0];

  if (
    !returnStatement ||
    !returnStatement.expression ||
    (!ts.isJsxElement(returnStatement.expression) && !ts.isJsxFragment(returnStatement.expression))
  ) {
    throw new Error('The render method must return a JSX element or a JSX fragment');
  }

  return returnStatement.expression;
}

/**
 * Find slots in the template
 */
export function findSlots(node: ts.ClassDeclaration): ts.JsxElement[] {
  const template = findTemplate(node);
  return tsquery<ts.JsxElement>(template, 'JsxElement[name.name="slot"]');
}

/**
 * Find slots names in the template. Slots names are the value of the `name` attribute.
 * Slots without a name will be identified as `default`.
 * @param node The class declaration node
 */
export function findSlotNames(node: ts.ClassDeclaration): string[] {
  const slots = findSlots(node);
  return slots.map(slot => {
    const nameAttribute = tsquery<ts.JsxAttribute>(slot, 'JsxAttribute[name.name="name"]')[0];
    return nameAttribute ? nameAttribute.initializer!.getText() : 'default';
  });
}

/**
 * Find the value of a component decorator property
 * @example
 * @Component({
 *  selector: 'my-component'
 * })
 * @param node The class declaration node
 * @param name The property name
 */
export function findDecoratorPropertyValue(
  node: ts.ClassDeclaration,
  name: string
): ts.Expression | undefined {
  const decorator = findDecorator(node, 'Component');

  if (!decorator) {
    return;
  }

  if (!ts.isCallExpression(decorator.expression)) {
    return;
  }

  const objectLiteral = decorator.expression.arguments[0];
  if (!objectLiteral || !ts.isObjectLiteralExpression(objectLiteral)) {
    return;
  }

  const property = objectLiteral.properties.find(
    property => ts.isPropertyAssignment(property) && property.name.getText() === name
  );
  if (!property) {
    return;
  }

  if (!ts.isPropertyAssignment(property)) {
    return;
  }

  return property.initializer;
}

/**
 * Find the selector of a component
 * @param node The class declaration node
 * @returns The selector value
 */
export function findSelector(node: ts.ClassDeclaration): string | undefined {
  const selector = findDecoratorPropertyValue(node, 'selector');

  if (!selector) {
    return undefined;
  }

  debugger;
  if (ts.isStringLiteral(selector)) {
    return selector.text;
  }

  return selector.getText();
}

/**
 * Find the styles of a component
 * @param node The class declaration node
 * @returns The styles value
 */
export function findStyles(node: ts.ClassDeclaration): string | undefined {
  const styles = findDecoratorPropertyValue(node, 'styles');
  if (!styles) {
    return;
  }

  return styles.getText();
}
