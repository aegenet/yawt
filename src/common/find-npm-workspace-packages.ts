import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

export type NpmWorkspacePackages = {
  rootDirectory: string;
  rootPackagePath: string;
  packages: string[];
};

/**
 * Get NPM Projects from a monorepo
 *
 * @param cwd
 * @returns
 */
export async function findNpmWorkspacePackages(cwd: string): Promise<NpmWorkspacePackages | undefined> {
  for (const mainPkg of [
    path.join(cwd, 'package.json'),
    path.join(cwd, '../package.json'),
    path.join(cwd, '../../package.json'),
  ]) {
    if (
      await access(mainPkg)
        .then(() => true)
        .catch(() => false)
    ) {
      // Check if the package.json has a workspaces field
      const packages = JSON.parse(await readFile(mainPkg, 'utf-8')).workspaces;
      if (packages?.length) {
        return { rootPackagePath: mainPkg, packages, rootDirectory: path.dirname(mainPkg) };
      }
    }
  }
  return undefined;
}
