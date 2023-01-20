import { transform } from '@pryzm/compiler';
import { transformer } from '@pryzm/react';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';
import { useMemo, useState } from 'react';
import Editor from 'react-simple-code-editor';
import ts from 'typescript';

const printer = ts.createPrinter();

export function App() {
  const [code, setCode] = useState(`function add(a, b) {\n  return a + b;\n}`);
  const output = useMemo(() => {
    debugger;
    const transformed = transform(code, transformer)[0];

    return transformed
      ? printer.printNode(
          ts.EmitHint.Unspecified,
          transformed as any,
          null as any
        )
      : '';
  }, [code]);

  return (
    <div className="flex flex-col h-screen">
      <nav className="bg-gray-800">
        <div className="mx-auto px-2 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-between">
            <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
              {/* <div className="flex flex-shrink-0 items-center">
              <img
                className="h-8 w-auto"
                src="/assets/logo.svg"
                alt="Your Company"
              />
            </div> */}

              <span className="text-white px-3 py-2 rounded-md text-lg font-medium">
                Pryzm
                <small className="text-xs font-medium text-gray-400 pl-1">
                  v0.1
                </small>
              </span>
            </div>
          </div>
        </div>
      </nav>
      <div className="flex flex-1">
        <Editor
          className="flex-1 border-r h-full"
          value={code}
          onValueChange={(code) => setCode(code)}
          highlight={(code) => highlight(code, languages.js)}
          padding={10}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 12,
          }}
        />
        <Editor
          className="flex-1 h-full"
          value={output}
          onValueChange={(code) => {}}
          highlight={(code) => highlight(code, languages.js)}
          padding={10}
          disabled
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 12,
          }}
        />
      </div>
    </div>
  );
}

export default App;
