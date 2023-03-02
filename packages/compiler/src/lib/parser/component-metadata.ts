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
  providers: ts.PropertyDeclaration[];
  injects: ts.PropertyDeclaration[];
  template: ts.JsxFragment | ts.JsxElement | ts.JsxSelfClosingElement;
  imports: ts.ImportDeclaration[];
  slots: string[];
  styles: string;
}
