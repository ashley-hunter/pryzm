import type * as ts from 'typescript';

export interface ComponentMetadata {
  props: ts.PropertyDeclaration[];
  properties: ts.PropertyDeclaration[];
  state: ts.PropertyDeclaration[];
  computed: ts.GetAccessorDeclaration[];
  events: ts.PropertyDeclaration[];
  methods: ts.MethodDeclaration[];
  refs: ts.PropertyDeclaration[];
}
