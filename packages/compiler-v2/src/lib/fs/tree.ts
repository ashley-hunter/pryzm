/**
 * This implementation is largely based on Nx's virtual file system tree.
 * https://github.com/nrwl/nx/blob/master/packages/nx/src/generators/tree.ts
 */

export type Mode = number | string;

/**
 * Options to set when writing a file in the Virtual file system tree.
 */
export interface TreeWriteOptions {
  /**
   * Permission to be granted on the file, given as a string (e.g `755`) or octal integer (e.g `0o755`).
   * The logical OR operator can be used to separate multiple permissions.
   * See https://nodejs.org/api/fs.html#fs_file_modes
   */
  mode?: Mode;
}

/**
 * Virtual file system tree.
 */
export interface Tree {
  /**
   * Root of the workspace. All paths are relative to this.
   */
  root: string;

  /**
   * Read the contents of a file.
   * @param filePath A path to a file.
   */
  read(filePath: string): Buffer | null;

  /**
   * Read the contents of a file as string.
   * @param filePath A path to a file.
   * @param encoding the encoding for the result
   */
  read(filePath: string, encoding: BufferEncoding): string | null;

  /**
   * Update the contents of a file or create a new file.
   */
  write(filePath: string, content: Buffer | string, options?: TreeWriteOptions): void;

  /**
   * Check if a file exists.
   */
  exists(filePath: string): boolean;

  /**
   * Delete the file.
   */
  delete(filePath: string): void;

  /**
   * Rename the file or the folder.
   */
  rename(from: string, to: string): void;

  /**
   * Check if this is a file or not.
   */
  isFile(filePath: string): boolean;

  /**
   * Returns the list of children of a folder.
   */
  children(dirPath: string): string[];

  /**
   * Returns the list of currently recorded changes.
   */
  listChanges(): FileChange[];

  /**
   * Changes permissions of a file.
   * @param filePath A path to a file.
   * @param mode The permission to be granted on the file, given as a string (e.g `755`) or octal integer (e.g `0o755`).
   * See https://nodejs.org/api/fs.html#fs_file_modes.
   */
  changePermissions(filePath: string, mode: Mode): void;

  /**
   * Returns the list of files that match the given glob pattern.
   * @param dirPath A path to a directory.
   * @param glob A glob pattern.
   */
  listFiles(dirPath: string, glob: string): string[];
}

/**
 * Description of a file change in the Nx virtual file system/
 */
export interface FileChange {
  /**
   * Path relative to the workspace root
   */
  path: string;

  /**
   * Type of change: 'CREATE' | 'DELETE' | 'UPDATE'
   */
  type: 'CREATE' | 'DELETE' | 'UPDATE';

  /**
   * The content of the file or null in case of delete.
   */
  content: Buffer | null;
  /**
   * Options to set on the file being created or updated.
   */
  options?: TreeWriteOptions;
}
