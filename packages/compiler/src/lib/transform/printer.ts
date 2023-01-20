import { Transformer, TransformerResult } from './transformer';

export interface Printer<T extends Transformer> {
  print(metadata: TransformerResult<T>): string;
}
