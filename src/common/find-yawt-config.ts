import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { YawtProject } from '../yawt-project';

/**
 * Find the Yawt config
 *
 * @param cwd
 * @returns
 */
export async function findYawtConfig(
  cwd: string,
  yawtFileName: string = 'yawt.config.json'
): Promise<
  | {
      configPath: string;
      projects: YawtProject[];
    }
  | undefined
> {
  for (const yawtConfigPath of [
    path.join(cwd, yawtFileName),
    path.join(cwd, './.build/', yawtFileName),
    path.join(cwd, '../', yawtFileName),
    path.join(cwd, '../.build/', yawtFileName),
    path.join(cwd, '../../', yawtFileName),
    path.join(cwd, '../../.build/', yawtFileName),
  ]) {
    if (
      await access(yawtConfigPath)
        .then(() => true)
        .catch(() => false)
    ) {
      return {
        configPath: yawtConfigPath,
        projects: JSON.parse(await readFile(yawtConfigPath, 'utf-8')) as YawtProject[],
      };
    }
  }
  return undefined;
}
