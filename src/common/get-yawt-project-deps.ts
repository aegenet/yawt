import { join, basename, dirname, relative } from 'node:path';
import { findYawtConfig } from './find-yawt-config';
import { platform } from 'node:os';

/**
 * Get Yawt Project dependencies aliases
 */
export async function getYawtProjectDeps(options: {
  cwd: string;
  currentProject: string;
  yawtFileName?: string;
  appendPath?: string;
}): Promise<Record<string, string> | undefined> {
  const isWin32 = platform() === 'win32';

  const appendPath = options.appendPath || '';
  const config = await findYawtConfig(options.cwd, options.yawtFileName);
  if (config) {
    const rootPkg = dirname(config.configPath.replace('.build', ''));
    const yawtAliases: Record<string, string> = {};
    const projInfo = config.projects.find(f => f.name === options.currentProject);
    if (projInfo) {
      if (projInfo.dependencies) {
        for (const dep of projInfo.dependencies) {
          yawtAliases[dep] = './' + relative(options.cwd, join(rootPkg, 'packages', basename(dep), appendPath));
          if (isWin32) {
            // to unix path
            yawtAliases[dep] = yawtAliases[dep].replaceAll('\\', '/');
          }
        }
      }
      if (projInfo.devDependencies) {
        for (const dep of projInfo.devDependencies) {
          yawtAliases[dep] = './' + relative(options.cwd, join(rootPkg, 'packages', basename(dep), appendPath));
          // to unix path
          if (isWin32) {
            // to unix path
            yawtAliases[dep] = yawtAliases[dep].replaceAll('\\', '/');
          }
        }
      }
    }
    return yawtAliases;
  }
  return undefined;
}
