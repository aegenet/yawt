import { readFile, writeFile } from 'node:fs/promises';
import { resolve as pathResolve, relative } from 'node:path';
import type { UserConfig } from 'vite';

/**
 * Auto update tsconfig paths
 */
export function viteTSConfigPathsPlugin(pluginOptions: { cwd: string }) {
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
          currentAlias = relative(pluginOptions.cwd, (config.resolve!.alias! as Record<string, string>)![alias]);
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
