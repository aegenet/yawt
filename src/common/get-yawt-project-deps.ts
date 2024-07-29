import { resolve, basename } from 'node:path';
import { findYawtConfig } from './find-yawt-config';

/**
 * Get Yawt Project dependencies aliases
 */
export async function getYawtProjectDeps(options: {
  cwd: string;
  currentProject: string;
  yawtFileName?: string;
  appendPath?: string;
}): Promise<Record<string, string> | undefined> {
  const appendPath = options.appendPath || '';
  const config = await findYawtConfig(options.cwd, options.yawtFileName);
  if (config) {
    const yawtAliases: Record<string, string> = {};
    const projInfo = config.find(f => f.name === options.currentProject);
    if (projInfo) {
      if (projInfo.dependencies) {
        for (const dep of projInfo.dependencies) {
          yawtAliases[dep] = resolve(`./packages/${basename(dep)}`, appendPath);
        }
      }
      if (projInfo.devDependencies) {
        for (const dep of projInfo.devDependencies) {
          yawtAliases[dep] = resolve(`./packages/${basename(dep)}`, appendPath);
        }
      }
    }
    return yawtAliases;
  }
  return undefined;
}
