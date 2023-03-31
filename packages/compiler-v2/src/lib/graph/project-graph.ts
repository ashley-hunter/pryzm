import * as ts from 'typescript';
import { SourceFile } from 'typescript';
import { ComponentMetadata } from '../compiler/component/model';
import { parseFile } from '../compiler/parser';
import { ProviderMetadata } from '../compiler/provider/model';
import { PryzmConfig } from '../config/config';
import { Tree } from '../fs';

interface ProjectGraphOptions {
  tree: Tree;
  config: PryzmConfig;
}

// interface Dependency {
//   from: string;
//   to: string;
// }

export class ProjectGraph {
  private tree: Tree;
  private config: PryzmConfig;
  private files: SourceFile[] = [];
  // private dependencies: Dependency[] = [];
  private components: ComponentMetadata[] = [];
  private providers: ProviderMetadata[] = [];

  constructor({ tree, config }: ProjectGraphOptions) {
    this.tree = tree;
    this.config = config;
    this.loadFiles();
    // this.calculateDependencies();
    this.parseFiles();
  }

  private loadFiles(): void {
    const files = this.tree.listFiles(this.config.rootDir, '**/*.ts?(x)');

    for (const file of files) {
      const source = this.tree.read(file, 'utf8')!;
      const sourceFile = ts.createSourceFile(
        file,
        source,
        ts.ScriptTarget.ES2015,
        true,
        ts.ScriptKind.TSX
      );
      this.files.push(sourceFile);
    }
  }

  private parseFiles(): void {
    for (const sourceFile of this.files) {
      const output = parseFile(sourceFile);

      if (output.component) {
        this.components.push(output.component);
      }

      if (output.provider) {
        this.providers.push(output.provider);
      }
    }
  }

  // private calculateDependencies(): void {
  //   for (const sourceFile of this.files) {
  //     const from = sourceFile.fileName;

  //     const importNodes = tsquery<ts.ImportDeclaration>(sourceFile, 'ImportDeclaration');
  //     for (const importNode of importNodes) {
  //       const importedModule = importNode.moduleSpecifier.getText(sourceFile).slice(1, -1);
  //       const to = this.resolveImport(sourceFile.fileName, importedModule);
  //       if (to) {
  //         this.dependencies.push({ from, to });
  //       }
  //     }
  //   }
  // }

  // private resolveImport(from: string, importedModule: string): string | undefined {
  //   const fromDir = path.dirname(from);
  //   const pathsToTry = [
  //     `${importedModule}.ts`,
  //     `${importedModule}/index.ts`,
  //     `${importedModule}.tsx`,
  //     `${importedModule}/index.tsx`,
  //   ];

  //   for (const p of pathsToTry) {
  //     const fullPath = path.join(fromDir, p);
  //     if (this.tree.isFile(fullPath)) {
  //       return p;
  //     } else {
  //       const indexFile = path.join(fullPath, 'index.ts');
  //       if (this.tree.isFile(indexFile)) {
  //         return indexFile;
  //       }
  //     }
  //   }

  //   return undefined;
  // }

  getFiles(): SourceFile[] {
    return this.files;
  }

  // getDependencies(): Dependency[] {
  //   return this.dependencies;
  // }
}
