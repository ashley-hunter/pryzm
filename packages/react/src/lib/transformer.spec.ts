import { transform } from '@emblazon/compiler';
import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { transformer } from './transformer';
describe('React Transformer', () => {
  // create a printer to convert the transformed source back to text
  const printer = ts.createPrinter();

  describe('State', () => {
    it('should transform state into a useState hook', () => {
      const source = `
      import { Component, State } from '@emblazon/core';
      @Component()
      export class Test {
        @State() test: string;

        render() {
          return <div />;
        }
      }
    `;
      const component = transform(source, transformer)[0];
      const state = component.states[0];

      expect(state.getter).toBe('test');
      expect(state.setter).toBe('setTest');
      expect(printNode(state.statement)).toMatchInlineSnapshot(
        '"const [test, setTest] = useState<string>();"'
      );
    });

    it('should transform state into a useState hook with a default value', () => {
      const source = `
      import { Component, State } from '@emblazon/core';
      @Component()
      export class Test {
        @State() test: string = 'test';

        render() {
          return <div />;
        }
      }
    `;
      const component = transform(source, transformer)[0];
      const state = component.states[0];

      expect(state.getter).toBe('test');
      expect(state.setter).toBe('setTest');
      expect(printNode(state.statement)).toMatchInlineSnapshot(
        '"const [test, setTest] = useState<string>(\\"test\\");"'
      );
    });

    it('should transform state into a useState hook with a default value without a type', () => {
      const source = `
      import { Component, State } from '@emblazon/core';
      @Component()
      export class Test {
        @State() test = 'test';

        render() {
          return <div />;
        }
      }
    `;
      const component = transform(source, transformer)[0];
      const state = component.states[0];

      expect(state.getter).toBe('test');
      expect(state.setter).toBe('setTest');
      expect(printNode(state.statement)).toMatchInlineSnapshot(
        '"const [test, setTest] = useState<string>(\\"test\\");"'
      );
    });

    it('should transform state into a useState hook with a default value from a function', () => {
      const source = `
      import { Component, State } from '@emblazon/core';
      @Component()
      export class Test {
        @State() test = () => 'test';

        render() {
          return <div />;
        }
      }
    `;

      const component = transform(source, transformer)[0];
      const state = component.states[0];

      expect(state.getter).toBe('test');
      expect(state.setter).toBe('setTest');
      expect(printNode(state.statement)).toMatchInlineSnapshot(
        '"const [test, setTest] = useState<() => any>(() => \\"test\\");"'
      );
    });

    it('should transform state into a useState hook with a default number value', () => {
      const source = `
      import { Component, State } from '@emblazon/core';
      @Component()
      export class Test {
        @State() test: number = 1;

        render() {
          return <div />;
        }
      }
    `;
      const component = transform(source, transformer)[0];
      const state = component.states[0];

      expect(state.getter).toBe('test');
      expect(state.setter).toBe('setTest');
      expect(printNode(state.statement)).toMatchInlineSnapshot(
        '"const [test, setTest] = useState<number>(1);"'
      );
    });

    it('should transform state into a useState hook with a default boolean value', () => {
      const source = `
      import { Component, State } from '@emblazon/core';
      @Component()
      export class Test {
        @State() test: boolean = true;

        render() {
          return <div />;
        }
      }
    `;
      const component = transform(source, transformer)[0];
      const state = component.states[0];

      expect(state.getter).toBe('test');
      expect(state.setter).toBe('setTest');
      expect(printNode(state.statement)).toMatchInlineSnapshot(
        '"const [test, setTest] = useState<boolean>(true);"'
      );
    });

    it('should transform state into a useState hook with a default array value', () => {
      const source = `
      import { Component, State } from '@emblazon/core';
      @Component()
      export class Test {
        @State() test: string[] = ['test'];

        render() {
          return <div />;
        }
      }
    `;
      const component = transform(source, transformer)[0];
      const state = component.states[0];

      expect(state.getter).toBe('test');
      expect(state.setter).toBe('setTest');
      expect(printNode(state.statement)).toMatchInlineSnapshot(
        '"const [test, setTest] = useState<string[]>([\\"test\\"]);"'
      );
    });

    it('should transform state into a useState hook with a default object value', () => {
      const source = `
      import { Component, State } from '@emblazon/core';
      @Component()
      export class Test {
        @State() test: { test: string } = { test: 'test' };

        render() {
          return <div />;
        }
      }
    `;
      const component = transform(source, transformer)[0];
      const state = component.states[0];

      expect(state.getter).toBe('test');
      expect(state.setter).toBe('setTest');
      expect(printNode(state.statement)).toMatchInlineSnapshot(`
        "const [test, setTest] = useState<{
            test: string;
        }>({ test: \\"test\\" });"
      `);
    });

    it('should transform state into a useState hook resolving `this` in property accesses', () => {
      const source = `
      import { Component, State, Prop } from '@emblazon/core';
      @Component()
      export class Test {
        @Prop() readonly name: string;
        @State() test: string = this.name;

        render() {
          return <div />;
        }
      }
    `;
      const component = transform(source, transformer)[0];
      const state = component.states[0];

      expect(state.getter).toBe('test');
      expect(state.setter).toBe('setTest');
      expect(printNode(state.statement)).toMatchInlineSnapshot(
        '"const [test, setTest] = useState<string>(name);"'
      );
    });

    it('should transform state into a useState hook resolving `this` in call expressions', () => {
      const source = `
      import { Component, State, Prop } from '@emblazon/core';
      @Component()
      export class Test {
        @State() test: string = this.name();

        name() {
          return 'test';
        }

        render() {
          return <div />;
        }
      }
    `;
      const component = transform(source, transformer)[0];
      const state = component.states[0];

      expect(state.getter).toBe('test');
      expect(state.setter).toBe('setTest');
      expect(printNode(state.statement)).toMatchInlineSnapshot(
        '"const [test, setTest] = useState<string>(name());"'
      );
    });
  });

  describe('Prop', () => {
    it('should transform prop into a property', () => {
      const source = `
      import { Component, Prop } from '@emblazon/core';
      @Component()
      export class Test {
        /** Define the value of the test prop */
        @Prop() readonly test: string;

        render() {
          return <div />;
        }
      }
    `;
      const component = transform(source, transformer)[0];
      const prop = component.props[0];

      expect(prop.name).toBe('test');
      expect(printNode(prop.interfaceProperty)).toMatchInlineSnapshot(`
        "/* Define the value of the test prop */
        test: string;"
      `);
      expect(printNode(prop.destructuredProperty)).toMatchInlineSnapshot(
        '"test"'
      );
    });

    it('should transform prop into a property with a default value', () => {
      const source = `
      import { Component, Prop } from '@emblazon/core';
      @Component()
      export class Test {
        @Prop() readonly test: string = 'test';

        render() {
          return <div />;
        }
      }
    `;
      const component = transform(source, transformer)[0];
      const prop = component.props[0];

      expect(prop.name).toBe('test');
      expect(printNode(prop.interfaceProperty)).toMatchInlineSnapshot(
        '"test: string;"'
      );
      expect(printNode(prop.destructuredProperty)).toMatchInlineSnapshot(
        '"test = \\"test\\""'
      );
    });

    it('should transform prop into a property with a default value from a function', () => {
      const source = `
      import { Component, Prop } from '@emblazon/core';
      @Component()
      export class Test {
        @Prop() readonly test = () => 'test';

        render() {
          return <div />;
        }
      }
    `;
      const component = transform(source, transformer)[0];
      const prop = component.props[0];

      expect(prop.name).toBe('test');
      expect(printNode(prop.interfaceProperty)).toMatchInlineSnapshot(
        '"test: () => any;"'
      );
      expect(printNode(prop.destructuredProperty)).toMatchInlineSnapshot(
        '"test = () => \\"test\\""'
      );
    });
  });

  describe('Computed', () => {
    it('should transform computed into a useMemo', () => {
      const source = `
      import { Component, Computed } from '@emblazon/core';

      @Component()
      export class Test {
        @Computed() get test() {
          return 'test';
        }

        render() {
          return <div />;
        }
      }
    `;
      const component = transform(source, transformer)[0];
      const computed = component.computed[0];

      expect(computed.name).toBe('test');
      expect(printNode(computed.statement)).toMatchInlineSnapshot(`
        "const test = useMemo(() => {
            return \\"test\\";
        }, []);"
      `);
    });

    it('should transform computed into a useMemo with dependencies', () => {
      const source = `
      import { Component, Computed } from '@emblazon/core';

      @Component()
      export class Test {

        @State() firstName: string = 'John';
        @State() lastName: string = 'Doe';

        @Computed() get test() {
          return \`\${this.firstName} \${this.lastName}\`;
        }

        render() {
          return <div />;
        }
      }
    `;
      const component = transform(source, transformer)[0];
      const computed = component.computed[0];

      expect(computed.name).toBe('test');
      expect(printNode(computed.statement)).toMatchInlineSnapshot(`
        "const test = useMemo(() => {
            return \`\${firstName} \${lastName}\`;
        }, [firstName, lastName]);"
      `);
    });
  });

  describe('Ref', () => {
    it('should transform ref into a useRef', () => {
      const source = `
      import { Component, Ref } from '@emblazon/core';

      @Component()
      export class Test {
        @Ref() test: HTMLDivElement;

        render() {
          return <div ref={this.test} />;
        }
      }
    `;

      const component = transform(source, transformer)[0];
      const ref = component.refs[0];

      expect(ref.name).toBe('test');
      expect(printNode(ref.statement)).toMatchInlineSnapshot(
        '"const test = useRef<HTMLDivElement>(null);"'
      );
    });

    it('should transform ref into a useRef with no type', () => {
      const source = `
      import { Component, Ref } from '@emblazon/core';

      @Component()
      export class Test {
        @Ref() test;

        render() {
          return <div ref={this.test} />;
        }
      }
    `;

      const component = transform(source, transformer)[0];
      const ref = component.refs[0];

      expect(ref.name).toBe('test');
      expect(printNode(ref.statement)).toMatchInlineSnapshot(
        '"const test = useRef<HTMLElement>(null);"'
      );
    });
  });

  describe('Method', () => {
    it('should transform method into a useCallback function', () => {
      const source = `
      import { Component } from '@emblazon/core';

      @Component()
      export class Test {
        test() {
          return 'test';
        }

        render() {
          return <div />;
        }
      }
    `;

      const component = transform(source, transformer)[0];
      const method = component.methods[0];

      expect(method.name).toBe('test');
      expect(printNode(method.statement)).toMatchInlineSnapshot(`
        "const test = useCallback(() => {
            return \\"test\\";
        }, []);"
      `);
    });

    it('should transform method into a useCallback function with dependencies', () => {
      const source = `
      import { Component } from '@emblazon/core';

      @Component()
      export class Test {
        @State() firstName: string = 'John';
        @State() lastName: string = 'Doe';

        test() {
          return \`\${this.firstName} \${this.lastName}\`;
        }

        render() {
          return <div />;
        }
      }
    `;

      const component = transform(source, transformer)[0];
      const method = component.methods[0];

      expect(method.name).toBe('test');
      expect(printNode(method.statement)).toMatchInlineSnapshot(`
        "const test = useCallback(() => {
            return \`\${firstName} \${lastName}\`;
        }, [firstName, lastName]);"
      `);
    });

    it('should transform method into a useCallback function with a parameter', () => {
      const source = `
      import { Component } from '@emblazon/core';

      @Component()
      export class Test {
        test(value: string) {
          return value;
        }

        render() {
          return <div />;
        }
      }
    `;

      const component = transform(source, transformer)[0];
      const method = component.methods[0];

      expect(method.name).toBe('test');
      expect(printNode(method.statement)).toMatchInlineSnapshot(`
        "const test = useCallback((value: string) => {
            return value;
        }, []);"
      `);
    });

    it('should transform method into a useCallback function with a parameter and dependencies', () => {
      const source = `
      import { Component } from '@emblazon/core';

      @Component()
      export class Test {
        @State() firstName: string = 'John';
        @State() lastName: string = 'Doe';

        test(value: string) {
          return \`\${this.firstName} \${this.lastName} \${value}\`;
        }

        render() {
          return <div />;
        }
      }
    `;

      const component = transform(source, transformer)[0];
      const method = component.methods[0];

      expect(method.name).toBe('test');
      expect(printNode(method.statement)).toMatchInlineSnapshot(`
        "const test = useCallback((value: string) => {
            return \`\${firstName} \${lastName} \${value}\`;
        }, [firstName, lastName]);"
      `);
    });

    it('should transform method into a useCallback function with a dependency on another method', () => {
      const source = `
      import { Component } from '@emblazon/core';

      @Component()
      export class Test {
        @State() firstName: string = 'John';
        @State() lastName: string = 'Doe';

        test() {
          return this.calculate();
        }

        calculate() {
          return \`\${this.firstName} \${this.lastName}\`;
        }

        render() {
          return <div />;
        }
      }
    `;
      const component = transform(source, transformer)[0];
      const method = component.methods[0];

      expect(method.name).toBe('test');
      expect(printNode(method.statement)).toMatchInlineSnapshot(`
        "const test = useCallback(() => {
            return calculate();
        }, [calculate]);"
      `);
    });

    it('should transform method into a useCallback function with a dependency on a setter', () => {
      const source = `
      import { Component } from '@emblazon/core';

      @Component()
      export class Test {
        @State() name: string = 'John';

        test() {
          this.name = 'Doe';
        }

        render() {
          return <div />;
        }
      }
    `;
      const component = transform(source, transformer)[0];
      const method = component.methods[0];

      expect(method.name).toBe('test');
      expect(printNode(method.statement)).toMatchInlineSnapshot(`
        "const test = useCallback(() => {
            setName(\\"Doe\\");
        }, [setName]);"
      `);
    });
  });

  function printNode(node: ts.Node) {
    return printer.printNode(ts.EmitHint.Unspecified, node, null as any);
  }
});
