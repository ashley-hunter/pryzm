import { getText } from '@pryzm/ast-utils';
import * as ts from 'typescript';
import { ComponentMetadata } from './component-metadata';

export function parseFile(code: string): ComponentMetadata[] {
  const sourceFile = ts.createSourceFile(
    '',
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  return parseSourceFile(sourceFile);
}

export function parseSourceFile(
  sourceFile: ts.SourceFile
): ComponentMetadata[] {
  const components = getComponents(sourceFile);

  return components.map((component) =>
    collectComponentMetadata(sourceFile, component)
  );
}

function getComponents(ast: ts.Node): ts.ClassDeclaration[] {
  // find all the nodes that are classes with a Component decorator
  const classes: ts.ClassDeclaration[] = [];

  const visitor = (node: ts.Node) => {
    if (ts.isClassDeclaration(node) && hasDecorator(node, 'Component')) {
      classes.push(node);
    }

    ts.forEachChild(node, visitor);
  };

  ts.forEachChild(ast, visitor);

  return classes;
}

function collectComponentMetadata(
  sourceFile: ts.SourceFile,
  component: ts.ClassDeclaration
): ComponentMetadata {
  // pre collect checks - fail fast
  ensureNoStaticMembers(component);
  ensureNoUndecoratedProperties(component);

  const metadata: ComponentMetadata = {
    imports: getImports(sourceFile),
    name: getComponentName(component),
    props: getPropertiesWithDecorator(component, 'Prop'),
    state: getPropertiesWithDecorator(component, 'State'),
    computed: getAccessorsWithDecorator(component, 'Computed'),
    events: getPropertiesWithDecorator(component, 'Event'),
    refs: getPropertiesWithDecorator(component, 'Ref'),
    providers: getPropertiesWithDecorator(component, 'Provider'),
    injects: getPropertiesWithDecorator(component, 'Inject'),
    methods: getMethods(component),
    template: getTemplate(component),
  };

  // post collect checks
  ensureFieldsAreReadonly(metadata);
  ensureNoPrivateMembers(metadata);
  ensureFieldsAreInitialized(metadata);

  return metadata;
}

function getComponentName(component: ts.ClassDeclaration): string {
  // if the class doesn't have a name, throw an error
  if (!component.name) {
    throw new Error('Component class must have a name');
  }

  return getText(component.name);
}

function getImports(sourceFile: ts.SourceFile): ts.ImportDeclaration[] {
  const imports: ts.ImportDeclaration[] = [];

  const visitor = (node: ts.Node) => {
    if (ts.isImportDeclaration(node)) {
      imports.push(node);
    }

    ts.forEachChild(node, visitor);
  };

  ts.forEachChild(sourceFile, visitor);

  return imports;
}

function getPropertiesWithDecorator(
  component: ts.ClassDeclaration,
  decoratorName: string
): ts.PropertyDeclaration[] {
  // find all the nodes that are properties with a Prop decorator
  const properties: ts.PropertyDeclaration[] = [];

  const visitor = (node: ts.Node) => {
    if (ts.isPropertyDeclaration(node) && hasDecorator(node, decoratorName)) {
      properties.push(node);
    }

    // find any get accessor that has a Prop decorator and report an error
    if (ts.isGetAccessor(node) && hasDecorator(node, decoratorName)) {
      throw new Error(
        `Cannot use @${decoratorName}() on a getter. Use a property instead.`
      );
    }

    // find any set accessor that has a Prop decorator and report an error
    if (ts.isSetAccessor(node) && hasDecorator(node, decoratorName)) {
      throw new Error(
        `Cannot use @${decoratorName}() on a setter. Use a property instead.`
      );
    }

    ts.forEachChild(node, visitor);
  };

  ts.forEachChild(component, visitor);

  return properties;
}

function getAccessorsWithDecorator(
  component: ts.ClassDeclaration,
  decoratorName: string
): ts.GetAccessorDeclaration[] {
  // find all the nodes that are properties with a Prop decorator
  const accessors: ts.GetAccessorDeclaration[] = [];

  const visitor = (node: ts.Node) => {
    if (ts.isGetAccessor(node) && hasDecorator(node, decoratorName)) {
      accessors.push(node);
    }

    if (ts.isSetAccessor(node) && hasDecorator(node, decoratorName)) {
      throw new Error(
        `Cannot use @${decoratorName}() on a setter, use a getter instead.`
      );
    }

    if (ts.isPropertyDeclaration(node) && hasDecorator(node, decoratorName)) {
      throw new Error(
        `Cannot use @${decoratorName}() on a property, use a getter instead.`
      );
    }

    ts.forEachChild(node, visitor);
  };

  ts.forEachChild(component, visitor);

  return accessors;
}

function getMethods(component: ts.ClassDeclaration): ts.MethodDeclaration[] {
  // find all methods that are not getters or setters
  const methods: ts.MethodDeclaration[] = [];

  const visitor = (node: ts.Node) => {
    if (ts.isMethodDeclaration(node)) {
      // if the method name is `render` then skip it
      if (getText(node.name) !== 'render') {
        methods.push(node);
      }
    }

    ts.forEachChild(node, visitor);
  };

  ts.forEachChild(component, visitor);

  return methods;
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
  const returnStatement = renderMethod.body!
    .statements[0] as ts.ReturnStatement;

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
  for (const modifier of node.modifiers ?? []) {
    if (
      ts.isDecorator(modifier) &&
      ts.isCallExpression(modifier.expression) &&
      ts.isIdentifier(modifier.expression.expression) &&
      modifier.expression.expression.text === decoratorName
    ) {
      return true;
    }
  }

  return false;
}

function hasAnyDecorator(
  node: ts.ClassDeclaration | ts.PropertyLikeDeclaration
): boolean {
  return [
    'Prop',
    'State',
    'Event',
    'Computed',
    'Ref',
    'Provider',
    'Inject',
  ].some((decorator) => hasDecorator(node, decorator));
}

function ensureNoStaticMembers(component: ts.ClassDeclaration): void {
  const visitor = (node: ts.Node) => {
    if (
      ts.isPropertyDeclaration(node) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword)
    ) {
      throw new Error('Static properties are not supported');
    }

    if (
      ts.isMethodDeclaration(node) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword)
    ) {
      throw new Error('Static methods are not supported');
    }

    ts.forEachChild(node, visitor);
  };

  ts.forEachChild(component, visitor);
}

