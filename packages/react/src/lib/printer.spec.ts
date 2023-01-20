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

    expect(result).toMatchInlineSnapshot(`
      "export interface MyComponentProps {
      }
      export const MyComponent = forwardRef<HTMLElement, MyComponentProps>(({}, ref) => {
          return <div />;
      });
      "
    `);
  });

  it('should print a component with props', () => {
    const source = `
      @Component()
      export class MyComponent {
        /** Define the name of the user */
        @Prop() readonly name: string;

        /** Define the age of the user */
        @Prop() readonly age: number;

        /** Define if the user is optional */
        @Prop() readonly optional?: boolean;

        render() {
          return <div>Hello World</div>;
        }
      }
    `;

    const result = print(source);

    expect(result).toMatchInlineSnapshot(`
      "export interface MyComponentProps {
          /* Define the name of the user */
          name: string;
          /* Define the age of the user */
          age: number;
          /* Define if the user is optional */
          optional?: boolean;
      }
      export const MyComponent = forwardRef<HTMLElement, MyComponentProps>(({ name, age, optional }, ref) => {
          return <div />;
      });
      "
    `);
  });
});
