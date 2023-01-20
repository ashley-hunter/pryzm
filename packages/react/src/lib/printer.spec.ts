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
        @Prop() readonly age: number = 10;

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
      export const MyComponent = forwardRef<HTMLElement, MyComponentProps>(({ name, age = 10, optional }, ref) => {
          return <div />;
      });
      "
    `);
  });

  it('should print a component with states', () => {
    const source = `
      @Component()
      export class MyComponent {
        @State() name: string = 'John Doe';

        render() {
          return <div>Hello World</div>;
        }
      }
    `;

    const result = print(source);

    expect(result).toMatchInlineSnapshot(`
      "import { useState } from \\"react\\";
      export interface MyComponentProps {
      }
      export const MyComponent = forwardRef<HTMLElement, MyComponentProps>(({}, ref) => {
          const [name, setName] = useState<string>(\\"John Doe\\");
          return <div />;
      });
      "
    `);
  });

  it('should print a component with computed properties', () => {
    const source = `
      @Component()
      export class MyComponent {
        @State() firstName: string = 'John';

        @State() lastName: string = 'Smith';

        @Computed() get fullName() {
          return this.firstName + ' ' + this.lastName;
        };

        render() {
          return <div>Hello World</div>;
        }
      }
    `;

    const result = print(source);

    expect(result).toMatchInlineSnapshot(`
      "import { useState, useMemo } from \\"react\\";
      export interface MyComponentProps {
      }
      export const MyComponent = forwardRef<HTMLElement, MyComponentProps>(({}, ref) => {
          const [firstName, setFirstName] = useState<string>(\\"John\\");
          const [lastName, setLastName] = useState<string>(\\"Smith\\");
          const fullName = useMemo(() => {
              return firstName + \\" \\" + lastName;
          }, [firstName, lastName]);
          return <div />;
      });
      "
    `);
  });
});
