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
window.Buffer = Buffer;

export function App() {
  const [code, setCode] = useState(`import { Component, Prop, Computed, State } from '@pryzm/core';

@Component()
export class App {

  @Prop() readonly firstName = "John";
  @Prop() readonly lastName = "Smith";

  @State() counter: number = 10;

  @Computed() get fullName() {
    return this.firstName + ' ' + this.lastName;
  }

  render() {
    return <div>Something Here</div>
  }

}`);
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
        return 'vite-svelte';
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
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar
        framework={framework}
        setFramework={newFramework =>
          setFramework(newFramework as 'react' | 'svelte' | 'vue' | 'lit')
        }
      />
      <div className="flex flex-col flex-1">
        <div className="relative flex-1">
          <Editor
            onChange={value => setCode(value!)}
            language="typescript"
            value={code}
            onMount={handleEditorDidMount}
          />
          {error && (
            <div className="absolute left-0 right-0 bottom-0 bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-1 text-xs">
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
