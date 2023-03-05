import {
  extractComment,
  getPropertyName,
  getPropertyType,
  isPropertyReadonly,
} from '@pryzm/ast-utils';
import * as ts from 'typescript';
import { ComponentMetadata } from '../parser/component-metadata';
import { parseFile } from '../parser/parser';
import { ImportHandler } from '../utils/imports-handler';

export type TransformerContext = {
  data: Map<string, unknown>;
  importHandler: ImportHandler;
};

export type TransformerOutput<T> = T extends Transformer<
  infer TPropReturn,
  infer TStateReturn,
  infer TComputedReturn,
  infer TEventReturn,
  infer TRefReturn,
  infer TMethodReturn,
  infer TOnInitReturn,
  infer TOnDestroyReturn,
  infer TProviderReturn,
  infer TInjectReturn,
  infer TTemplateReturn,
  infer TSlotReturn
>
  ? {
      props: TPropReturn[];
      states: TStateReturn[];
      computed: TComputedReturn[];
      events: TEventReturn[];
      refs: TRefReturn[];
      methods: TMethodReturn[];
      onInit?: TOnInitReturn;
      onDestroy?: TOnDestroyReturn;
      providers: TProviderReturn[];
      injects: TInjectReturn[];
      template: TTemplateReturn;
      slots: TSlotReturn[];
      imports: ts.ImportDeclaration[];
      styles: string;
      name: string;
      selector: string | undefined;
    }
  : never;

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
  Ref: (metadata: RefTransformerMetadata, context: TransformerContext) => TRefReturn;
  Computed: (matadata: ComputedTransformerMetadata, context: TransformerContext) => TComputedReturn;
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

export function createTransformer<T extends Transformer>(transformer: T) {
  return transformer;
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
    return (
      transformer.Prop?.(
        {
          name: getPropertyName(prop),
          type: getPropertyType(prop, true),
          isReadonly: isPropertyReadonly(prop),
          initializer: prop.initializer,
          node: prop,
          comment: extractComment(prop),
        },
        context
      ) ?? prop
    );
  });
  const states = metadata.state.map(state => {
    return (
      transformer.State?.(
        {
          name: getPropertyName(state),
          type: getPropertyType(state),
          isReadonly: isPropertyReadonly(state),
          initializer: state.initializer,
          node: state,
          comment: extractComment(state),
        },
        context
      ) ?? state
    );
  });
  const computed = metadata.computed.map(
    computed =>
      transformer.Computed?.(
        {
          name: getPropertyName(computed),
          body: computed.body!,
          node: computed,
          comment: extractComment(computed),
        },
        context
      ) ?? computed
  );
  const events = metadata.events.map(event => transformer.Event?.(event, context) ?? event);
  const methods = metadata.methods.map(method => {
    return (
      transformer.Method?.(
        {
          name: getPropertyName(method),
          returnType: method.type,
          parameters: method.parameters,
          body: method.body,
          node: method,
          comment: extractComment(method),
        },
        context
      ) ?? method
    );
  });

  const onInit = metadata.onInit
    ? transformer.OnInit?.(
        {
          name: 'onInit',
          returnType: metadata.onInit.type,
          parameters: metadata.onInit.parameters,
          body: metadata.onInit.body,
          node: metadata.onInit,
          comment: extractComment(metadata.onInit),
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
          comment: extractComment(metadata.onDestroy),
        },
        context
      ) ?? metadata.onDestroy
    : undefined;

  const refs = metadata.refs.map(
    ref =>
      transformer.Ref?.(
        {
          name: getPropertyName(ref),
          node: ref,
          type: ref.type,
          initializer: ref.initializer,
          comment: extractComment(ref),
        },
        context
      ) ?? ref
  );
  const providers = metadata.providers.map(
    provider => transformer.Provider?.(provider, context) ?? provider
  );
  const injects = metadata.injects.map(inject => transformer.Inject?.(inject, context) ?? inject);
  const slots = metadata.slots.map(slot => transformer.Slots?.(slot, context) ?? slot);
  const template = transformer.Template?.(metadata.template, styles, context) ?? metadata.template;

  const result = {
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
    template,
    slots,
    styles,
    selector: metadata.selector,
    imports: context.importHandler.getImportNodes(),
  };

  return (
    transformer.PostTransform ? transformer.PostTransform(result, context) : result
  ) as TransformerOutput<T>;
}

export interface PropertyTransformerMetadata {
  name: string;
  type?: ts.TypeNode;
  isReadonly: boolean;
  initializer?: ts.Expression;
  node: ts.PropertyDeclaration;
  comment?: string;
}

export interface MethodTransformerMetadata {
  name: string;
  returnType?: ts.TypeNode;
  parameters: ts.NodeArray<ts.ParameterDeclaration>;
  body?: ts.Block;
  node: ts.MethodDeclaration;
  comment?: string;
}

export interface ComputedTransformerMetadata {
  name: string;
  body: ts.Block;
  node: ts.GetAccessorDeclaration;
  comment?: string;
}

export interface RefTransformerMetadata {
  name: string;
  type?: ts.TypeNode;
  initializer?: ts.Expression;
  node: ts.PropertyDeclaration;
  comment?: string;
}
