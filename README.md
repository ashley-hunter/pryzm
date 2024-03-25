<img width="292" height="28" alt="image" src="https://github.com/ashley-hunter/pryzm/assets/20795331/efb0f5d1-899d-42ab-b634-0e28a75f0714">

<br />
<br />

Pryzm is an experimental project exploring the ability to take a TypeScript component with JSX and transpiling it into multiple frameworks.

Check out [our playground here](https://ashley-hunter.github.io/pryzm/).

<img width="709" height="532" alt="image" src="https://github.com/ashley-hunter/pryzm/assets/20795331/9b81da9e-a14c-4441-885a-7b44f8f344f8">

### Features

| Feature                         | React  | Svelte | Vue | Lit |
| ------------------------------- | ------ | ------ | --- | --- |
| **Props**                       | ✅     | ✅     | ✅  | ✅  |
| **State**                       | ✅     | ✅     | ✅  | ✅  |
| **Computed**                    | ✅     | ✅     | ✅  | ✅  |
| **Methods**                     | ✅     | ✅     | ✅  | ✅  |
| **Events Emitters**             | ✅     | ✅     | ✅  | ✅  |
| **Required/Optional Props**     | ❌     | ❌     | ❌  | ❌  |
| **Required/Optional Events**    | ❌     | ❌     | ❌  | ❌  |
| **Template Events**             | ✅     | ✅     | ✅  | ✅  |
| **Styles**                      | ✅     | ✅     | ✅  | ✅  |
| **Refs**                        | ✅     | ✅     | ✅  | ✅  |
| **Slots**                       | ✅     | ✅     | ✅  | ✅  |
| **Named Slots**                 | ✅     | ✅     | ✅  | ✅  |
| **Retain Imports**              | ✅     | ✅     | ✅  | ✅  |
| **Forward Ref**                 | ❌     | –      | –   | –   |
| **Comment Extraction**          | ✅     | ✅     | ✅  | ✅  |
| **Lifecycle Hooks**\*           | ⚠️     | ⚠️     | ⚠️  | ⚠️  |
| **Providers/DI**                | ❌     | ❌     | ❌  | ❌  |
| **Conditional Classes**         | ✅     | ✅     | ✅  | ✅  |
| **Inline Styles**               | ✅     | ✅     | ✅  | ✅  |
| **Loops**                       | ✅     | ✅     | ✅  | ✅  |
| **Keyed Loops**                 | ✅     | ✅     | ✅  | ✅  |
| **Conditional Render**          | ✅     | ✅     | ✅  | ✅  |
| **Conditional Render Fallback** | ✅     | ✅     | ✅  | ✅  |
| **Child Components**            | ❌     | ❌     | ❌  | ❌  |
| **Attribute Inheritance**       | ❌     | ❌     | ❌  | –   |
| **Async Methods**               | ✅     | ✅     | ✅  | ✅  |
| **Component Generics**          | ❌     | ❌     | ❌  | ❌  |
| **Methods Generics**            | ⚠️\*\* | –      | ✅  | ✅  |
| **Define Selector**             | –      | –      | –   | ✅  |
| **Component Previews**          | ✅     | ✅     | ✅  | ❌  |
| **Directives**                  | ❌     | ❌     | ❌  | ❌  |

### Core and Compiler

| Feature                   | Compiler | Runtime |
| ------------------------- | -------- | ------- |
| **Method Sorting**        | ✅       | –       |
| **JSX Runtime**           | –        | ❌      |
| **Writing to FileSystem** | ❌       | –       |
| **Multiple Files**        | ❌       | ❌      |
| **Shared Test Suite**     | ❌       | –       |

\* Only `onInit` and `onDestroy` are currently supported

\*\* Callbacks with generics must have an `extends` clause
