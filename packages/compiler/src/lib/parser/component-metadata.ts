import type * as ts from 'typescript';

export interface ComponentMetadata {
  name: string;
  props: ts.PropertyDeclaration[];
  state: ts.PropertyDeclaration[];
  computed: ts.GetAccessorDeclaration[];
  events: ts.PropertyDeclaration[];
  methods: ts.MethodDeclaration[];
  onInit?: ts.MethodDeclaration;
  onDestroy?: ts.MethodDeclaration;
  refs: ts.PropertyDeclaration[];
  providers: ts.Identifier[];
  injects: Injection[];
  template: ts.JsxFragment | ts.JsxElement | ts.JsxSelfClosingElement;
  imports: ts.ImportDeclaration[];
  slots: string[];
  styles: string;
  selector: string | undefined;
  leadingNodes: ts.Node[];
  trailingNodes: ts.Node[];
}

export interface Injection {
  /** The property that is being injected */
  property: ts.PropertyDeclaration;
  /** The name of the dependency */
  identifier: ts.Identifier;
  /** The name of the provider */
  provider: ts.Identifier;
  /** Determine if this dependency is provided on this component rather than a parent */
  self: boolean;
}
