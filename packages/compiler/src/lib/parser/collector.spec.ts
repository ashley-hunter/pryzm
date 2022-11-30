import { describe, expect, it } from 'vitest';
import { collectMetadata } from './collector';

describe('Metadata Collector', () => {
  it('should not return anything if no component is found', () => {
    const code = `
      class Button {}
    `;
    const metadata = collectMetadata(code);
    expect(metadata).toEqual([]);
  });

  it('should process an empty component', () => {
    const code = `
      @Component
      export class Button {
      }
    `;

    const metadata = collectMetadata(code);
    expect(metadata).toEqual([
      {
        props: [],
        state: [],
        computed: [],
        events: [],
        methods: [],
        refs: [],
      },
    ]);
  });

  it('should collect metadata for a props', () => {
    const code = `
      @Component
      export class Button {
        @Prop label: string;
        @Prop count: number = 10;
      }
    `;

    const metadata = collectMetadata(code);
    expect(metadata[0].props.length).toBe(2);
  });

  it('should collect metadata for a state', () => {
    const code = `
      @Component
      export class Button {
        @State label: string;
        @State count: number = 10;
      }
    `;

    const metadata = collectMetadata(code);
    expect(metadata[0].state.length).toBe(2);
  });

  it('should collect metadata for a computed', () => {
    const code = `
      @Component
      export class Button {
        @Computed get label(): string {
          return 'hello';
        }
      }
    `;

    const metadata = collectMetadata(code);
    expect(metadata[0].computed.length).toBe(1);
  });

  it('should collect metadata for a event', () => {
    const code = `
      @Component
      export class Button {
        @Event click = new EventEmitter();
      }
    `;

    const metadata = collectMetadata(code);
    expect(metadata[0].events.length).toBe(1);
  });

  it('should collect metadata for a method', () => {
    const code = `
      @Component
      export class Button {
        click() {}
      }
    `;

    const metadata = collectMetadata(code);
    expect(metadata[0].methods.length).toBe(1);
  });

  it('should collect metadata for a ref', () => {
    const code = `
      @Component
      export class Button {
        @Ref button: HTMLButtonElement;
      }
    `;

    const metadata = collectMetadata(code);
    expect(metadata[0].refs.length).toBe(1);
  });

  it('should throw an error if a prop is a getter', () => {
    const code = `
      @Component
      export class Button {
        @Prop get label(): string {
          return 'hello';
        }
      }
    `;

    expect(() => collectMetadata(code)).toThrowError(
      'Cannot use @Prop on a getter. Use a property instead.'
    );
  });

  it('should throw an error if a prop is a setter', () => {
    const code = `
      @Component
      export class Button {
        @Prop set label(value: string) {
          console.log(value);
        }
      }
    `;

    expect(() => collectMetadata(code)).toThrowError(
      'Cannot use @Prop on a setter. Use a property instead.'
    );
  });

  it('should throw an error if a state is a getter', () => {
    const code = `
      @Component
      export class Button {
        @State get label(): string {
          return 'hello';
        }
      }
    `;

    expect(() => collectMetadata(code)).toThrowError(
      'Cannot use @State on a getter. Use a property instead.'
    );
  });

  it('should throw an error if a state is a setter', () => {
    const code = `
      @Component
      export class Button {
        @State set label(value: string) {
          console.log(value);
        }
      }
    `;

    expect(() => collectMetadata(code)).toThrowError(
      'Cannot use @State on a setter. Use a property instead.'
    );
  });

  it('should throw an error if a computed is a setter', () => {
    const code = `
      @Component
      export class Button {
        @Computed set label(value: string) {
          console.log(value);
        }
      }
    `;

    expect(() => collectMetadata(code)).toThrowError(
      'Cannot use @Computed on a setter, use a getter instead.'
    );
  });

  it('should throw an error if a computed is a property', () => {
    const code = `
      @Component
      export class Button {
        @Computed label: string;
      }
    `;

    expect(() => collectMetadata(code)).toThrowError(
      'Cannot use @Computed on a property, use a getter instead.'
    );
  });

  it('should throw an error if a event is a getter', () => {
    const code = `
      @Component
      export class Button {
        @Event get click() {
          return new EventEmitter();
        }
      }
    `;

    expect(() => collectMetadata(code)).toThrowError(
      'Cannot use @Event on a getter. Use a property instead.'
    );
  });

  it('should throw an error if a event is a setter', () => {
    const code = `
      @Component
      export class Button {
        @Event set click(value) {
          console.log(value);
        }
      }
    `;

    expect(() => collectMetadata(code)).toThrowError(
      'Cannot use @Event on a setter. Use a property instead.'
    );
  });

  it('should throw an error if a ref is a getter', () => {
    const code = `
      @Component
      export class Button {
        @Ref get button() {
          return new HTMLButtonElement();
        }
      }
    `;

    expect(() => collectMetadata(code)).toThrowError(
      'Cannot use @Ref on a getter. Use a property instead.'
    );
  });

  it('should throw an error if a ref is a setter', () => {
    const code = `
      @Component
      export class Button {
        @Ref set button(value) {
          console.log(value);
        }
      }
    `;

    expect(() => collectMetadata(code)).toThrowError(
      'Cannot use @Ref on a setter. Use a property instead.'
    );
  });

  it('should collect properties without any decorators', () => {
    const code = `
      @Component
      export class Button {
        label: string;
        count: number = 10;
      }
    `;

    const metadata = collectMetadata(code);
    expect(metadata[0].properties.length).toBe(2);
  });

  it('should throw an error if an undecorated property is a getter', () => {
    const code = `
      @Component
      export class Button {
        get label(): string {
          return 'hello';
        }
      }
    `;

    expect(() => collectMetadata(code)).toThrowError(
      'Cannot use a getter without a @Computed decorator.'
    );
  });

  it('should throw an error if an undecorated property is a setter', () => {
    const code = `
      @Component
      export class Button {
        set label(value: string) {
          console.log(value);
        }
      }
    `;

    expect(() => collectMetadata(code)).toThrowError(
      'Setters are not supported.'
    );
  });
});
