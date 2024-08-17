import { join, basename, dirname, relative } from 'node:path';
import { findYawtConfig } from './find-yawt-config';
import { platform } from 'node:os';
import type { YawtProject } from '../yawt-project';

/**
 * Get Yawt Project dependencies aliases
 */
export async function getYawtProjectDeps(options: {
  cwd: string;
  currentProject: string;
  yawtFileName?: string;
  appendPath?: string;
  relative?: boolean;
}): Promise<Record<string, string> | undefined> {
  const isWin32 = platform() === 'win32';

  const appendPath = options.appendPath || '';
  const config = await findYawtConfig(options.cwd, options.yawtFileName);
  if (config) {
    const rootPkg = dirname(config.configPath.replace('.build', ''));
    const yawtAliases: Record<string, string> = {};
    const projInfo: Record<string, string[]> | undefined = config.projects.find(
      f => f.name === options.currentProject
    ) as Pick<YawtProject, 'dependencies' | 'devDependencies'> | undefined satisfies
      | Record<string, string[]>
      | undefined;
    let currentPath: string | undefined;

    if (projInfo) {
      for (const depType of ['dependencies', 'devDependencies']) {
        if (projInfo[depType]) {
          for (const dep of projInfo[depType]) {
            currentPath = join(rootPkg, 'packages', basename(dep), appendPath);
            yawtAliases[dep] = options.relative ? './' + relative(options.cwd, currentPath) : currentPath;
            if (isWin32) {
              // to unix path
              yawtAliases[dep] = yawtAliases[dep].replaceAll('\\', '/');
            }
          }
        }
      }
    }
    return yawtAliases;
  }
  return undefined;
}
