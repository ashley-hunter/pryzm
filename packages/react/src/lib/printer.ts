import { Printer, transform, TransformerResult } from '@pryzm/compiler';
import * as ts from 'typescript';
import { createComponent } from './printer/component';
import { createPropsInterface } from './printer/props';
import { ReactTransformer, transformer } from './transformer';

export function print(source: string): string {
  const printer = new ReactPrinter();
  return printer.print(transform(source, transformer));
}

export class ReactPrinter implements Printer<ReactTransformer> {
  print(metadata: TransformerResult<ReactTransformer>): string {
    const statements: ts.Statement[] = [];

    // Add imports
    statements.push(...metadata.imports);

    // Add the props
    statements.push(createPropsInterface(metadata));

    // Add the component
    statements.push(createComponent(metadata));

    // create a source file from the statements
    const sourceFile = ts.factory.createSourceFile(
      statements,
      ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
      ts.NodeFlags.None
    );

    // create a printer
    const printer = ts.createPrinter();

    // print the source file
    return printer.printFile(sourceFile);
  }
}
