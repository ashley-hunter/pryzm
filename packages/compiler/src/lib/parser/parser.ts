import { tsquery } from '@phenomnomnominal/tsquery';
import { getDecorator, getDecoratorProperty, getPropertyName, getText } from '@pryzm/ast-utils';
import * as ts from 'typescript';
import { toLowerCamelCase } from '../utils/names';
import { ComponentMetadata, Injection } from './component-metadata';

export function parseFile(code: string): ComponentMetadata[] {
  const sourceFile = tsquery.ast(code, undefined, ts.ScriptKind.TSX);

  return parseSourceFile(sourceFile);
}

export function parseSourceFile(sourceFile: ts.SourceFile): ComponentMetadata[] {
  const components = getComponents(sourceFile);

  return components.map(component => collectComponentMetadata(sourceFile, component));
}

function getComponents(ast: ts.Node): ts.ClassDeclaration[] {
  // find all the nodes that are classes with a Component decorator
  const classes = tsquery(
    ast,
    'ClassDeclaration:has(Decorator:has(CallExpression[expression.name="Component"]))'
  ) as ts.ClassDeclaration[];

  return classes;
}

function collectComponentMetadata(
  sourceFile: ts.SourceFile,
  component: ts.ClassDeclaration
): ComponentMetadata {
  // pre collect checks - fail fast
  ensureNoStaticMembers(component);
  ensureNoUndecoratedProperties(component);

  const methods = getMethods(component);
  const lifecycleMethods = ['onInit', 'onDestroy'];

  const metadata: ComponentMetadata = {
    imports: tsquery<ts.ImportDeclaration>(sourceFile, 'ImportDeclaration'),
    name: getComponentName(component),
    props: getPropertiesWithDecorator(component, 'Prop'),
    state: getPropertiesWithDecorator(component, 'State'),
    computed: getAccessorsWithDecorator(component, 'Computed'),
    events: getPropertiesWithDecorator(component, 'Event'),
    refs: getPropertiesWithDecorator(component, 'Ref'),
    providers: getProviders(component),
    injects: getInjects(component),
    methods: methods.filter(method => !lifecycleMethods.includes(method.name.getText())),
    onInit: methods.find(method => method.name.getText() === 'onInit'),
    onDestroy: methods.find(method => method.name.getText() === 'onDestroy'),
    template: getTemplate(component),
    styles: getStyles(component),
    selector: getSelector(component),
    slots: getSlots(component),
  };

  // post collect checks
  ensureFieldsAreReadonly(metadata);
  ensureNoPrivateMembers(metadata);
  ensureNoPublicMethods(metadata);
  ensureFieldsAreInitialized(metadata);
  ensureEventsAreInitialized(metadata);
  ensureEventsArePrefixed(metadata);

  return metadata;
}

function getComponentName(component: ts.ClassDeclaration): string {
  // if the class doesn't have a name, throw an error
  if (!component.name) {
    throw new Error('Component class must have a name');
  }

  return getText(component.name);
}

function getPropertiesWithDecorator(
  component: ts.ClassDeclaration,
  decoratorName: string
): ts.PropertyDeclaration[] {
  // find all the nodes that are properties with a Prop decorator
  const properties = tsquery<ts.PropertyDeclaration>(
    component,
    `PropertyDeclaration:has(Decorator:has(CallExpression[expression.name="${decoratorName}"]))`
  );

  // find any get accessor that has a Prop decorator and report an error
  const getters = tsquery<ts.GetAccessorDeclaration>(
    component,
    `GetAccessor:has(Decorator:has(CallExpression[expression.name="${decoratorName}"]))`
  );

  if (getters.length > 0) {
    throw new Error(`Cannot use @${decoratorName}() on a getter. Use a property instead.`);
  }

  // find any set accessor that has a Prop decorator and report an error
  const setters = tsquery<ts.SetAccessorDeclaration>(
    component,
    `SetAccessor:has(Decorator:has(CallExpression[expression.name="${decoratorName}"]))`
  );

  if (setters.length > 0) {
    throw new Error(`Cannot use @${decoratorName}() on a setter. Use a property instead.`);
  }

  return properties;
}

