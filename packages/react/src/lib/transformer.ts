import { printNode } from '@pryzm/ast-utils';
import { createTransformer, transformTemplate } from '@pryzm/compiler';
import { compileStyle } from '@vue/component-compiler-utils/dist/compileStyle';
import * as ts from 'typescript';
import { factory } from 'typescript';
import { findDependencies } from './helpers/find-dependencies';
import { useCallback, useEffect, useMemo, useRef, useState } from './helpers/hooks';
import {
  createDestructuredProperty,
  createFunctionTypeNode,
  createInterfaceProperty,
} from './helpers/misc';
import { setterName } from './helpers/names';
import { processNode } from './helpers/process-node';
import { templateTransformer } from './template-transformer';

export const transformer = createTransformer({
  Computed({ body, name, comment }, context) {
    context.importHandler.addNamedImport('useMemo', 'react');

    // scan the body for any dependencies
    const dependencies = findDependencies(body!);

    // convert a getter to use memo
    // e.g. @Computed() get test() { return 'test'; } => const test = useMemo(() => { return 'test'; }, []);
    const statement = useMemo(name, processNode(body, context), dependencies, comment);

    return { name, statement, dependencies };
  },
  Prop({ name, type, initializer, node, comment }, context) {
    // get the default value of the prop if it exists
    initializer = processNode(initializer, context);

    // create the interface property with the type attached
    const interfaceProperty = createInterfaceProperty(name, type, node, comment);

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
  State({ name, type, initializer, comment }, context) {
    context.importHandler.addNamedImport('useState', 'react');

    // get the name of the state
    const getter = name;

    // create a new name for the prop setter
    const setter = setterName(getter);

    // get the initializer of the prop if it exists
    initializer = processNode(initializer, context);

    // convert the property to a useState hook
    const statement = useState(getter, setter, initializer, type, comment);

    return { getter, setter, statement };
  },
  Event({ name, initializer, comment, node }) {
    // get the type of the event
    const eventType = initializer.typeArguments?.[0];

    // create the type of the prop which is a function with a parameter of the event type
    const type = createFunctionTypeNode(eventType);

    // create the interface property with the type attached
    const interfaceProperty = createInterfaceProperty(name, type, node, comment);

    // create the destructured property with the default value attached
    const destructuredProperty = createDestructuredProperty(name);

    return {
      name,
      interfaceProperty: printNode(interfaceProperty),
      destructuredProperty: printNode(destructuredProperty),
    };
  },
  Inject(value) {
    throw new Error('Inject is not supported in React');
  },
  Provider(value) {
    throw new Error('Provider is not supported in React');
  },
  Ref({ name, type, comment }, context) {
    context.importHandler.addNamedImport('useRef', 'react');

    return { name, statement: useRef(name, factory.createNull(), type, comment) };
  },
  Method({ name, body, node, comment }, context) {
    context.importHandler.addNamedImport('useCallback', 'react');

    // scan the body for any dependencies
    const dependencies = findDependencies(body!);

    // convert a method to a useCallback hook
    // e.g. test() { return 'test'; } => const test = useCallback(() => { return 'test'; }, []);
    const statement = useCallback(name, processNode(node, context), dependencies, comment);

    return { name, statement, dependencies };
  },
  OnInit(method, context) {
    context.importHandler.addNamedImport('useEffect', 'react');

    // convert a method to a useEffect hook
    // e.g. onInit() { return 'test'; } => useEffect(() => { return 'test'; }, []);
    return useEffect(processNode(method.body, context)!, []);
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
          processNode(method.body, context)!
        )
      ),
    ]);

    // convert a method to a useEffect hook with a cleanup function
    return useEffect(returnStatement, []);
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

    return !context.data.has('id') ? template : `<>${template}<style>{\`${styles}\`}</style></>`;
  },
  EventEmit({ name, value }) {
    return factory.createExpressionStatement(
      factory.createCallExpression(factory.createIdentifier(name), undefined, value ? [value] : [])
    );
  },
  PreTransform(metadata, context) {
    // add the react import
    context.importHandler.addDefaultImport('React', 'react');

    return metadata;
  },
});