function ensureNoUndecoratedProperties(component: ts.ClassDeclaration): void {
  const visitor = (node: ts.Node) => {
    // if the node is a property or accessor then check that it has a decorator
    if (
      (ts.isPropertyDeclaration(node) ||
        ts.isGetAccessor(node) ||
        ts.isSetAccessor(node)) &&
      !hasAnyDecorator(node)
    ) {
      throw new Error(
        `All properties and accessors must be decorated with @Prop(), @State(), @Event(), @Computed(), @Provider(), @Inject() or @Ref().`
      );
    }

    ts.forEachChild(node, visitor);
  };

  ts.forEachChild(component, visitor);
}

function ensureNoPrivateMembers(metadata: ComponentMetadata): void {
  // check that all props and events are public (i.e. not private or protected)
  metadata.props.forEach((prop) => {
    if (prop.modifiers?.some((m) => m.kind === ts.SyntaxKind.PrivateKeyword)) {
      throw new Error(`Prop "${getText(prop.name)}" cannot be private`);
    }

    if (
      prop.modifiers?.some((m) => m.kind === ts.SyntaxKind.ProtectedKeyword)
    ) {
      throw new Error(`Prop "${getText(prop.name)}" cannot be protected`);
    }
  });

  metadata.events.forEach((event) => {
    if (event.modifiers?.some((m) => m.kind === ts.SyntaxKind.PrivateKeyword)) {
      throw new Error(`Event "${getText(event.name)}" cannot be private`);
    }

    if (
      event.modifiers?.some((m) => m.kind === ts.SyntaxKind.ProtectedKeyword)
    ) {
      throw new Error(`Event "${getText(event.name)}" cannot be protected`);
    }
  });
}

function ensureFieldsAreInitialized(metadata: ComponentMetadata): void {
  // check that all events are of type EventEmitter
  metadata.events.forEach((event) => {
    // ensure the property is initialized as a new EventEmitter
    if (
      !event.initializer ||
      !ts.isNewExpression(event.initializer) ||
      !ts.isIdentifier(event.initializer.expression) ||
      event.initializer.expression.text !== 'EventEmitter'
    ) {
      throw new Error(
        `Event "${event.name}" must be initialized as a new EventEmitter`
      );
    }
  });

  // check that all providers are initialized
  metadata.providers.forEach((provider) => {
    if (!provider.initializer) {
      throw new Error(
        `Provider "${getText(provider.name)}" must be initialized`
      );
    }
  });
}

function ensureFieldsAreReadonly(metadata: ComponentMetadata): void {
  // check that all props are readonly
  metadata.props.forEach((prop) => {
    if (
      !prop.modifiers?.some((m) => m.kind === ts.SyntaxKind.ReadonlyKeyword)
    ) {
      throw new Error(`Prop "${getText(prop.name)}" must be readonly`);
    }
  });

  // ensure that events are readonly
  metadata.events.forEach((event) => {
    if (
      !event.modifiers?.some((m) => m.kind === ts.SyntaxKind.ReadonlyKeyword)
    ) {
      throw new Error(`Event "${getText(event.name)}" must be readonly`);
    }
  });

  // ensure that providers are readonly
  metadata.providers.forEach((provider) => {
    if (
      !provider.modifiers?.some((m) => m.kind === ts.SyntaxKind.ReadonlyKeyword)
    ) {
      throw new Error(`Provider "${getText(provider.name)}" must be readonly`);
    }
  });

  // ensure the dependencies are readonly
  metadata.injects.forEach((dependency) => {
    if (
      !dependency.modifiers?.some(
        (m) => m.kind === ts.SyntaxKind.ReadonlyKeyword
      )
    ) {
      throw new Error(
        `Dependency "${getText(dependency.name)}" must be readonly`
      );
    }
  });
}
