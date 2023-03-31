import * as ts from 'typescript';
import { findMethods, findProperties } from '../utils';
import { ProviderMetadata } from './model';

export function parseProvider(
  sourceFile: ts.SourceFile,
  component: ts.ClassDeclaration
): ProviderMetadata {
  return {
    path: sourceFile.fileName,
    name: component.name!.getText(),
    properties: findProperties(component),
    methods: findMethods(component),
  };
}
