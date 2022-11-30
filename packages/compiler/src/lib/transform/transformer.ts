import { parseFile } from '../parser/parser';

export class Transformer {
  transform(source: string) {
    const ast = parseFile(source);
  }
}
