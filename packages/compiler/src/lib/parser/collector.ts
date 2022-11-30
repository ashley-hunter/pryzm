import * as ts from 'typescript';
import { ComponentMetadata } from './component-metadata';

export function collectMetadata(code: string): ComponentMetadata[] {
  const ast = ts.createSourceFile('', code, ts.ScriptTarget.Latest, true);
  const components = findComponents(ast);

  return components.map(collectComponentMetadata);
}

function findComponents(ast: ts.Node): ts.ClassDeclaration[] {
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
  component: ts.ClassDeclaration
): ComponentMetadata {
  return {
    props: findPropertiesWithDecorator(component, 'Prop'),
    state: findPropertiesWithDecorator(component, 'State'),
    computed: findAccessorsWithDecorator(component, 'Computed'),
    events: findPropertiesWithDecorator(component, 'Event'),
    refs: findPropertiesWithDecorator(component, 'Ref'),
    methods: findMethods(component),
    properties: findPropertiesWithoutDecorator(component),
  };
}

function findPropertiesWithDecorator(
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
        `Cannot use @${decoratorName} on a getter. Use a property instead.`
      );
    }

    // find any set accessor that has a Prop decorator and report an error
    if (ts.isSetAccessor(node) && hasDecorator(node, decoratorName)) {
      throw new Error(
        `Cannot use @${decoratorName} on a setter. Use a property instead.`
      );
    }

    ts.forEachChild(node, visitor);
  };

  ts.forEachChild(component, visitor);

  return properties;
}

function findAccessorsWithDecorator(
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
        `Cannot use @${decoratorName} on a setter, use a getter instead.`
      );
    }

    if (ts.isPropertyDeclaration(node) && hasDecorator(node, decoratorName)) {
      throw new Error(
        `Cannot use @${decoratorName} on a property, use a getter instead.`
      );
    }

    ts.forEachChild(node, visitor);
  };

  ts.forEachChild(component, visitor);

  return accessors;
}

function findMethods(component: ts.ClassDeclaration): ts.MethodDeclaration[] {
  // find all methods that are not getters or setters
  const methods: ts.MethodDeclaration[] = [];

  const visitor = (node: ts.Node) => {
    if (ts.isMethodDeclaration(node)) {
      methods.push(node);
    }

    ts.forEachChild(node, visitor);
  };

  ts.forEachChild(component, visitor);

  return methods;
}

function findPropertiesWithoutDecorator(
  component: ts.ClassDeclaration
): ts.PropertyDeclaration[] {
  const properties: ts.PropertyDeclaration[] = [];

  const visitor = (node: ts.Node) => {
    if (ts.isPropertyDeclaration(node) && !hasAnyDecorator(node)) {
      // if the property has a decorator, skip it
      properties.push(node);
    }

    // throw an error if there are any get or set accessors without a decorator
    if (ts.isGetAccessor(node) && !hasAnyDecorator(node)) {
      throw new Error(`Cannot use a getter without a @Computed decorator.`);
    }

    if (ts.isSetAccessor(node) && !hasAnyDecorator(node)) {
      throw new Error(`Setters are not supported.`);
    }

    ts.forEachChild(node, visitor);
  };

  ts.forEachChild(component, visitor);

  return properties;
}

function hasDecorator(
  node: ts.ClassDeclaration | ts.PropertyLikeDeclaration,
  decoratorName: string
): boolean {
  for (const modifier of node.modifiers ?? []) {
    if (
      ts.isDecorator(modifier) &&
      ts.isIdentifier(modifier.expression) &&
      modifier.expression.text === decoratorName
    ) {
      return true;
    }
  }

  return false;
}

function hasAnyDecorator(
  node: ts.ClassDeclaration | ts.PropertyLikeDeclaration
): boolean {
  return ['Prop', 'State', 'Event', 'Ref', 'Computed'].some((d) =>
    hasDecorator(node, d)
  );
}
