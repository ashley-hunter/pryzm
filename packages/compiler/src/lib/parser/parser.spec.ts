import { describe, expect, it } from 'vitest';
import { parseFile } from './parser';

describe('Parser', () => {
  it('should not return anything if no component is found', () => {
    const code = `
      class Button {}
    `;
    const metadata = parseFile(code);
    expect(metadata).toEqual([]);
  });

  it('should process an empty component', () => {
    const code = `
      @Component()
      export class Button {
        render() {
          return <button />;
        }
      }
    `;

    const metadata = parseFile(code);
    expect(metadata.length).toBe(1);
  });

  it('should process a component with a name', () => {
    const code = `
      @Component()
      export class Button {
        render() {
          return <button />;
        }
      }`;

    const metadata = parseFile(code);
    expect(metadata[0].name).toBe('Button');
  });

  it('should throw an error if the component has no name', () => {
    const code = `
      @Component()
      export class {
        render() {
          return <button />;
        }
      }`;

    expect(() => parseFile(code)).toThrowError('Component class must have a name');
  });

  it('should collect metadata for a props', () => {
    const code = `
      @Component()
      export class Button {
        @Prop() readonly label: string;
        @Prop() readonly count: number = 10;

        render() {
          return <button />;
        }
      }
    `;

    const metadata = parseFile(code);
    expect(metadata[0].props.length).toBe(2);
  });

  it('should collect metadata for a state', () => {
    const code = `
      @Component()
      export class Button {
        @State() label: string;
        @State() count: number = 10;

        render() {
          return <button />;
        }
      }
    `;

    const metadata = parseFile(code);
    expect(metadata[0].state.length).toBe(2);
  });

  it('should collect metadata for a providers', () => {
    const code = `
      @Component()
      export class Button {
        @Provider('service') readonly service = new Service();

        render() {
          return <button />;
        }
      }
    `;

    const metadata = parseFile(code);
    expect(metadata[0].providers.length).toBe(1);
  });

  it('should collect metadata for a inject', () => {
    const code = `
      @Component()
      export class Button {
        @Inject('service') readonly service: Service;

        render() {
          return <button />;
        }
      }
    `;
    const metadata = parseFile(code);
    expect(metadata[0].injects.length).toBe(1);
  });

  it('should collect metadata for a computed', () => {
    const code = `
      @Component()
      export class Button {
        @Computed() get label(): string {
          return 'hello';
        }

        render() {
          return <button />;
        }
      }
    `;

    const metadata = parseFile(code);
    expect(metadata[0].computed.length).toBe(1);
  });

  it('should collect metadata for a event', () => {
    const code = `
      @Component()
      export class Button {
        @Event() readonly click = new EventEmitter();

        render() {
          return <button />;
        }
      }
    `;

    const metadata = parseFile(code);
    expect(metadata[0].events.length).toBe(1);
  });

  it('should collect metadata for a method', () => {
    const code = `
      @Component()
      export class Button {
        click() {}

        render() {
          return <button />;
        }
      }
    `;

    const metadata = parseFile(code);
    expect(metadata[0].methods.length).toBe(1);
  });

  it('should collect metadata for a ref', () => {
    const code = `
      @Component()
      export class Button {
        @Ref() button: HTMLButtonElement;

        render() {
          return <button />;
        }
      }
    `;

    const metadata = parseFile(code);
    expect(metadata[0].refs.length).toBe(1);
  });

  it('should throw an error if a prop is a getter', () => {
    const code = `
      @Component()
      export class Button {
        @Prop() get label(): string {
          return 'hello';
        }

        render() {
          return <button />;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError(
      'Cannot use @Prop() on a getter. Use a property instead.'
    );
  });

  it('should throw an error if a prop is a setter', () => {
    const code = `
      @Component()
      export class Button {
        @Prop() set label(value: string) {
          console.log(value);
        }

        render() {
          return <button />;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError(
      'Cannot use @Prop() on a setter. Use a property instead.'
    );
  });

  it('should throw an error if a state is a getter', () => {
    const code = `
      @Component()
      export class Button {
        @State() get label(): string {
          return 'hello';
        }

        render() {
          return <button />;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError(
      'Cannot use @State() on a getter. Use a property instead.'
    );
  });

  it('should throw an error if a state is a setter', () => {
    const code = `
      @Component()
      export class Button {
        @State() set label(value: string) {
          console.log(value);
        }

        render() {
          return <button />;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError(
      'Cannot use @State() on a setter. Use a property instead.'
    );
  });

  it('should throw an error if a computed is a setter', () => {
    const code = `
      @Component()
      export class Button {
        @Computed() set label(value: string) {
          console.log(value);
        }

        render() {
          return <button />;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError(
      'Cannot use @Computed() on a setter, use a getter instead.'
    );
  });

  it('should throw an error if a computed is a property', () => {
    const code = `
      @Component()
      export class Button {
        @Computed() label: string;

        render() {
          return <button />;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError(
      'Cannot use @Computed() on a property, use a getter instead.'
    );
  });

  it('should throw an error if a event is a getter', () => {
    const code = `
      @Component()
      export class Button {
        @Event() get click() {
          return new EventEmitter();
        }

        render() {
          return <button />;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError(
      'Cannot use @Event() on a getter. Use a property instead.'
    );
  });

  it('should throw an error if a event is a setter', () => {
    const code = `
      @Component()
      export class Button {
        @Event() set click(value) {
          console.log(value);
        }

        render() {
          return <button />;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError(
      'Cannot use @Event() on a setter. Use a property instead.'
    );
  });

  it('should throw an error if a ref is a getter', () => {
    const code = `
      @Component()
      export class Button {
        @Ref() get button() {
          return new HTMLButtonElement();
        }

        render() {
          return <button />;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError(
      'Cannot use @Ref() on a getter. Use a property instead.'
    );
  });

  it('should throw an error if a ref is a setter', () => {
    const code = `
      @Component()
      export class Button {
        @Ref() set button(value) {
          console.log(value);
        }

        render() {
          return <button />;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError(
      'Cannot use @Ref() on a setter. Use a property instead.'
    );
  });

  it('should throw an error if there is an undecorated property', () => {
    const code = `
      @Component()
      export class Button {
        label: string;

        render() {
          return <button />;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError(
      `All properties and accessors must be decorated with @Prop(), @State(), @Event(), @Computed(), @Provider(), @Inject() or @Ref().`
    );
  });

  it('should throw an error if an undecorated property is a getter', () => {
    const code = `
      @Component()
      export class Button {
        get label(): string {
          return 'hello';
        }

        render() {
          return <button />;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError(
      'All properties and accessors must be decorated with @Prop(), @State(), @Event(), @Computed(), @Provider(), @Inject() or @Ref().'
    );
  });

  it('should throw an error if an undecorated property is a setter', () => {
    const code = `
      @Component()
      export class Button {
        set label(value: string) {
          console.log(value);
        }

        render() {
          return <button />;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError(
      'All properties and accessors must be decorated with @Prop(), @State(), @Event(), @Computed(), @Provider(), @Inject() or @Ref().'
    );
  });

  it('should collect the template with a self closing JSX element', () => {
    const code = `
      @Component()
      export class Button {
        render() {
          return <button />;
        }
      }
    `;

    const metadata = parseFile(code);
    expect(metadata[0].template).toBeDefined();
  });

  it('should collect the template with a non-self closing JSX element', () => {
    const code = `
      @Component()
      export class Button {
        render() {
          return <button></button>;
        }
      }
    `;

    const metadata = parseFile(code);
    expect(metadata[0].template).toBeDefined();
  });

  it('should collect the template with a fragment', () => {
    const code = `
      @Component()
      export class Button {
        render() {
          return <>
              <button />
              <button />
            </>;
        }
      }
    `;
    const metadata = parseFile(code);
    expect(metadata[0].template).toBeDefined();
  });

  it('should collect the template with a parenthesised JSX element', () => {
    const code = `
      @Component()
      export class Button {
        render() {
          return (<button />);
        }
      }
    `;

    const metadata = parseFile(code);
    expect(metadata[0].template).toBeDefined();
  });

  it('should throw an error if the render method is not defined', () => {
    const code = `
      @Component()
      export class Button {}
    `;

    expect(() => parseFile(code)).toThrowError('Component class must have a render method');
  });

  it('should throw an error if the render method expects parameters', () => {
    const code = `
      @Component()
      export class Button {
        render(a: string) {
          return <button />;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError('Render method cannot have parameters');
  });

  it('should throw an error if the render method contains anything other than a return statement', () => {
    const code = `
      @Component()
      export class Button {
        render() {
          console.log('hello');
          return <button />;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError(
      'Render method must only contain a return statement'
    );
  });

  it('should throw an error if the render method contains a return statement with no argument', () => {
    const code = `
      @Component()
      export class Button {
        render() {
          return;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError('Render method must return a JSX element');
  });

  it('should throw an error if the render method contains a return statement with a non-JSX element', () => {
    const code = `
      @Component()
      export class Button {
        render() {
          return 'hello';
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError('Render method must return a JSX element');
  });

  it('should throw an error if the render method contains a return statement with a parenthesised non-JSX element', () => {
    const code = `
      @Component()
      export class Button {
        render() {
          return ('hello');
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError('Render method must return a JSX element');
  });

  it('should throw an error if component has any static properties', () => {
    const code = `
      @Component()
      export class Button {
        static label: string = 'hello';

        render() {
          return <button />;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError('Static properties are not supported');
  });

  it('should throw an error if component has any static methods', () => {
    const code = `
      @Component()
      export class Button {
        static getLabel() {
          return 'hello';
        }

        render() {
          return <button />;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError('Static methods are not supported');
  });

  it('should throw if a @Prop() is private', () => {
    const code = `
      @Component()
      export class Button {
        @Prop() readonly private label: string;

        render() {
          return <button />;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError('Prop "label" cannot be private');
  });

  it('should throw if a @Prop() is protected', () => {
    const code = `
      @Component()
      export class Button {
        @Prop() readonly protected label: string;

        render() {
          return <button />;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError('Prop "label" cannot be protected');
  });

  it('should throw if an @Event() is private', () => {
    const code = `
      @Component()
      export class Button {
        @Event() private readonly click = new EventEmitter();

        render() {
          return <button />;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError('Event "click" cannot be private');
  });

  it('should throw if an @Event() is protected', () => {
    const code = `
      @Component()
      export class Button {
        @Event() protected readonly click = new EventEmitter();

        render() {
          return <button />;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError('Event "click" cannot be protected');
  });

  it('should throw if a @Prop() is not readonly', () => {
    const code = `
      @Component()
      export class Button {
        @Prop() label: string;

        render() {
          return <button />;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError('Prop "label" must be readonly');
  });

  it('should throw if an @Event() is not readonly', () => {
    const code = `
      @Component()
      export class Button {
        @Event() click = new EventEmitter();

        render() {
          return <button />;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError('Event "click" must be readonly');
  });

  it('should throw if a @Provider() is not readonly', () => {
    const code = `
      @Component()
      export class Button {
        @Provider('service') service = new MyService();

        render() {
          return <button />;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError('Provider "service" must be readonly');
  });

  it('should collect imports', () => {
    const code = `
      import { Component, Prop } from '@pryzm/core';

      @Component()
      export class Button {
        @Prop() readonly label: string;

        render() {
          return <button>{this.label}</button>;
        }
      }
    `;

    const metadata = parseFile(code);
    expect(metadata[0].imports.length).toBe(1);
  });

  it('should throw an error if a @Provider() is not initialized', () => {
    const code = `
      @Component()
      export class Button {
        @Provider('service') readonly service: Service;

        render() {
          return <button />;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError('Provider "service" must be initialized');
  });

  it('should throw an error if an @Inject() is not readonly', () => {
    const code = `
      @Component()
      export class Button {
        @Inject('service') service: Service;

        render() {
          return <button />;
        }
      }
    `;

    expect(() => parseFile(code)).toThrowError('Dependency "service" must be readonly');
  });
});
