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

export function transform<T extends Transformer>(
  source: string,
  transformer: T
): TranformerResult<T>[] {
  const components = parseFile(source);

  return components.map<TranformerResult<T>>((metadata) => {
    const result: TranformerResult<T> = {
      props: transformer.Prop ? metadata.props.map(transformer.Prop) : [],
      states: transformer.State ? metadata.state.map(transformer.State) : [],
      computed: transformer.Computed
        ? metadata.computed.map(transformer.Computed)
        : [],
      events: transformer.Event ? metadata.events.map(transformer.Event) : [],
      methods: transformer.Method
        ? metadata.methods.map(transformer.Method)
        : [],
      refs: transformer.Ref ? metadata.refs.map(transformer.Ref) : [],
      providers: transformer.Provider
        ? metadata.providers.map(transformer.Provider)
        : [],
      injects: transformer.Inject
        ? metadata.injects.map(transformer.Inject)
        : [],
    };

    return result;
  });
}
