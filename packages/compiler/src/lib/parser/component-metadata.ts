import type * as ts from 'typescript';

export interface ComponentMetadata {
  name: string;
  props: ts.PropertyDeclaration[];
  state: ts.PropertyDeclaration[];
  computed: ts.GetAccessorDeclaration[];
  events: ts.PropertyDeclaration[];
  methods: ts.MethodDeclaration[];
  refs: ts.PropertyDeclaration[];
  providers: ts.PropertyDeclaration[];
  injects: ts.PropertyDeclaration[];
  template: ts.JsxElement | ts.JsxFragment | ts.JsxSelfClosingElement;
  imports: ts.ImportDeclaration[];
}