function getAccessorsWithDecorator(
  component: ts.ClassDeclaration,
  decoratorName: string
): ts.GetAccessorDeclaration[] {
  // find all the nodes that are properties with a Prop decorator
  const accessors = tsquery<ts.GetAccessorDeclaration>(
    component,
    `GetAccessor:has(Decorator:has(CallExpression[expression.name="${decoratorName}"]))`
  );

  // find any property that has the decorator and report an error
  const properties = tsquery<ts.PropertyDeclaration>(
    component,
    `PropertyDeclaration:has(Decorator:has(CallExpression[expression.name="${decoratorName}"]))`
  );

  if (properties.length > 0) {
    throw new Error(`Cannot use @${decoratorName}() on a property. Use a getter instead.`);
  }

  // find any set accessor that has the decorator and report an error
  const setters = tsquery<ts.SetAccessorDeclaration>(
    component,
    `SetAccessor:has(Decorator:has(CallExpression[expression.name="${decoratorName}"]))`
  );

  if (setters.length > 0) {
    throw new Error(`Cannot use @${decoratorName}() on a setter. Use a getter instead.`);
  }

  // if any getter has anything except a return statement, report an error
  accessors.forEach(accessor => {
    const body = accessor.body;

    if (!body) {
      return;
    }

    if (body.statements.length !== 1) {
      throw new Error(`@${decoratorName}() getter must have a single return statement.`);
    }

    const statement = body.statements[0];

    if (!ts.isReturnStatement(statement)) {
      throw new Error(`@${decoratorName}() getter must have a single return statement.`);
    }
  });

  return accessors;
}

function getMethods(component: ts.ClassDeclaration): ts.MethodDeclaration[] {
  // find all methods except the render method
  const methods = tsquery<ts.MethodDeclaration>(
    component,
    'MethodDeclaration:not([name.name="render"])'
  );

  // we want to sort the methods so that any functions that rely on other functions are defined after the functions they rely on
  // this is because we are going to generate the methods as strings and then concatenate them together
  // if we don't sort them, we might get a reference error in frameworks like React where functions are defined as variables
  methods.sort((a, b) => {
    const aName = a.name.getText();
    const bName = b.name.getText();

    // if a calls b, then a should come after b
    if (callsMethod(a, bName)) {
      return 1;
    }

    // if b calls a, then b should come after a
    if (callsMethod(b, aName)) {
      return -1;
    }

    // if neither call the other, then they can be in any order
    return 0;
  });

  return methods;
}

/**
 * Returns true if the method calls the specified method name
 * @param method The method body to search
 * @param methodName The name of the method to search for
 */
function callsMethod(method: ts.MethodDeclaration, methodName: string): boolean {
  // find all the nodes that are a call expression
  const callExpressions = tsquery<ts.CallExpression>(method, 'CallExpression');

  // find all the call expressions that are calling the specified method
  const calls = callExpressions.filter(call => {
    // get the name of the method being called
    // if the method is a property access expression, then the name is the property name
    // if the method is a simple identifier, then the name is the identifier name
    const name = ts.isPropertyAccessExpression(call.expression)
      ? call.expression.name.getText()
      : call.expression.getText();

    return name === methodName;
  });

  return calls.length > 0;
}

function getSelector(component: ts.ClassDeclaration): string | undefined {
  // find the component decorator on the component class and extract the value of the selector property
  const componentDecorator = getDecorator(component, 'Component');

  if (!componentDecorator) {
    return undefined;
  }

  const selectorProperty = getDecoratorProperty(componentDecorator, 'selector');

  if (!selectorProperty || !ts.isPropertyAssignment(selectorProperty)) {
    return undefined;
  }

  if (ts.isStringLiteral(selectorProperty.initializer)) {
    return selectorProperty.initializer.text;
  }

  throw new Error(`Invalid selector value for component ${getComponentName(component)}`);
}

function getProviders(component: ts.ClassDeclaration): ts.Identifier[] {
  // find the component decorator on the component class and extract the value of the providers property
  const componentDecorator = getDecorator(component, 'Component');

  if (!componentDecorator) {
    return [];
  }

  const providersProperty = getDecoratorProperty(componentDecorator, 'providers');

  if (!providersProperty || !ts.isPropertyAssignment(providersProperty)) {
    return [];
  }

  if (!ts.isArrayLiteralExpression(providersProperty.initializer)) {
    throw new Error(`Invalid providers value for component ${getComponentName(component)}`);
  }

  return providersProperty.initializer.elements.filter(ts.isIdentifier);
}

