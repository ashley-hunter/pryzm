import * as ts from 'typescript';

export interface ComponentMetadata {
  /**
   * Store the file path
   */
  readonly path: string;
  /**
   * Store the component name
   */
  readonly name: string;
  /**
   * Store the component selector
   */
  readonly selector: string | undefined;
  /**
   * Store the component template
   */
  readonly template: ts.JsxElement | ts.JsxFragment;
  /**
   * Store the component styles
   */
  readonly styles: string | undefined;
  /**
   * Store the component props
   */
  readonly props: ts.PropertyDeclaration[];
  /**
   * Store the component events
   */
  readonly events: ts.PropertyDeclaration[];
  /**
   * Store the component methods
   */
  readonly methods: ts.MethodDeclaration[];
  /**
   * Store the component state
   */
  readonly state: ts.PropertyDeclaration[];
  /**
   * Store the component computed
   */
  readonly computed: ts.GetAccessorDeclaration[];
  /**
   * Store the component context
   */
  readonly context: ts.PropertyDeclaration[];
  /**
   * Store the component refs
   */
  readonly refs: ts.PropertyDeclaration[];
  /**
   * Store the component providers
   */
  readonly providers: ts.PropertyDeclaration[];
  /**
   * Store the component init lifecycle hook
   */
  readonly onInit?: ts.MethodDeclaration;
  /**
   * Store the component destroy lifecycle hook
   */
  readonly onDestroy?: ts.MethodDeclaration;
  /**
   * Store the component slots
   */
  readonly slots: string[];
}
