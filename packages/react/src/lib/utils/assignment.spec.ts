import * as ts from 'typescript';
import { transformAssignment } from './assignment';

describe('Assignment', () => {
  it('should convert a simple assignment', () => {
    const source = `
      import { Component, State } from '@emblazon/core';

      @Component()
      export class Test {
        @State() test: string = 'test';

        update() {
          this.test = 'test';
        }

        render() {
          return <div />;
        }
      }
    `;
    const result = transform(source);
    expect(result).toMatchInlineSnapshot(`
      "import { Component, State } from '@emblazon/core';
      @Component()
      export class Test {
          @State()
          test: string = 'test';
          update() {
              setTest('test');
          }
          render() {
              return <div />;
          }
      }
      "
    `);
  });

  it('should convert a simple assignment with a spread', () => {
    const source = `
      import { Component, State } from '@emblazon/core';

      @Component()
      export class Test {
        @State() test = { test: 'old };

        update() {
          this.test = { ...this.test, test: 'new' };
        }

        render() {
          return <div />;
        }
      }
    `;

    const result = transform(source);
    expect(result).toMatchInlineSnapshot(`
      "import { Component, State } from '@emblazon/core';
      @Component()
      export class Test {
          @State()
          test = { test: 'old };,
              update() {
                  setTest({ ...test, test: 'new' });
              },
              render() {
                  return <div />;
              } };
      }
      "
    `);
  });

  it('should convert a simple assignment of an array', () => {
    const source = `
      import { Component, State } from '@emblazon/core';

      @Component()
      export class Test {
        @State() test = ['old'];

        update() {
          this.test = ['new'];
        }

        render() {
          return <div />;
        }
      }
    `;

    const result = transform(source);
    expect(result).toMatchInlineSnapshot(`
      "import { Component, State } from '@emblazon/core';
      @Component()
      export class Test {
          @State()
          test = ['old'];
          update() {
              setTest(['new']);
          }
          render() {
              return <div />;
          }
      }
      "
    `);
  });

  it('should convert a simple assignment of an array with a spread', () => {
    const source = `
      import { Component, State } from '@emblazon/core';

      @Component()
      export class Test {
        @State() test = ['old'];

        update() {
          this.test = [...this.test, 'new'];
        }

        render() {
          return <div />;
        }
      }
    `;

    const result = transform(source);
    expect(result).toMatchInlineSnapshot(`
      "import { Component, State } from '@emblazon/core';
      @Component()
      export class Test {
          @State()
          test = ['old'];
          update() {
              setTest([...test, 'new']);
          }
          render() {
              return <div />;
          }
      }
      "
    `);
  });

  it('should convert an assignment using +=', () => {
    const source = `
      import { Component, State } from '@emblazon/core';

      @Component()
      export class Test {
        @State() test = 0;

        update() {
          this.test += 1;
        }

        render() {
          return <div />;
        }
      }
    `;

    const result = transform(source);
    expect(result).toMatchInlineSnapshot(`
      "import { Component, State } from '@emblazon/core';
      @Component()
      export class Test {
          @State()
          test = 0;
          update() {
              setTest(test => test + 1);
          }
          render() {
              return <div />;
          }
      }
      "
    `);
  });

  it('should convert an assignment using ++', () => {
    const source = `
      import { Component, State } from '@emblazon/core';

      @Component()
      export class Test {
        @State() test = 0;

        update() {
          this.test++;
        }

        render() {
          return <div />;
        }
      }
    `;

    const result = transform(source);
    expect(result).toMatchInlineSnapshot(`
      "import { Component, State } from '@emblazon/core';
      @Component()
      export class Test {
          @State()
          test = 0;
          update() {
              setTest(test => test + 1);
          }
          render() {
              return <div />;
          }
      }
      "
    `);
  });

  it('should allow deep assignments', () => {
    const source = `
      import { Component, State } from '@emblazon/core';

      @Component()
      export class Test {
        @State() test = { test: 'old };

        update() {
          this.test.test = 'new';
        }

        render() {
          return <div />;
        }
      }`;

    const result = transform(source);
    expect(result).toMatchInlineSnapshot(`
      "import { Component, State } from '@emblazon/core';
      @Component()
      export class Test {
          @State()
          test = { test: 'old };,
              update() {
                  setTest(test => ({ test: 'new' }));
              },
              render() {
                  return <div />;
              } };
      }
      "
    `);
  });

  function transform(source: string): string {
    const sourceFile = ts.createSourceFile(
      'test.ts',
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

    const output = transformAssignment(sourceFile);

    const printer = ts.createPrinter();
    return printer.printFile(output);
  }
});
