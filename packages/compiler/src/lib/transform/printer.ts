import { Transformer, TransformerOutput } from './transformer';

export interface Printer<T extends Transformer> {
  print(metadata: TransformerOutput<T>): string;

  format(value: string): string;
}
