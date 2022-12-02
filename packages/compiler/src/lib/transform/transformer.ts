import * as ts from 'typescript';
import { parseFile } from '../parser/parser';

type TransformerFn<
  T extends Transformer,
  K extends keyof Transformer
> = T[K] extends (...args: any) => any ? ReturnType<T[K]> : any;

export type TranformerResult<T extends Transformer> = {
  props: TransformerFn<T, 'Prop'>[];
  states: TransformerFn<T, 'State'>[];
  computed: TransformerFn<T, 'Computed'>[];
  events: TransformerFn<T, 'Event'>[];
  methods: TransformerFn<T, 'Method'>[];
  refs: TransformerFn<T, 'Ref'>[];
  providers: TransformerFn<T, 'Provider'>[];
  injects: TransformerFn<T, 'Inject'>[];
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
}

const noop = <T>(value: T) => value;

export function transform<T extends Transformer>(
  source: string,
  transformer: T
): TranformerResult<T>[] {
  const components = parseFile(source);

  return components.map<TranformerResult<T>>((metadata) => {
    const props = metadata.props.map(transformer.Prop ?? noop);
    const states = metadata.state.map(transformer.State ?? noop);
    const computed = metadata.computed.map(transformer.Computed ?? noop);
    const events = metadata.events.map(transformer.Event ?? noop);
    const methods = metadata.methods.map(transformer.Method ?? noop);
    const refs = metadata.refs.map(transformer.Ref ?? noop);
    const providers = metadata.providers.map(transformer.Provider ?? noop);
    const injects = metadata.injects.map(transformer.Inject ?? noop);

    return {
      props,
      states,
      computed,
      events,
      methods,
      refs,
      providers,
      injects,
    };
  });
}
