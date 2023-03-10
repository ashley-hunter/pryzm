import { Sandpack } from '@codesandbox/sandpack-react';
import Editor from '@monaco-editor/react';
import { print as litPrint } from '@pryzm/lit';
import { print as reactPrint } from '@pryzm/react';
import { print as sveltePrint } from '@pryzm/svelte';
import { print as vuePrint } from '@pryzm/vue';
import { Buffer } from 'buffer';
import * as sveltePlugin from 'prettier-plugin-svelte';
import * as parserHtml from 'prettier/parser-html';
import * as parserCss from 'prettier/parser-postcss';
import * as parserTypeScript from 'prettier/parser-typescript';
import { format } from 'prettier/standalone';
import { useCallback, useMemo, useState } from 'react';
import { Navbar } from './components/navbar';
import { exampleFiles } from './examples/examples';
window.Buffer = Buffer;

export function App() {
  const [code, setCode] = useState(exampleFiles['basic']);
  const [error, setError] = useState<Error | null>(null);
  const [framework, setFramework] = useState<'react' | 'svelte' | 'vue' | 'lit'>('react');

  const output = useMemo(() => {
    setError(null);
    try {
      if (framework === 'react') {
        return format(reactPrint(code), {
          plugins: [parserTypeScript, parserCss],
          parser: 'typescript',
        });
      }

      if (framework === 'vue') {
        return format(vuePrint(code), {
          plugins: [parserTypeScript, parserCss, parserHtml],
          parser: 'vue',
        });
      }

      if (framework === 'lit') {
        return format(litPrint(code), {
          plugins: [parserTypeScript, parserCss, parserHtml],
          parser: 'typescript',
        });
      }

      return format(sveltePrint(code), {
        plugins: [sveltePlugin, parserCss, parserHtml, parserTypeScript],
        parser: 'svelte',
      });
    } catch (e) {
      setError(e as Error);
      return '';
    }
  }, [code, framework]);

  // get the sandpack template
  const template = useMemo(() => {
    switch (framework) {
      case 'react':
        return 'react-ts';
      case 'vue':
        return 'vite-vue';
      case 'svelte':
        return 'vite-svelte-ts';
      case 'lit':
        return 'vanilla-ts';
    }
  }, [framework]);

  // get the primary file name for the sandpack template
  const primaryFile = useMemo(() => {
    switch (framework) {
      case 'react':
        return '/App.tsx';
      case 'vue':
        return '/src/App.vue';
      case 'svelte':
        return '/src/App.svelte';
      case 'lit':
        return '/index.ts';
    }
  }, [framework]);

  const customSetup = useMemo(() => {
    if (framework !== 'lit') {
      return;
    }

    return {
      dependencies: {
        lit: 'latest',
      },
    };
  }, [framework]);

  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      jsx: 'react',
      experimentalDecorators: true,
    });
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar
        framework={framework}
        onFrameworkChange={newFramework =>
          setFramework(newFramework as 'react' | 'svelte' | 'vue' | 'lit')
        }
        onExampleChange={example => setCode(example)}
      />
      <div className="flex flex-1 flex-col">
        <div className="relative flex-1">
          <Editor
            onChange={value => setCode(value!)}
            language="typescript"
            value={code}
            onMount={handleEditorDidMount}
          />
          {error && (
            <div className="absolute left-0 right-0 bottom-0 border-l-4 border-red-500 bg-red-100 px-4 py-1 text-xs text-red-700">
              <p>
                <span className="font-semibold">Error:</span> {error.message}
              </p>
            </div>
          )}
        </div>

        <Sandpack
          template={template}
          customSetup={customSetup}
          options={{
            readOnly: true,
            showTabs: true,
            showRefreshButton: true,
            showConsoleButton: true,
          }}
          files={{
            [primaryFile]: output,
          }}
        />
      </div>
    </div>
  );
}

export default App;
