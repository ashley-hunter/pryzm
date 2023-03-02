import {
  getDecorator,
  getDecoratorParameter,
  getPropertyName,
  inferType,
  printNode,
  stripThis,
} from '@pryzm/ast-utils';
import {
  MethodTransformerMetadata,
  PropertyTransformerMetadata,
  Transformer,
  TransformerContext,
  TransformerResult,
  transformTemplate,
} from '@pryzm/compiler';
import { compileStyle } from '@vue/component-compiler-utils/dist/compileStyle';
import * as ts from 'typescript';
import { factory } from 'typescript';
import { useCallback, useEffect, useMemo, useRef, useState } from './ast/hooks';
import {
  createDestructuredProperty,
  createFunctionTypeNode,
  createInterfaceProperty,
} from './ast/misc';
import { templateTransformer } from './template-transformer';
import { findDependencies } from './utils/find-dependencies';
import { eventName, setterName } from './utils/names';
import { renameIdentifierOccurences } from './utils/rename';

export interface ReactTransformer extends Transformer {
  State(
    metadata: PropertyTransformerMetadata,
    context: TransformerContext
  ): {
    getter: string;
    setter: string;
    statement: string;
  };
  Prop(
    metadata: PropertyTransformerMetadata,
    context: TransformerContext
  ): {
    name: string;
    interfaceProperty: string;
    destructuredProperty: string;
  };
  Computed(
    computed: ts.GetAccessorDeclaration,
    context: TransformerContext
  ): {
    name: string;
    dependencies: string[];
    statement: string;
  };
  Ref(
    ref: ts.PropertyDeclaration,
    context: TransformerContext
  ): {
    name: string;
    statement: string;
  };
  Method(
    method: MethodTransformerMetadata,
    context: TransformerContext
  ): {
    name: string;
    dependencies: string[];
    statement: string;
  };
  OnInit(
    method: ts.MethodDeclaration,
    context: TransformerContext
  ): {
    statement: string;
  };
  OnDestroy(
    method: ts.MethodDeclaration,
    context: TransformerContext
  ): {
    statement: string;
  };
  Event(
    event: ts.PropertyDeclaration,
    context: TransformerContext
  ): {
    name: string;
    interfaceProperty: string;
    destructuredProperty: string;
  };
  Provider(
    provider: ts.PropertyDeclaration,
    context: TransformerContext
  ): {
    name: string;
    token: string;
    statement: string;
  };
  Inject(
    inject: ts.PropertyDeclaration,
    context: TransformerContext
  ): {
    name: string;
    token: string;
    type: string | undefined;
  };
  Slots(
    slot: string,
    context: TransformerContext
  ): {
    name: string;
    interfaceProperty: string;
    destructuredProperty: string;
  };
  Styles(style: string, context: TransformerContext): string;
  Template?: (
    value: ts.JsxFragment | ts.JsxElement | ts.JsxSelfClosingElement,
    styles: string,
    context: TransformerContext
  ) => string;
  PostTransform: (
    metadata: TransformerResult<ReactTransformer>
  ) => TransformerResult<ReactTransformer>;
}

