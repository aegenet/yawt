import { viteConfigurator } from './build/vite.configurator';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export function viteConfig(entryPoint) {
  return viteConfigurator({
    cwd: dirname(fileURLToPath(import.meta.url)),
    libName: '@aegenet/yawt',
    entryPoint: entryPoint,
    nodeExternal: true,
    makeAbsoluteExternalsRelative: true,
    server: {
      watch: {
        ignored: ['**/packages/**', '**/samples/**', '**/build/**', '**/node_modules/**', '**/dist/**'],
      },
    },
    onAutoFixImports(options, bundle) {
      if (bundle.fileName.endsWith('.cjs')) {
        bundle.code = bundle.code.replace('vitest/dist/config.js', () => {
          return 'vitest/config';
        });
      }
    },
  });
}
