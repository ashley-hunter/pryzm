import { print } from '@pryzm/react';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';
import { useMemo, useState } from 'react';
import Editor from 'react-simple-code-editor';

export function App() {
  const [code, setCode] = useState(`// Start typing here...`);
  const [error, setError] = useState<Error | null>(null);

  const output = useMemo(() => {
    setError(null);
    try {
      return print(code);
    } catch (e) {
      setError(e as Error);
      return '';
    }
  }, [code, setError]);

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
          className="flex-1 border-r h-full outline-none"
          value={code}
          onValueChange={(code) => setCode(code)}
          highlight={(code) => highlight(code, languages.js)}
          padding={10}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 14,
          }}
        />

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 flex-1">
            <p className="font-bold">Error</p>
            <p>{error.message}</p>
          </div>
        )}

        {!error && (
          <Editor
            className="flex-1 h-full"
            value={output}
            onValueChange={(code) => {}}
            highlight={(code) => highlight(code, languages.js)}
            padding={10}
            disabled
            style={{
              fontFamily: '"Fira code", "Fira Mono", monospace',
              fontSize: 14,
            }}
          />
        )}
      </div>
    </div>
  );
}

export default App;
