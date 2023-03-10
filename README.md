# Pryzm

### Features

| Feature                         | React  | Svelte | Vue | Lit |
| ------------------------------- | ------ | ------ | --- | --- |
| **Props**                       | ✅     | ✅     | ✅  | ✅  |
| **State**                       | ✅     | ✅     | ✅  | ✅  |
| **Computed**                    | ✅     | ✅     | ✅  | ✅  |
| **Methods**                     | ✅     | ✅     | ✅  | ✅  |
| **Events Emitters**             | ✅     | ✅     | ✅  | ❌  |
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

### Todo

- [ ] Vue - Unwrap ref and reactive values
- [ ] React - Unwrap ref usages

### Core and Compiler

| Feature                   | Compiler | Runtime |
| ------------------------- | -------- | ------- |
| **JSX Runtime**           | –        | ❌      |
| **Writing to FileSystem** | ❌       | –       |
| **Multiple Files**        | ❌       | ❌      |
| **Shared Test Suite**     | ❌       | –       |

\* Only `onInit` and `onDestroy` are currently supported

\*\* Callbacks with generics must have an `extends` clause
