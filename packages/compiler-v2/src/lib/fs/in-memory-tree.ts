import * as minimatch from 'minimatch';
import { dirname, join, relative } from 'path-browserify';
import { FileChange, Mode, Tree, TreeWriteOptions } from './tree';

export class InMemoryTree implements Tree {
  private recordedChanges: {
    [path: string]: {
      content: Buffer | null;
      isDeleted: boolean;
      options?: TreeWriteOptions;
    };
  } = {};

  constructor(readonly root: string, private readonly isVerbose: boolean = false) {}

  read(filePath: string): Buffer | null;
  read(filePath: string, encoding: BufferEncoding): string | null;
  read(filePath: string, encoding?: BufferEncoding): Buffer | string | null {
    filePath = this.normalize(filePath);
    try {
      let content: Buffer | null;
      if (this.recordedChanges[this.rp(filePath)]) {
        content = this.recordedChanges[this.rp(filePath)].content;
      } else {
        content = Buffer.alloc(0);
      }

      return encoding ? content!.toString(encoding) : content;
    } catch (e) {
      if (this.isVerbose) {
        console.error(e);
      }
      return null;
    }
  }

  write(filePath: string, content: Buffer | string, options?: TreeWriteOptions): void {
    filePath = this.normalize(filePath);
    if (this.exists(this.rp(filePath)) && Buffer.from(content).equals(this.read(filePath)!)) {
      // Remove recorded change because the file has been restored to it's original contents
      delete this.recordedChanges[this.rp(filePath)];
      return;
    }
    try {
      this.recordedChanges[this.rp(filePath)] = {
        content: Buffer.from(content),
        isDeleted: false,
        options,
      };
    } catch (e) {
      if (this.isVerbose) {
        console.error(e);
      }
    }
  }

  overwrite(filePath: string, content: Buffer | string, options?: TreeWriteOptions): void {
    filePath = this.normalize(filePath);
    this.write(filePath, content, options);
  }

  delete(filePath: string): void {
    filePath = this.normalize(filePath);

    if (this.filesForDir(this.rp(filePath)).length > 0) {
      this.filesForDir(this.rp(filePath)).forEach(
        f => (this.recordedChanges[f] = { content: null, isDeleted: true })
      );
    }
    this.recordedChanges[this.rp(filePath)] = {
      content: null,
      isDeleted: true,
    };

    // Delete directories when
    if (this.children(dirname(this.rp(filePath))).length < 1) {
      this.delete(dirname(this.rp(filePath)));
    }
  }
  private filesForDir(path: string): string[] {
    return Object.keys(this.recordedChanges).filter(f =>
      path !== ''
        ? f.startsWith(`${path}/`)
        : f.startsWith(path) && !this.recordedChanges[f].isDeleted
    );
  }

  exists(filePath: string): boolean {
    filePath = this.normalize(filePath);
    try {
      if (this.recordedChanges[this.rp(filePath)]) {
        return !this.recordedChanges[this.rp(filePath)].isDeleted;
      } else if (this.filesForDir(this.rp(filePath)).length > 0) {
        return true;
      } else {
        return false;
      }
    } catch {
      return false;
    }
  }

  rename(from: string, to: string): void {
    from = this.normalize(from);
    to = this.normalize(to);
    if (from === to) {
      return;
    }

    if (this.isFile(from)) {
      const content = this.read(this.rp(from));
      this.write(this.rp(to), content!);
      this.delete(this.rp(from));
    } else {
      for (const child of this.children(from)) {
        this.rename(join(from, child), join(to, child));
      }
    }
  }

  isFile(filePath: string): boolean {
    filePath = this.normalize(filePath);

    if (this.recordedChanges[this.rp(filePath)]) {
      return !this.recordedChanges[this.rp(filePath)].isDeleted;
    }

    return false;
  }

  children(dirPath: string): string[] {
    dirPath = this.normalize(dirPath);
    let res = this.filesForDir(dirPath);

    res = [...res, ...this.directChildrenOfDir(this.rp(dirPath))];
    res = res.filter(q => {
      const r = this.recordedChanges[join(this.rp(dirPath), q)];
      return !r?.isDeleted;
    });
    // Dedupe
    return Array.from(new Set(res));
  }

  listChanges(): FileChange[] {
    const res = [] as FileChange[];
    Object.keys(this.recordedChanges).forEach(f => {
      if (this.recordedChanges[f].isDeleted) {
        if (this.exists(f)) {
          res.push({ path: f, type: 'DELETE', content: null });
        }
      } else {
        if (this.exists(f)) {
          res.push({
            path: f,
            type: 'UPDATE',
            content: this.recordedChanges[f].content,
            options: this.recordedChanges[f].options,
          });
        } else {
          res.push({
            path: f,
            type: 'CREATE',
            content: this.recordedChanges[f].content,
            options: this.recordedChanges[f].options,
          });
        }
      }
    });
    return res;
  }

  changePermissions(filePath: string, mode: Mode): void {
    // Noop
  }

  listFiles(dirPath: string, glob: string): string[] {
    dirPath = this.normalize(dirPath);
    const res = [] as string[];
    const files = this.filesForDir(dirPath);
    for (const file of files) {
      const filePath = join(dirPath, file);
      if (this.isFile(filePath)) {
        if (minimatch(filePath, glob)) {
          res.push(filePath);
        }
      } else {
        res.push(...this.listFiles(filePath, glob));
      }
    }
    return res;
  }

  private normalize(path: string) {
    return relative(this.root, join(this.root, path)).split('/').join('/');
  }

  private directChildrenOfDir(path: string): string[] {
    const res: Record<string, boolean> = {};
    if (path === '') {
      return Object.keys(this.recordedChanges).map(file => file.split('/')[0]);
    }
    Object.keys(this.recordedChanges).forEach(f => {
      if (f.startsWith(`${path}/`)) {
        const [_, file] = f.split(`${path}/`);
        res[file.split('/')[0]] = true;
      }
    });

    return Object.keys(res);
  }

  private rp(pp: string): string {
    return pp.startsWith('/') ? pp.substring(1) : pp;
  }
}
