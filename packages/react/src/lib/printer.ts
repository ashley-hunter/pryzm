import { Printer, transform, TransformerResult } from '@pryzm/compiler';
import { ReactTransformer, transformer } from './transformer';

export function print(source: string): string {
  const printer = new ReactPrinter();
  return printer.print(transform(source, transformer));
}

export class ReactPrinter implements Printer<ReactTransformer> {
  print(metadata: TransformerResult<ReactTransformer>): string {
    return '';
  }
}
