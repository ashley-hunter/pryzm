import { getPropertyName, getPropertyType, isPropertyReadonly } from '@pryzm/ast-utils';
import * as ts from 'typescript';
import { ComponentMetadata } from '../parser/component-metadata';
import { parseFile } from '../parser/parser';
import { ImportHandler } from '../utils/imports-handler';

export type TransformerContext = {
  data: Map<string, unknown>;
  importHandler: ImportHandler;
};

type TransformerFn<T extends Transformer, K extends keyof Transformer> = T[K] extends (
  ...args: any
) => any
  ? ReturnType<T[K]>
  : any;

export type TransformerResult<T extends Transformer> = {
  props: TransformerFn<T, 'Prop'>[];
  states: TransformerFn<T, 'State'>[];
  computed: TransformerFn<T, 'Computed'>[];
  events: TransformerFn<T, 'Event'>[];
  methods: TransformerFn<T, 'Method'>[];
  onInit?: TransformerFn<T, 'OnInit'>;
  onDestroy?: TransformerFn<T, 'OnDestroy'>;
  refs: TransformerFn<T, 'Ref'>[];
  providers: TransformerFn<T, 'Provider'>[];
  injects: TransformerFn<T, 'Inject'>[];
  template: TransformerFn<T, 'Template'>;
  imports: ts.ImportDeclaration[];
  slots: TransformerFn<T, 'Slots'>[];
  styles: string;
  name: string;
};

export interface Transformer {
  Prop?: (metadata: PropertyTransformerMetadata, context: TransformerContext) => any;
  State?: (metadata: PropertyTransformerMetadata, context: TransformerContext) => any;
  Method?: (metadata: MethodTransformerMetadata, context: TransformerContext) => any;
  OnInit?: (metadata: MethodTransformerMetadata, context: TransformerContext) => any;
  OnDestroy?: (metadata: MethodTransformerMetadata, context: TransformerContext) => any;
  Event?: (value: ts.PropertyDeclaration, context: TransformerContext) => any;
  Ref?: (value: ts.PropertyDeclaration, context: TransformerContext) => any;
  Computed?: (value: ts.GetAccessorDeclaration, context: TransformerContext) => any;
  Provider?: (value: ts.PropertyDeclaration, context: TransformerContext) => any;
  Inject?: (value: ts.PropertyDeclaration, context: TransformerContext) => any;
  Template?: (
    value: ts.JsxFragment | ts.JsxElement | ts.JsxSelfClosingElement,
    styles: string,
    context: TransformerContext
  ) => any;
  Slots?: (slot: string, context: TransformerContext) => any;
  Styles?: (value: string, context: TransformerContext) => any;
  PreTransform?: (metadata: ComponentMetadata, context: TransformerContext) => void;
  PostTransform?: (
    metadata: TransformerResult<Transformer>,
    context: TransformerContext
  ) => TransformerResult<Transformer>;
}

export function transform<T extends Transformer>(
  source: string,
  transformer: T
): TransformerResult<T> {
  const components = parseFile(source);

  if (components.length === 0) {
    throw new Error('No components found');
  }

  if (components.length > 1) {
    throw new Error('Multiple components found');
  }

  const context: TransformerContext = {
    data: new Map(),
    importHandler: new ImportHandler(),
  };

  const metadata = components[0];

  transformer.PreTransform?.(metadata, context);
  let styles = transformer.Styles?.(metadata.styles, context) ?? metadata.styles;

  // remove any new line characters from styles
  styles = styles.replace(/(\r\n|\n|\r)/gm, '');

  const props = metadata.props.map(prop => {
    const metadata: PropertyTransformerMetadata = {
      name: getPropertyName(prop),
      type: getPropertyType(prop),
      isReadonly: isPropertyReadonly(prop),
      initializer: prop.initializer,
      node: prop,
    };

    return transformer.Prop?.(metadata, context) ?? prop;
  });
  const states = metadata.state.map(state => {
    const metadata: PropertyTransformerMetadata = {
      name: getPropertyName(state),
      type: getPropertyType(state),
      isReadonly: isPropertyReadonly(state),
      initializer: state.initializer,
      node: state,
    };

    return transformer.State?.(metadata, context) ?? state;
  });
  const computed = metadata.computed.map(
    computed => transformer.Computed?.(computed, context) ?? computed
  );
  const events = metadata.events.map(event => transformer.Event?.(event, context) ?? event);
  const methods = metadata.methods.map(method => {
    const metadata: MethodTransformerMetadata = {
      name: getPropertyName(method),
      returnType: method.type,
      parameters: method.parameters,
      body: method.body,
      node: method,
    };

    return transformer.Method?.(metadata, context) ?? method;
  });

  const onInit = metadata.onInit
    ? transformer.OnInit?.(
        {
          name: 'onInit',
          returnType: metadata.onInit.type,
          parameters: metadata.onInit.parameters,
          body: metadata.onInit.body,
          node: metadata.onInit,
        },
        context
      ) ?? metadata.onInit
    : undefined;

  const onDestroy = metadata.onDestroy
    ? transformer.OnDestroy?.(
        {
          name: 'onDestroy',
          returnType: metadata.onDestroy.type,
          parameters: metadata.onDestroy.parameters,
          body: metadata.onDestroy.body,
          node: metadata.onDestroy,
        },
        context
      ) ?? metadata.onDestroy
    : undefined;

  const refs = metadata.refs.map(ref => transformer.Ref?.(ref, context) ?? ref);
  const providers = metadata.providers.map(
    provider => transformer.Provider?.(provider, context) ?? provider
  );
  const injects = metadata.injects.map(inject => transformer.Inject?.(inject, context) ?? inject);
  const slots = metadata.slots.map(slot => transformer.Slots?.(slot, context) ?? slot);
  const template = transformer.Template?.(metadata.template, styles, context) ?? metadata.template;

  const result: TransformerResult<Transformer> = {
    ...metadata,
    props,
    states,
    computed,
    events,
    methods,
    onInit,
    onDestroy,
    refs,
    providers,
    injects,
    styles,
    template,
    slots,
    imports: context.importHandler.getImportNodes(),
  };

  return transformer.PostTransform ? transformer.PostTransform(result, context) : result;
}

export interface PropertyTransformerMetadata {
  name: string;
  type?: ts.TypeNode;
  isReadonly: boolean;
  initializer?: ts.Expression;
  node: ts.PropertyDeclaration;
}

export interface MethodTransformerMetadata {
  name: string;
  returnType?: ts.TypeNode;
  parameters: ts.NodeArray<ts.ParameterDeclaration>;
  body?: ts.Block;
  node: ts.MethodDeclaration;
}
