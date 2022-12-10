import { join } from 'path';
import * as ts from 'typescript';
import { parseSourceFile } from '../parser/parser';

export function runCLI(tsconfig: string): void {
  const path = join(__dirname, '../../../../example');
  const tsconfigPath = join(path, 'tsconfig.lib.json');

  // load tsconfig.json file
  const { config } = ts.readConfigFile(tsconfigPath, ts.sys.readFile);

  const { options, fileNames, errors } = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    path
  );

  const program = ts.createProgram({
    options,
    rootNames: fileNames,
    configFileParsingDiagnostics: errors,
  });

  // get the source files
  const sourceFiles = program.getSourceFiles();

  // transform source files
  sourceFiles.forEach((sourceFile) => {
    parseSourceFile(sourceFile);
  });
}