function getInjects(component: ts.ClassDeclaration): Injection[] {
  // find all the nodes that are a property with a Inject decorator
  const properties = getPropertiesWithDecorator(component, 'Inject');

  // get the providers so we can check if the inject is using a provider defined this class
  const providers = getProviders(component);

  return properties.map(property => {
    // ensure the name is an identifier
    if (!ts.isIdentifier(property.name)) {
      throw new Error(`Invalid inject name for component ${getComponentName(component)}`);
    }

    // get the type which will be the name of the provider
    let type: ts.Identifier | undefined;

    if (
      property.type &&
      ts.isTypeReferenceNode(property.type) &&
      ts.isIdentifier(property.type.typeName)
    ) {
      type = property.type.typeName;
    } else {
      throw new Error(`Invalid inject type for component ${getComponentName(component)}`);
    }

    return {
      identifier: property.name,
      property,
      provider: type,
      self: providers.some(provider => provider.getText() === type!.getText()),
    };
  });
}

function getStyles(component: ts.ClassDeclaration): string {
  // find the component decorator on the component class and extract the value of the styles property
  const componentDecorator = getDecorator(component, 'Component');

  if (!componentDecorator) {
    return '';
  }

  const stylesProperty = getDecoratorProperty(componentDecorator, 'styles');

  if (!stylesProperty || !ts.isPropertyAssignment(stylesProperty)) {
    return '';
  }

  if (
    ts.isStringLiteral(stylesProperty.initializer) ||
    ts.isNoSubstitutionTemplateLiteral(stylesProperty.initializer)
  ) {
    return stylesProperty.initializer.text;
  }

  return '';
}

function getSlots(component: ts.ClassDeclaration): string[] {
  // find all jsx elements or self closing elements that have a tag name of "slot"
  const slots = tsquery<ts.JsxElement | ts.JsxSelfClosingElement>(
    component,
    'JsxElement > JsxOpeningElement:has(JsxOpeningElement > Identifier[name="slot"]), JsxSelfClosingElement:has(Identifier[name="slot"])'
  );

  return slots.map(slot => {
    // find the name attribute on the slot element using tsquery
    const nameAttr = tsquery<ts.JsxAttribute>(slot, 'JsxAttribute:has(Identifier[name="name"])')[0];

    // if the name attribute exists, return the value of the name attribute
    if (nameAttr && nameAttr.initializer && ts.isStringLiteral(nameAttr.initializer)) {
      return toLowerCamelCase(nameAttr.initializer.text);
    }

    // otherwise return the default slot
    return 'default';
  });
}

function getTemplate(
  component: ts.ClassDeclaration
): ts.JsxFragment | ts.JsxElement | ts.JsxSelfClosingElement {
  // find the render method
  let renderMethod: ts.MethodDeclaration | undefined;

  const visitor = (node: ts.Node) => {
    if (ts.isMethodDeclaration(node) && getText(node.name) === 'render') {
      renderMethod = node;
    }

    ts.forEachChild(node, visitor);
  };

  ts.forEachChild(component, visitor);

  if (!renderMethod) {
    throw new Error('Component class must have a render method');
  }

  // ensure the render method does not have any parameters
  if (renderMethod.parameters.length > 0) {
    throw new Error('Render method cannot have parameters');
  }

  // ensure the render method only has a return statement
  if (renderMethod.body && renderMethod.body.statements.length !== 1) {
    throw new Error('Render method must only contain a return statement');
  }

  // get the return statement
  const returnStatement = renderMethod.body!.statements[0] as ts.ReturnStatement;

  // get the return value
  let returnValue = returnStatement.expression;

  // if there is no return value, then throw an error
  if (!returnValue) {
    throw new Error('Render method must return a JSX element or fragment');
  }

  // if the return value is a parenthesized expression, then get the inner expression
  if (ts.isParenthesizedExpression(returnValue)) {
    returnValue = returnValue.expression;
  }

  // the return value must be a JSX element or fragment or throw an error
  if (
    !ts.isJsxElement(returnValue) &&
    !ts.isJsxSelfClosingElement(returnValue) &&
    !ts.isJsxFragment(returnValue)
  ) {
    throw new Error('Render method must return a JSX element or fragment');
  }

  return returnValue;
}

function hasDecorator(
  node: ts.ClassDeclaration | ts.PropertyLikeDeclaration,
  decoratorName: string
): boolean {
  // if the decorator exists, then return true
  return !!getDecorator(node, decoratorName);
}

function hasAnyDecorator(node: ts.ClassDeclaration | ts.PropertyLikeDeclaration): boolean {
  return ['Prop', 'State', 'Event', 'Computed', 'Ref', 'Provider', 'Inject'].some(decorator =>
    hasDecorator(node, decorator)
  );
}

