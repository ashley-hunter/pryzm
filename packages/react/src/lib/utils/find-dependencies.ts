import * as ts from 'typescript';

export function findDependencies<T extends ts.Node>(node: T): string[] {}