export const transformer: ReactTransformer = {
  Computed(computed, context) {
    context.importHandler.addNamedImport('useMemo', 'react');

    const name = getPropertyName(computed);

    // scan the body for any dependencies
    const dependencies = findDependencies(computed.body!);

    // convert a getter to use memo
    // e.g. @Computed() get test() { return 'test'; } => const test = useMemo(() => { return 'test'; }, []);
    const statement = useMemo(name, computed.body!, dependencies);

    return { name, statement, dependencies };
  },
  Prop({ name, type, initializer, node }) {
    // get the default value of the prop if it exists
    initializer = stripThis(initializer);

    // get the type of the prop if it exists
    type ??= inferType(initializer, true);

    // create the interface property with the type attached
    const interfaceProperty = createInterfaceProperty(name, type, node);

    // create the destructured property with the default value attached
    const destructuredProperty = createDestructuredProperty(name, initializer);

    return {
      name,
      interfaceProperty: printNode(interfaceProperty),
      destructuredProperty: printNode(destructuredProperty),
    };
  },
  Slots(slot, context) {
    // if the slot is 'default' then we need to rename it to 'children'
    if (slot === 'default') {
      slot = 'children';
    }

    context.importHandler.addNamedImport('ReactNode', 'react');

    // create the interface property with the type attached
    const interfaceProperty = createInterfaceProperty(
      slot,
      factory.createTypeReferenceNode(factory.createIdentifier('ReactNode'), undefined)
    );

    // create the destructured property with the default value attached
    const destructuredProperty = createDestructuredProperty(slot);

    return {
      name: slot,
      interfaceProperty: printNode(interfaceProperty),
      destructuredProperty: printNode(destructuredProperty),
    };
  },
  State({ name, type, initializer }, context) {
    context.importHandler.addNamedImport('useState', 'react');

    // get the name of the state
    const getter = name;

    // create a new name for the prop setter
    const setter = setterName(getter);

    // get the initializer of the prop if it exists
    initializer = stripThis(initializer);

    // get the type of the prop if it exists
    type ??= inferType(initializer, false);

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

    return {
      name,
      interfaceProperty: printNode(interfaceProperty),
      destructuredProperty: printNode(destructuredProperty),
    };
  },
  Inject(value) {
    // get the name of the inject
    const name = getPropertyName(value);

    // get the type
    const type = printNode(value.type);

    // get the token from the decorator
    const decorator = getDecorator(value, 'Inject')!;
    const token = getDecoratorParameter(decorator);

    if (!token || !ts.isIdentifier(token)) {
      throw new Error('Inject must have a token');
    }

    return { name, token: printNode(token), type };
  },
  Provider(value) {
    // get the name of the provider
    const name = getPropertyName(value);

    const decorator = getDecorator(value, 'Provider')!;
    const token = getDecoratorParameter(decorator);

    if (!token || !ts.isIdentifier(token)) {
      throw new Error('Provider must have a token');
    }

    // wrap the initializer in a useRef hook
    const statement = useRef(name, value.initializer!);

    return { name, statement, token: printNode(token) };
  },
  Ref(value, context) {
    context.importHandler.addNamedImport('useRef', 'react');

    // get the name of the ref
    const name = getPropertyName(value);

    // get the type of the ref if it exists
    const type =
      value.type ??
      factory.createTypeReferenceNode(factory.createIdentifier('HTMLElement'), undefined);

    // convert the property to a useRef hook
    const statement = useRef(name, factory.createNull(), type);

    return { name, statement };
  },
  Method({ name, body, parameters }, context) {
    context.importHandler.addNamedImport('useCallback', 'react');

    // scan the body for any dependencies
    const dependencies = findDependencies(body!);

    // convert a method to a useCallback hook
    // e.g. test() { return 'test'; } => const test = useCallback(() => { return 'test'; }, []);
    const statement = useCallback(name, parameters, body!, dependencies);

    return { name, statement, dependencies };
  },
  OnInit(method, context) {
    context.importHandler.addNamedImport('useEffect', 'react');

    // convert a method to a useEffect hook
    // e.g. onInit() { return 'test'; } => useEffect(() => { return 'test'; }, []);
    const statement = useEffect(method.body!, []);

    return { statement };
  },
  OnDestroy(method, context) {
    context.importHandler.addNamedImport('useEffect', 'react');

    // create a return statement for the useEffect hook
    const returnStatement = factory.createBlock([
      factory.createReturnStatement(
        factory.createArrowFunction(
          undefined,
          undefined,
          [],
          undefined,
          factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          method.body!
        )
      ),
    ]);

    // convert a method to a useEffect hook with a cleanup function
    const statement = useEffect(returnStatement, []);

    return { statement };
  },
  Styles(style, context) {
    if (style === '') {
      return '';
    }

    // generate a unique id for the component that will be used to scope styles
    if (!context.data.has('id')) {
      context.data.set('id', `data-v-${Math.random().toString(36).substring(2, 9)}`);
    }

    // convert the style to a scoped style
    const output = compileStyle({
      source: style,
      id: context.data.get('id') as string,
      scoped: true,
      filename: 'https://style.css',
    });

    return output.code;
  },
  Template(value, styles, context) {
    const template = transformTemplate(value, templateTransformer, context);

    // if there are no styles then return the template directly
    if (!context.data.has('id')) {
      return template;
    }

    return `<>${template}<style>{\`${styles}\`}</style></>`;
  },
  PreTransform(metadata, context) {
    // add the react import
    context.importHandler.addDefaultImport('React', 'react');

    return metadata;
  },
  PostTransform(metadata) {
    // find all events and rename to include the on prefix
    const eventsToRename = metadata.events.filter(event => event.name !== eventName(event.name));

    // rename all events
    eventsToRename.forEach(event =>
      renameIdentifierOccurences(metadata, event.name, eventName(event.name))
    );

    return metadata;
  },
};
