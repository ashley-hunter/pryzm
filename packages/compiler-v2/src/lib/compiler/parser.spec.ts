import * as ts from 'typescript';
import { parseFile } from './parser';

describe('Parser', () => {
  it('should parse the selector', () => {
    const output = parse(`
      import { Component } from '@pryzm/core';

      @Component({
        selector: 'my-component'
      })
      export class MyComponent {
        render() {
          return <div>Hello World</div>;
        }
      }
    `);

    expect(output.component).toBeDefined();
    expect(output.component!.selector).toBe('my-component');
  });

  it('should parse the styles', () => {
    const output = parse(`
      import { Component } from '@pryzm/core';

      @Component({
        styles: \`
          .show {
            display: block;
          }
          .hide {
            display: none;
          }
        \`
      })
      export class MyComponent {
        render() {
          return <div>Hello World</div>;
        }
      }
    `);

    expect(output.component!.styles).toMatchInlineSnapshot(`
      ".show {
                  display: block;
                }
                .hide {
                  display: none;
                }"
    `);
  });

  it('should parse props', () => {
    const output = parse(`
      import { Component } from '@pryzm/core';

      @Component()
      export class MyComponent {
        @Prop() readonly myProp: string;

        render() {
          return <div>Hello World</div>;
        }
      }
    `);

    expect(output.component!.props).toHaveLength(1);
  });

  it('should parse refs', () => {
    const output = parse(`
      import { Component, Ref } from '@pryzm/core';

      @Component()
      export class MyComponent {
        @Ref() private readonly myRef: HTMLElement;

        render() {
          return <div ref={this.myRef}>Hello World</div>;
        }
      }
    `);

    expect(output.component!.refs).toHaveLength(1);
  });

  it('should parse computed', () => {
    const output = parse(`
      import { Component, Computed } from '@pryzm/core';

      @Component()
      export class MyComponent {
        @Computed() private get myComputed() {
          return 'Hello World';
        }

        render() {
          return <div>{this.myComputed}</div>;
        }
      }
    `);

    expect(output.component!.computed).toHaveLength(1);
  });

  it('should parse context', () => {
    const output = parse(`
      import { Component, Inject } from '@pryzm/core';

      @Component()
      export class MyComponent {
        @Inject() private readonly myContext: SomeContext;

        render() {
          return <div>{this.myContext}</div>;
        }
      }
    `);

    expect(output.component!.context).toHaveLength(1);
  });

  it('should parse events', () => {
    const output = parse(`
      import { Component, Event, EventEmitter } from '@pryzm/core';

      @Component()
      export class MyComponent {
        @Event() readonly myEvent = new EventEmitter<string>();

        render() {
          return <div>Hello World</div>;
        }
      }
    `);

    expect(output.component!.events).toHaveLength(1);
  });

  it('should parse state', () => {
    const output = parse(`
      import { Component, State } from '@pryzm/core';

      @Component()
      export class MyComponent {
        @State() private readonly myState: string;

        render() {
          return <div>Hello World</div>;
        }
      }
    `);

    expect(output.component!.state).toHaveLength(1);
  });

  it('should parse methods', () => {
    const output = parse(`
      import { Component } from '@pryzm/core';

      @Component()
      export class MyComponent {
        private myMethod() {
          return 'Hello World';
        }

        render() {
          return <div>Hello World</div>;
        }
      }
    `);

    expect(output.component!.methods).toHaveLength(1);
  });

  it('should parse lifecycle hooks', () => {
    const output = parse(`
      import { Component } from '@pryzm/core';

      @Component()
      export class MyComponent {
        private onInit() {}
        private onDestroy() {}

        render() {
          return <div>Hello World</div>;
        }
      }
    `);

    expect(output.component!.onInit).toBeDefined();
    expect(output.component!.onDestroy).toBeDefined();
  });

  it('should parse the template', () => {
    const output = parse(`
      import { Component } from '@pryzm/core';

      @Component()
      export class MyComponent {
        render() {
          return <div>Hello World</div>;
        }
      }
    `);

    expect(output.component!.template).toBeDefined();
  });

  it('should parse the default slot', () => {
    const output = parse(`
      import { Component } from '@pryzm/core';

      @Component()
      export class MyComponent {
        render() {
          return (
            <div>
              <slot />
            </div>
          );
        }
      }
    `);

    expect(output.component!.slots).toEqual(['default']);
  });

  it('should parse the named slots', () => {
    const output = parse(`
      import { Component } from '@pryzm/core';

      @Component()
      export class MyComponent {
        render() {
          return (
            <div>
              <slot name="header" />
              <slot name="footer" />
            </div>
          );
        }
      }
    `);

    expect(output.component!.slots).toEqual(['header', 'footer']);
  });
});

function parse(source: string) {
  const sourceFile = ts.createSourceFile(
    'test.ts',
    source,
    ts.ScriptTarget.ES2015,
    true,
    ts.ScriptKind.TSX
  );
  return parseFile(sourceFile);
}
