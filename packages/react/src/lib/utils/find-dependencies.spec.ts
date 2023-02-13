import { tsquery } from '@phenomnomnominal/tsquery';
import * as ts from 'typescript';
import { findDependencies } from './find-dependencies';

describe('Find Dependencies', () => {
  it('should find a simple dependency', () => {
    const source = `
    @Component()
    export class Test {

      @State() test: string = 'test';

      calculate() {
        return this.test;
      }
    }
  `;
    const ast = tsquery.ast(source);
    // find the get accessor
    const getAccessor = tsquery<ts.MethodDeclaration>(
      ast,
      'MethodDeclaration:has(Identifier[name="calculate"])'
    )[0];
    // find the dependencies
    const dependencies = findDependencies(getAccessor.body!);

    expect(dependencies).toEqual(['test']);
  });

  it('should find a method dependency', () => {
    const source = `
      @Component()
      export class Test {

        @Computed() get test() {
          return this.calculate();
        }

        calculate() {
          return 'test';
        }
      }
    `;
    const ast = tsquery.ast(source);
    // find the get accessor
    const getAccessor = tsquery<ts.GetAccessorDeclaration>(ast, 'GetAccessor')[0];
    // find the dependencies
    const dependencies = findDependencies(getAccessor.body!);

    expect(dependencies).toEqual(['calculate']);
  });

  it('should find a setter dependency', () => {
    const source = `
      @Component()
      export class Test {

        @State() test: string = 'test';

        calculate() {
          this.test = 'test';
        }
      }
    `;
    const ast = tsquery.ast(source);
    // find the get accessor
    const getAccessor = tsquery<ts.MethodDeclaration>(
      ast,
      'MethodDeclaration:has(Identifier[name="calculate"])'
    )[0];
    // find the dependencies
    const dependencies = findDependencies(getAccessor.body!);

    expect(dependencies).toEqual(['setTest']);
  });
});
