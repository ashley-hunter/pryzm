import { chmodSync, ensureDirSync, removeSync, writeFileSync } from 'fs-extra';
import { dirname, join } from 'path';
import type { FileChange } from './tree';

export function flushChanges(root: string, fileChanges: FileChange[]): void {
  fileChanges.forEach(f => {
    const fpath = join(root, f.path);
    if (f.type === 'CREATE') {
      ensureDirSync(dirname(fpath));
      writeFileSync(fpath, f.content!);
      if (f.options?.mode) chmodSync(fpath, f.options.mode);
    } else if (f.type === 'UPDATE') {
      writeFileSync(fpath, f.content!);
      if (f.options?.mode) chmodSync(fpath, f.options.mode);
    } else if (f.type === 'DELETE') {
      removeSync(fpath);
    }
  });
}

export function printChanges(fileChanges: FileChange[], indent = ''): void {
  fileChanges.forEach(f => {
    if (f.type === 'CREATE') {
      console.log(`${indent}'CREATE' ${f.path}`);
    } else if (f.type === 'UPDATE') {
      console.log(`${indent}'UPDATE' ${f.path}`);
    } else if (f.type === 'DELETE') {
      console.log(`${indent}'DELETE' ${f.path}`);
    }
  });
}
