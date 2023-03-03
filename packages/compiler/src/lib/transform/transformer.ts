import { getPropertyName, getPropertyType, isPropertyReadonly } from '@pryzm/ast-utils';
import * as ts from 'typescript';
import { ComponentMetadata } from '../parser/component-metadata';
import { parseFile } from '../parser/parser';
import { ImportHandler } from '../utils/imports-handler';

export type TransformerContext = {
  data: Map<string, unknown>;
  importHandler: ImportHandler;
};

export type TransformerOutput<T extends Transformer> = {
  props: T extends Transformer<infer TPropReturn> ? TPropReturn[] : never;
  states: T extends Transformer<any, infer TStateReturn> ? TStateReturn[] : never;
  computed: T extends Transformer<any, any, infer TComputedReturn> ? TComputedReturn[] : never;
  events: T extends Transformer<any, any, any, infer TEventReturn> ? TEventReturn[] : never;
  refs: T extends Transformer<any, any, any, any, infer TRefReturn> ? TRefReturn[] : never;
  methods: T extends Transformer<any, any, any, any, any, infer TMethodReturn>
    ? TMethodReturn[]
    : never;
  onInit?: T extends Transformer<any, any, any, any, any, any, infer TOnInitReturn>
    ? TOnInitReturn
    : never;
  onDestroy?: T extends Transformer<any, any, any, any, any, any, any, infer TOnDestroyReturn>
    ? TOnDestroyReturn
    : never;
  providers: T extends Transformer<any, any, any, any, any, any, any, any, infer TProviderReturn>
    ? TProviderReturn[]
    : never;
  injects: T extends Transformer<any, any, any, any, any, any, any, any, any, infer TInjectReturn>
    ? TInjectReturn[]
    : never;
  template: T extends Transformer<
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    infer TTemplateReturn
  >
    ? TTemplateReturn
    : never;
  slots: T extends Transformer<
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    infer TSlotsReturn
  >
    ? TSlotsReturn[]
    : never;
  imports: ts.ImportDeclaration[];
  styles: string;
  name: string;
  selector: string | undefined;
};

export interface Transformer<
  TPropReturn = any,
  TStateReturn = any,
  TComputedReturn = any,
  TEventReturn = any,
  TRefReturn = any,
  TMethodReturn = any,
  TOnInitReturn = any,
  TOnDestroyReturn = any,
  TProviderReturn = any,
  TInjectReturn = any,
  TTemplateReturn = any,
  TSlotsReturn = any
> {
  Prop: (metadata: PropertyTransformerMetadata, context: TransformerContext) => TPropReturn;
  State: (metadata: PropertyTransformerMetadata, context: TransformerContext) => TStateReturn;
  Method: (metadata: MethodTransformerMetadata, context: TransformerContext) => TMethodReturn;
  OnInit: (metadata: MethodTransformerMetadata, context: TransformerContext) => TOnInitReturn;
  OnDestroy: (metadata: MethodTransformerMetadata, context: TransformerContext) => TOnDestroyReturn;
  Event: (value: ts.PropertyDeclaration, context: TransformerContext) => TEventReturn;
  Ref: (value: ts.PropertyDeclaration, context: TransformerContext) => TRefReturn;
  Computed: (value: ts.GetAccessorDeclaration, context: TransformerContext) => TComputedReturn;
  Provider: (value: ts.PropertyDeclaration, context: TransformerContext) => TProviderReturn;
  Inject: (value: ts.PropertyDeclaration, context: TransformerContext) => TInjectReturn;
  Template: (
    value: ts.JsxFragment | ts.JsxElement | ts.JsxSelfClosingElement,
    styles: string,
    context: TransformerContext
  ) => TTemplateReturn;
  Slots?: (slot: string, context: TransformerContext) => TSlotsReturn;
  Styles?: (value: string, context: TransformerContext) => string;
  PreTransform?: (metadata: ComponentMetadata, context: TransformerContext) => void;
  PostTransform?: (
    metadata: TransformerOutput<
      Transformer<
        TPropReturn,
        TStateReturn,
        TComputedReturn,
        TEventReturn,
        TRefReturn,
        TMethodReturn,
        TOnInitReturn,
        TOnDestroyReturn,
        TProviderReturn,
        TInjectReturn,
        TTemplateReturn,
        TSlotsReturn
      >
    >,
    context: TransformerContext
  ) => TransformerOutput<
    Transformer<
      TPropReturn,
      TStateReturn,
      TComputedReturn,
      TEventReturn,
      TRefReturn,
      TMethodReturn,
      TOnInitReturn,
      TOnDestroyReturn,
      TProviderReturn,
      TInjectReturn,
      TTemplateReturn,
      TSlotsReturn
    >
  >;
}

export function transform<T extends Transformer>(
  source: string,
  transformer: T
): TransformerOutput<T> {
  const components = parseFile(source);

  if (components.length === 0) {
    throw new Error('No components found');
  }

  if (components.length > 1) {
    throw new Error('Multiple components found');
  }

  const context: TransformerContext = {
    data: new Map(),
    importHandler: new ImportHandler(components[0].imports),
  };

  const metadata = components[0];

  transformer.PreTransform?.(metadata, context);
  let styles = transformer.Styles?.(metadata.styles, context) ?? metadata.styles;

  // remove any new line characters from styles
  styles = styles.replace(/(\r\n|\n|\r)/gm, '');

  const props = metadata.props.map(prop => {
    const metadata: PropertyTransformerMetadata = {
      name: getPropertyName(prop),
      type: getPropertyType(prop, true),
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

  const result: TransformerOutput<T> = {
    ...metadata,
    props: props as TransformerOutput<T>['props'],
    states: states as TransformerOutput<T>['states'],
    computed: computed as TransformerOutput<T>['computed'],
    events: events as TransformerOutput<T>['events'],
    methods: methods as TransformerOutput<T>['methods'],
    onInit,
    onDestroy,
    refs: refs as TransformerOutput<T>['refs'],
    providers: providers as TransformerOutput<T>['providers'],
    injects: injects as TransformerOutput<T>['injects'],
    template: template as TransformerOutput<T>['template'],
    slots: slots as TransformerOutput<T>['slots'],
    styles,
    selector: metadata.selector,
    imports: context.importHandler.getImportNodes(),
  };

  return transformer.PostTransform ? transformer.PostTransform(result, context) : result;
}

export type StringTransformer = Transformer<
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string
>;

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
