import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { type NpmWorkspacePackages, findNpmWorkspacePackages } from './find-npm-workspace-packages';

/**
 * Get NPM Projects from a monorepo
 *
 * @param cwd from a project on a monorepo
 * @returns
 */
export async function getNpmProjectsAlias(
  cwdOrWorkspace: string | NpmWorkspacePackages,
  skipPkgName?: string
): Promise<Record<string, string>> {
  const npmAlias: Record<string, string> = {};
  const monorepo = typeof cwdOrWorkspace === 'string' ? await findNpmWorkspacePackages(cwdOrWorkspace) : cwdOrWorkspace;
  if (monorepo) {
    let subWkPath: string;
    let subWkPackagePath: string;
    let pkgName: string;
    for (const project of monorepo.packages) {
      subWkPath = resolve(monorepo.rootDirectory, project);
      subWkPackagePath = join(subWkPath, 'package.json');
      pkgName = JSON.parse(await readFile(subWkPackagePath, 'utf-8')).name as string;
      if (pkgName !== skipPkgName) {
        npmAlias[pkgName] = subWkPath;
      }
    }
  }
  return npmAlias;
}