function ensureNoStaticMembers(component: ts.ClassDeclaration): void {
  // use tsquery to find all static properties and methods
  const staticProperties = tsquery(component, 'PropertyDeclaration > StaticKeyword');

  if (staticProperties.length > 0) {
    throw new Error('Static properties are not supported');
  }

  const staticMethods = tsquery(component, 'MethodDeclaration > StaticKeyword');

  if (staticMethods.length > 0) {
    throw new Error('Static methods are not supported');
  }
}

function ensureNoUndecoratedProperties(component: ts.ClassDeclaration): void {
  // find all properties and accessors that do not have a decorator
  const undecoratedProperties = tsquery<ts.PropertyLikeDeclaration>(
    component,
    'PropertyDeclaration, GetAccessor, SetAccessor'
  );

  if (undecoratedProperties.filter(prop => !hasAnyDecorator(prop)).length > 0) {
    throw new Error(
      `All properties and accessors must be decorated with @Prop(), @State(), @Event(), @Computed(), @Provider(), @Inject() or @Ref().`
    );
  }
}

function ensureNoPrivateMembers(metadata: ComponentMetadata): void {
  // check that all props are public (i.e. not private or protected)

  metadata.props.forEach(prop => {
    if (prop.modifiers?.some(m => m.kind === ts.SyntaxKind.PrivateKeyword)) {
      throw new Error(`Prop "${getText(prop.name)}" cannot be private`);
    }

    if (prop.modifiers?.some(m => m.kind === ts.SyntaxKind.ProtectedKeyword)) {
      throw new Error(`Prop "${getText(prop.name)}" cannot be protected`);
    }
  });

  metadata.events.forEach(event => {
    if (event.modifiers?.some(m => m.kind === ts.SyntaxKind.PrivateKeyword)) {
      throw new Error(`Event "${getText(event.name)}" cannot be private`);
    }

    if (event.modifiers?.some(m => m.kind === ts.SyntaxKind.ProtectedKeyword)) {
      throw new Error(`Event "${getText(event.name)}" cannot be protected`);
    }
  });
}

function ensureFieldsAreInitialized(metadata: ComponentMetadata): void {
  // check that all events are of type EventEmitter
  metadata.events.forEach(event => {
    // ensure the property is initialized as a new EventEmitter
    if (
      !event.initializer ||
      !ts.isNewExpression(event.initializer) ||
      !ts.isIdentifier(event.initializer.expression) ||
      event.initializer.expression.text !== 'EventEmitter'
    ) {
      throw new Error(`Event "${event.name}" must be initialized as a new EventEmitter`);
    }
  });
}

function ensureFieldsAreReadonly(metadata: ComponentMetadata): void {
  // check that all props are readonly
  metadata.props.forEach(prop => {
    if (!prop.modifiers?.some(m => m.kind === ts.SyntaxKind.ReadonlyKeyword)) {
      throw new Error(`Prop "${getText(prop.name)}" must be readonly`);
    }
  });

  // ensure that events are readonly
  metadata.events.forEach(event => {
    if (!event.modifiers?.some(m => m.kind === ts.SyntaxKind.ReadonlyKeyword)) {
      throw new Error(`Event "${getText(event.name)}" must be readonly`);
    }
  });

  // ensure the dependencies are readonly
  metadata.injects.forEach(inject => {
    const dependency = inject.property;
    if (!dependency.modifiers?.some(m => m.kind === ts.SyntaxKind.ReadonlyKeyword)) {
      throw new Error(`Dependency "${getText(dependency.name)}" must be readonly`);
    }
  });
}

function ensureEventsAreInitialized(metadata: ComponentMetadata): void {
  // check that all events are initialized as new EventEmitter
  metadata.events.forEach(event => {
    if (
      !event.initializer ||
      !ts.isNewExpression(event.initializer) ||
      !ts.isIdentifier(event.initializer.expression) ||
      event.initializer.expression.text !== 'EventEmitter'
    ) {
      throw new Error(`Event "${getText(event.name)}" must be initialized as a new EventEmitter`);
    }
  });
}

function ensureEventsArePrefixed(metadata: ComponentMetadata): void {
  // check that all events are prefixed with "on"
  metadata.events.forEach(event => {
    if (!getPropertyName(event).startsWith('on')) {
      throw new Error(`Event "${getText(event.name)}" must be prefixed with "on"`);
    }
  });
}

function ensureNoPublicMethods(metadata: ComponentMetadata): void {
  // check that all methods are private
  metadata.methods.forEach(method => {
    if (!method.modifiers || !method.modifiers.find(m => m.kind === ts.SyntaxKind.PrivateKeyword)) {
      throw new Error(`Method "${getText(method.name)}" must be private`);
    }
  });
}
