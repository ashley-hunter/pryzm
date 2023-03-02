import * as ts from 'typescript';

export class ImportHandler {
  private imports: Record<string, string[]> = {};

  constructor(importDeclarations: ts.ImportDeclaration[]) {
    importDeclarations.forEach(importDeclaration => {
      const library = importDeclaration.moduleSpecifier.getText().replace(/['"]/g, '');

      // if the library is @prysm/core, skip it as they are compile time constructs only
      if (library === '@pryzm/core') {
        return;
      }

      const namedBindings = importDeclaration.importClause?.namedBindings;

      if (namedBindings?.kind === ts.SyntaxKind.NamespaceImport) {
        this.addDefaultImport(namedBindings.name.getText(), library);
      } else if (namedBindings?.kind === ts.SyntaxKind.NamedImports) {
        namedBindings.elements.forEach(element => {
          this.addNamedImport(element.name.getText(), library);
        });
      } else if (importDeclaration.importClause?.name) {
        this.addDefaultImport(importDeclaration.importClause.name.getText(), library);
      }
    });
  }

  addNamedImport(importName: string, library: string): void {
    if (!this.imports[library]) {
      this.imports[library] = [importName];
    } else if (!this.imports[library].includes(importName)) {
      this.imports[library].push(importName);
    }
  }

  addDefaultImport(defaultImport: string, library: string): void {
    if (!this.imports[library]) {
      this.imports[library] = ['default', defaultImport];
    } else if (!this.imports[library].includes('default')) {
      this.imports[library].unshift('default', defaultImport);
    }
  }

  getImports(): string {
    const importStatements: string[] = [];

    Object.keys(this.imports).forEach(library => {
      const importNames = this.imports[library];

      if (importNames.includes('default')) {
        const defaultImportIndex = importNames.indexOf('default');
        importNames.splice(defaultImportIndex, 2);
        importStatements.push(`import ${importNames.join(', ')} from '${library}';`);
      } else {
        importStatements.push(`import { ${importNames.join(', ')} } from '${library}';`);
      }
    });

    return importStatements.join('\n');
  }

  getImportNodes(): ts.ImportDeclaration[] {
    const nodes: ts.ImportDeclaration[] = [];

    Object.keys(this.imports).forEach(library => {
      const importNames = this.imports[library];

      const defaultImportName = importNames.includes('default')
        ? importNames[importNames.indexOf('default') + 1]
        : undefined;

      const namedBindings = importNames
        .filter(name => name !== 'default' && name !== defaultImportName)
        .map(name =>
          ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(name))
        );

      const defaultBinding = defaultImportName
        ? ts.factory.createIdentifier(defaultImportName)
        : undefined;

      const importClause = ts.factory.createImportClause(
        false,
        defaultBinding,
        ts.factory.createNamedImports(namedBindings)
      );

      const importDeclaration = ts.factory.createImportDeclaration(
        undefined,
        importClause,
        ts.factory.createStringLiteral(library)
      );

      nodes.push(importDeclaration);
    });

    return nodes;
  }
}
