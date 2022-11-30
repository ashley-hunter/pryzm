import type * as ts from 'typescript';
import { ComponentMetadata } from '../parser/component-metadata';

export class Visitor<
  T extends Record<keyof ComponentMetadata, unknown> = ComponentMetadata
> {
  visitComponent(metadata: ComponentMetadata) {
    const result: Partial<T> = {};

    result.props = metadata.props.map((prop) => this.visitProp(prop, metadata));
    result.state = metadata.state.map((state) =>
      this.visitState(state, metadata)
    );
    result.events = metadata.events.map((event) =>
      this.visitEvent(event, metadata)
    );
    result.methods = metadata.methods.map((method) =>
      this.visitMethod(method, metadata)
    );
    result.computed = metadata.computed.map((computed) =>
      this.visitComputed(computed, metadata)
    );
    result.refs = metadata.refs.map((refs) => this.visitRefs(refs, metadata));
    result.providers = metadata.providers.map((providers) =>
      this.visitProviders(providers, metadata)
    );
    result.dependencies = metadata.dependencies.map((dependencies) =>
      this.visitDependencies(dependencies, metadata)
    );
    result.imports = metadata.imports.map((imports) =>
      this.visitImports(imports, metadata)
    );
    result.template = this.visitTemplate(metadata.template, metadata);
  }

  visitProp(prop: ts.PropertyDeclaration, metadata: ComponentMetadata) {
    return prop;
  }

  visitState(state: ts.PropertyDeclaration, metadata: ComponentMetadata) {
    return state;
  }

  visitEvent(event: ts.PropertyDeclaration, metadata: ComponentMetadata) {
    return event;
  }

  visitComputed(
    computed: ts.GetAccessorDeclaration,
    metadata: ComponentMetadata
  ) {
    return computed;
  }

  visitRefs(refs: ts.PropertyDeclaration, metadata: ComponentMetadata) {
    return refs;
  }

  visitProviders(
    provider: ts.PropertyDeclaration,
    metadata: ComponentMetadata
  ) {
    return provider;
  }

  visitDependencies(
    dependency: ts.PropertyDeclaration,
    metadata: ComponentMetadata
  ) {
    return dependency;
  }

  visitTemplate(
    template: ts.JsxElement | ts.JsxFragment | ts.JsxSelfClosingElement,
    metadata: ComponentMetadata
  ) {
    return template;
  }

  visitImports(imports: ts.ImportDeclaration, metadata: ComponentMetadata) {
    return imports;
  }

  visitMethod(method: ts.MethodDeclaration, metadata: ComponentMetadata) {
    return method;
  }
}
