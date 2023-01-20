import {
  getDecorator,
  getDecoratorArgument,
  getPropertyName,
} from '@pryzm/ast-utils';
import { Transformer, TransformerResult } from '@pryzm/compiler';
import * as ts from 'typescript';
import { factory } from 'typescript';
import { useCallback, useMemo, useRef, useState } from './ast/hooks';
import {
  createDestructuredProperty,
  createFunctionTypeNode,
  createInterfaceProperty,
} from './ast/misc';
import { findDependencies } from './utils/find-dependencies';
import { eventName, setterName } from './utils/names';
import { renameIdentifierOccurences } from './utils/rename';
import { stripThis } from './utils/strip-this';
import { inferType } from './utils/type-inference';

export interface ReactTransformer extends Transformer {
  State(state: ts.PropertyDeclaration): {
    getter: string;
    setter: string;
    statement: ts.VariableStatement;
  };
  Prop(prop: ts.PropertyDeclaration): {
    name: string;
    interfaceProperty: ts.PropertySignature;
    destructuredProperty: ts.BindingElement;
  };
  Computed(computed: ts.GetAccessorDeclaration): {
    name: string;
    dependencies: string[];
    statement: ts.VariableStatement;
  };
  Ref(ref: ts.PropertyDeclaration): {
    name: string;
    statement: ts.VariableStatement;
  };
  Method(method: ts.MethodDeclaration): {
    name: string;
    dependencies: string[];
    statement: ts.VariableStatement;
  };
  Event(event: ts.PropertyDeclaration): {
    name: string;
    interfaceProperty: ts.PropertySignature;
    destructuredProperty: ts.BindingElement;
  };
  Provider(provider: ts.PropertyDeclaration): {
    name: string;
    token: ts.Identifier;
    statement: ts.VariableStatement;
  };
  Inject(inject: ts.PropertyDeclaration): {
    name: string;
    token: ts.Identifier;
    type: ts.TypeNode | undefined;
  };
  PostTransform: (
    metadata: TransformerResult<ReactTransformer>
  ) => TransformerResult<ReactTransformer>;
}

export const transformer: ReactTransformer = {
  Computed(computed) {
    const name = getPropertyName(computed);

    // scan the body for any dependencies
    const dependencies = findDependencies(computed.body!);

    // convert a getter to use memo
    // e.g. @Computed() get test() { return 'test'; } => const test = useMemo(() => { return 'test'; }, []);
    const statement = useMemo(name, computed.body!, dependencies);

    return { name, statement, dependencies };
  },
  Prop(prop) {
    // get the name of the prop
    const name = getPropertyName(prop);

    // get the default value of the prop if it exists
    const initializer = stripThis(prop.initializer);

    // get the type of the prop if it exists
    const type = prop.type ?? inferType(initializer, true);

    // create the interface property with the type attached
    const interfaceProperty = createInterfaceProperty(name, type, prop);

    // create the destructured property with the default value attached
    const destructuredProperty = createDestructuredProperty(name, initializer);

    return { name, interfaceProperty, destructuredProperty };
  },
  State(state) {
    // get the name of the state
    const getter = getPropertyName(state);

    // create a new name for the prop setter
    const setter = setterName(getter);

    // get the initializer of the prop if it exists
    const initializer = stripThis(state.initializer);

    // get the type of the prop if it exists
    const type = state.type ?? inferType(initializer, false);

    // convert the property to a useState hook
    const statement = useState(getter, setter, initializer, type);

    return { getter, setter, statement };
  },
  Event(event) {
    // get the name of the prop
    const name = getPropertyName(event);

    // get the default value of the prop if it exists
    const initializer = event.initializer;

    // the event initializer will always be EventEmitter, but we need to get the type from the EventEmitter generic
    if (!initializer || !ts.isNewExpression(initializer)) {
      throw new Error('Event initializers must be an EventEmitter');
    }

    // get the type of the event
    const eventType = initializer.typeArguments?.[0];

    // create the type of the prop which is a function with a parameter of the event type
    const type = createFunctionTypeNode(eventType);

    // create the interface property with the type attached
    const interfaceProperty = createInterfaceProperty(name, type, event);

    // create the destructured property with the default value attached
    const destructuredProperty = createDestructuredProperty(name);

    return { name, interfaceProperty, destructuredProperty };
  },
  Inject(value) {
    // get the name of the inject
    const name = getPropertyName(value);

    // get the type
    const type = value.type;

    // get the token from the decorator
    const decorator = getDecorator(value, 'Inject')!;
    const token = getDecoratorArgument(decorator, 'Inject');

    if (!token || !ts.isIdentifier(token)) {
      throw new Error('Inject must have a token');
    }

    return { name, token, type };
  },
  Provider(value) {
    // get the name of the provider
    const name = getPropertyName(value);

    const decorator = getDecorator(value, 'Provider')!;
    const token = getDecoratorArgument(decorator, 'Provider');

    if (!token || !ts.isIdentifier(token)) {
      throw new Error('Provider must have a token');
    }

    // wrap the initializer in a useRef hook
    const statement = useRef(name, value.initializer!);

    return { name, statement, token };
  },
  Ref(value) {
    // get the name of the ref
    const name = getPropertyName(value);

    // get the type of the ref if it exists
    const type =
      value.type ??
      factory.createTypeReferenceNode(
        factory.createIdentifier('HTMLElement'),
        undefined
      );

    // convert the property to a useRef hook
    const statement = useRef(name, factory.createNull(), type);

    return { name, statement };
  },
  Method(method) {
    let name = getPropertyName(method);

    // scan the body for any dependencies
    const dependencies = findDependencies(method.body!);

    // convert a method to a useCallback hook
    // e.g. test() { return 'test'; } => const test = useCallback(() => { return 'test'; }, []);
    const statement = useCallback(
      name,
      method.parameters,
      method.body!,
      dependencies
    );

    return { name, statement, dependencies };
  },
  PostTransform(metadata) {
    // find all events and rename to include the on prefix
    const eventsToRename = metadata.events.filter(
      (event) => event.name !== eventName(event.name)
    );

    // rename all events
    eventsToRename.forEach((event) =>
      renameIdentifierOccurences(metadata, event.name, eventName(event.name))
    );

    return metadata;
  },
};
