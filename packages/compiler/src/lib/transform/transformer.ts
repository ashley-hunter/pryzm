import * as ts from 'typescript';
import { parseFile } from '../parser/parser';

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
  refs: TransformerFn<T, 'Ref'>[];
  providers: TransformerFn<T, 'Provider'>[];
  injects: TransformerFn<T, 'Inject'>[];
  template: TransformerFn<T, 'Template'>;
  imports: ts.ImportDeclaration[];
  name: string;
};

export interface Transformer {
  Prop?: (value: ts.PropertyDeclaration) => any;
  State?: (value: ts.PropertyDeclaration) => any;
  Method?: (value: ts.MethodDeclaration) => any;
  Event?: (value: ts.PropertyDeclaration) => any;
  Ref?: (value: ts.PropertyDeclaration) => any;
  Computed?: (value: ts.GetAccessorDeclaration) => any;
  Provider?: (value: ts.PropertyDeclaration) => any;
  Inject?: (value: ts.PropertyDeclaration) => any;
  Template?: (value: ts.JsxFragment | ts.JsxElement | ts.JsxSelfClosingElement) => any;
  PostTransform?: (metadata: TransformerResult<Transformer>) => TransformerResult<Transformer>;
}

const noop = <T>(value: T) => value;

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

  const metadata = components[0];

  const props = metadata.props.map(transformer.Prop ?? noop);
  const states = metadata.state.map(transformer.State ?? noop);
  const computed = metadata.computed.map(transformer.Computed ?? noop);
  const events = metadata.events.map(transformer.Event ?? noop);
  const methods = metadata.methods.map(transformer.Method ?? noop);
  const refs = metadata.refs.map(transformer.Ref ?? noop);
  const providers = metadata.providers.map(transformer.Provider ?? noop);
  const injects = metadata.injects.map(transformer.Inject ?? noop);
  const template = transformer.Template
    ? transformer.Template(metadata.template)
    : metadata.template;

  const result: TransformerResult<Transformer> = {
    ...metadata,
    props,
    states,
    computed,
    events,
    methods,
    refs,
    providers,
    injects,
    template,
  };

  return transformer.PostTransform ? transformer.PostTransform(result) : result;
}
