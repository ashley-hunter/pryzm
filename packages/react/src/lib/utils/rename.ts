import * as ts from 'typescript';

export function renameIdentifier<T extends ts.Node>(node: T, oldName: string, newName: string): T {
  // run the ts transformer
  return ts.transform(node, [renameIdentifierTransformer(oldName, newName)]).transformed[0];
}

// create a ts transformer factory
function renameIdentifierTransformer<T extends ts.Node>(
  oldName: string,
  newName: string
): ts.TransformerFactory<T> {
  return context => {
    const visitor = (node: ts.Node): ts.Node => {
      if (ts.isIdentifier(node) && node.text === oldName) {
        return ts.factory.createIdentifier(newName);
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return root => ts.visitNode(root, visitor);
  };
}

// export function renameIdentifierOccurences(
//   metadata: TransformerOutput<ReactTransformer>,
//   oldName: string,
//   newName: string
// ): TransformerOutput<ReactTransformer> {
//   metadata.props = metadata.props.map(({name, destructuredProperty, interfaceProperty}) => {
//     if (name === oldName) {
//       name = newName;
//       destructuredProperty = renameIdentifier(destructuredProperty, oldName, newName);
//       interfaceProperty = renameIdentifier(interfaceProperty, oldName, newName);
//     }

//     return {name, destructuredProperty, interfaceProperty};
//   });

//   metadata.states = metadata.states.map(state => {
//     if (state.getter === oldName) {
//       state.getter = newName;
//     }

//     if (state.setter === oldName) {
//       state.setter = newName;
//     }

//     state.statement = renameIdentifier(state.statement, oldName, newName);

//     return state;
//   });

//   metadata.computed = metadata.computed.map(computed => {
//     if (computed.name === oldName) {
//       computed.name = newName;
//     }

//     computed.statement = renameIdentifier(computed.statement, oldName, newName);
//     computed.dependencies = computed.dependencies.map(dependency => {
//       if (dependency === oldName) {
//         dependency = newName;
//       }

//       return dependency;
//     });

//     return computed;
//   });

//   metadata.events = metadata.events.map(event => {
//     if (event.name === oldName) {
//       event.name = newName;
//     }

//     event.destructuredProperty = renameIdentifier(event.destructuredProperty, oldName, newName);
//     event.interfaceProperty = renameIdentifier(event.interfaceProperty, oldName, newName);

//     return event;
//   });

//   metadata.methods = metadata.methods.map(method => {
//     if (method.name === oldName) {
//       method.name = newName;
//     }

//     method.statement = renameIdentifier(method.statement, oldName, newName);
//     method.dependencies = method.dependencies.map(dependency => {
//       if (dependency === oldName) {
//         dependency = newName;
//       }

//       return dependency;
//     });

//     return method;
//   });

//   metadata.refs = metadata.refs.map(ref => {
//     if (ref.name === oldName) {
//       ref.name = newName;
//     }

//     ref.statement = renameIdentifier(ref.statement, oldName, newName);

//     return ref;
//   });

//   metadata.providers = metadata.providers.map(provider => {
//     if (provider.name === oldName) {
//       provider.name = newName;
//     }

//     provider.statement = renameIdentifier(provider.statement, oldName, newName);

//     return provider;
//   });

//   return metadata;
// }
