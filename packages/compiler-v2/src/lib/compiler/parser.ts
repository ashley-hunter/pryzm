import * as ts from 'typescript';
import { ComponentMetadata } from './component/model';
import { parseComponent } from './component/parse';
import { ProviderMetadata } from './provider/model';
import { findClassWithDecorator } from './utils';

export function parseFile(sourceFile: ts.SourceFile): ParserOutput {
  // find all the Component classes in the file
  const components = findClassWithDecorator(sourceFile, 'Component');

  // find all the Providers in the file
  const providers = findClassWithDecorator(sourceFile, 'Provider');

  // if there is more than one component in the file, throw an error
  if (components.length > 1) {
    throw new Error('Multiple components in a single file is not supported');
  }

  // if there is more than one provider in the file, throw an error
  if (providers.length > 1) {
    throw new Error('Multiple providers in a single file is not supported');
  }

  // if the file contains a component and a provider then throw an error
  if (components.length && providers.length) {
    throw new Error('A file cannot contain both a component and a provider');
  }

  // if the file contains a component or provider then ensure that there are no other statements in the file
  // the only allowed statements are imports and the class
  if (components.length || providers.length) {
    const statements = sourceFile.statements.filter(
      statement => !ts.isImportDeclaration(statement) && !ts.isClassDeclaration(statement)
    );

    if (statements.length) {
      throw new Error('Only imports and classes are allowed in a component or provider file');
    }
  }

  // if the file contains a component then parse the component
  if (components.length) {
    return {
      component: parseComponent(sourceFile, components[0]),
    };
  }

  // if the file contains a provider then parse the provider
  if (providers.length) {
    // return parseProvider(sourceFile, providers[0]);
  }

  return {};
}

export interface ParserOutput {
  component?: ComponentMetadata;
  provider?: ProviderMetadata;
}
