import { print } from './printer';

describe('React Printer', () => {
  it('should print a simple component', () => {
    const source = `
      @Component()
      export class MyComponent {
        render() {
          return <div>Hello World</div>;
        }
      }
    `;

    const result = print(source);

    expect(result).toMatchInlineSnapshot('""');
  });
});
