import { readFile, writeFile } from 'node:fs/promises';
import { resolve as pathResolve, relative } from 'node:path';
import type { UserConfig } from 'vite';
import { platform } from 'node:os';

/**
 * Auto update tsconfig paths
 */
export function viteTSConfigPathsPlugin(pluginOptions: { cwd: string }) {
  const isWin32 = platform() === 'win32';
  return {
    name: 'vite-tsconfig-paths',
    async config(config: UserConfig /*, env: ConfigEnv */) {
      if (config.resolve?.alias) {
        const tsconfigPath = pathResolve(pluginOptions.cwd, 'tsconfig.json');
        const tsconfig = JSON.parse(await readFile(tsconfigPath, 'utf-8'));
        tsconfig.compilerOptions ||= {};
        tsconfig.compilerOptions.paths ||= {};

        let hasChanged: boolean = false;
        let currentAlias: string | undefined;
        for (const alias in config.resolve!.alias) {
          // relative path
          if (isWin32) {
            currentAlias = relative(
              pluginOptions.cwd,
              // resolve alias format to windows path
              (config.resolve!.alias! as Record<string, string>)![alias].replaceAll('/', '\\')
            );
            // back to unix path
            currentAlias = './' + currentAlias.replaceAll('\\', '/');
          } else {
            currentAlias =
              './' +
              relative(
                pluginOptions.cwd,
                // ensure unix path
                (config.resolve!.alias! as Record<string, string>)![alias].replaceAll('\\', '/')
              );
          }
          if (tsconfig.compilerOptions.paths[alias]?.[0] !== currentAlias) {
            tsconfig.compilerOptions.paths[alias] = [currentAlias];
            hasChanged = true;
          }
        }

        if (hasChanged) {
          await writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 2), 'utf-8');
        }
      }
    },
  };
}
