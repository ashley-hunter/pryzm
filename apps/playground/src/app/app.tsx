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
  const [target, setTarget] = useState<'react' | 'svelte' | 'vue' | 'lit'>('react');

  const output = useMemo(() => {
    setError(null);
    try {
      if (target === 'react') {
        return format(reactPrint(code), {
          plugins: [parserTypeScript, parserCss],
          parser: 'typescript',
        });
      }

      if (target === 'vue') {
        return format(vuePrint(code), {
          plugins: [parserTypeScript, parserCss, parserHtml],
          parser: 'vue',
        });
      }

      if (target === 'lit') {
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
  }, [code, target]);

  // get the sandpack template
  const template = useMemo(() => {
    switch (target) {
      case 'react':
        return 'react-ts';
      case 'vue':
        return 'vue-ts';
      case 'svelte':
        return 'vite-svelte';
      case 'lit':
        return 'vanilla-ts';
    }
  }, [target]);

  // get the primary file name for the sandpack template
  const primaryFile = useMemo(() => {
    switch (target) {
      case 'react':
        return '/App.tsx';
      case 'vue':
        return '/src/App.vue';
      case 'svelte':
        return '/src/App.svelte';
      case 'lit':
        return '/index.ts';
    }
  }, [target]);

  const customSetup = useMemo(() => {
    if (target !== 'lit') {
      return;
    }

    return {
      dependencies: {
        lit: 'latest',
      },
    };
  }, [target]);

  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      jsx: 'react',
      experimentalDecorators: true,
    });
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <nav className="bg-gray-800">
        <div className="mx-auto px-2 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-between">
            <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
              <span className="text-white px-3 py-2 rounded-md text-lg font-medium">
                Pryzm Compiler
                <small className="text-xs font-medium text-gray-400 pl-1">v0.1</small>
              </span>

              <select
                className="ml-auto inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100"
                value={target}
                onChange={event => setTarget(event.target.value as any)}
              >
                <option value="react">React</option>
                <option value="svelte">Svelte</option>
                <option value="vue">Vue</option>
                <option value="lit">Lit</option>
              </select>
            </div>
          </div>
        </div>
      </nav>
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
