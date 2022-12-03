import * as ts from 'typescript';

/**
 * Create a typescript program given the path to the tsconfig file
 */
export function createTypescriptContext(
  tsConfigPath: string,
  basePath: string,
  compilerOptions: ts.CompilerOptions = {}
) {
  const { config, error } = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
  if (error) {
    throw new Error(error.messageText.toString());
  }
  const parsedConfig = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    basePath,
    compilerOptions
  );
  const program = ts.createProgram(
    parsedConfig.fileNames,
    parsedConfig.options
  );

  // create type checker
  const typeChecker = program.getTypeChecker();

  return {
    program,
    compilerOptions: parsedConfig.options,
    typeChecker,
  };
}
