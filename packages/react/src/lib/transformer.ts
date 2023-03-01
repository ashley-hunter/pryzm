import {
  getDecorator,
  getDecoratorParameter,
  getPropertyName,
  inferType,
  printNode,
  stripThis,
} from '@pryzm/ast-utils';
import {
  Transformer,
  TransformerContext,
  TransformerResult,
  transformTemplate,
} from '@pryzm/compiler';
import { compileStyle } from '@vue/component-compiler-utils/dist/compileStyle';
import * as ts from 'typescript';
import { factory } from 'typescript';
import { useCallback, useMemo, useRef, useState } from './ast/hooks';
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
    state: ts.PropertyDeclaration,
    context: TransformerContext
  ): {
    getter: string;
    setter: string;
    statement: string;
  };
  Prop(
    prop: ts.PropertyDeclaration,
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
    method: ts.MethodDeclaration,
    context: TransformerContext
  ): {
    name: string;
    dependencies: string[];
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
  State(state, context) {
    context.importHandler.addNamedImport('useState', 'react');

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
    const type = value.type ? printNode(value.type) : undefined;

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
  Method(method, context) {
    context.importHandler.addNamedImport('useCallback', 'react');

    const name = getPropertyName(method);

    // scan the body for any dependencies
    const dependencies = findDependencies(method.body!);

    // convert a method to a useCallback hook
    // e.g. test() { return 'test'; } => const test = useCallback(() => { return 'test'; }, []);
    const statement = useCallback(name, method.parameters, method.body!, dependencies);

    return { name, statement, dependencies };
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
    const template = transformTemplate(value, templateTransformer, context) as
      | ts.JsxFragment
      | ts.JsxElement
      | ts.JsxSelfClosingElement;

    // if there are no styles then return the template directly
    if (!context.data.has('id')) {
      return printNode(template);
    }

    // otherwise wrap the template in a fragment and add a style element
    return printNode(
      factory.createJsxFragment(
        factory.createJsxOpeningFragment(),
        [
          template,
          factory.createJsxElement(
            factory.createJsxOpeningElement(
              factory.createIdentifier('style'),
              undefined,
              factory.createJsxAttributes([])
            ),
            [
              factory.createJsxExpression(
                undefined,
                factory.createNoSubstitutionTemplateLiteral(styles)
              ),
            ],
            factory.createJsxClosingElement(factory.createIdentifier('style'))
          ),
        ],
        factory.createJsxJsxClosingFragment()
      )
    );
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
