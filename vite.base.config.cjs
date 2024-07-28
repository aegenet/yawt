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
    plugins: [
      {
        name: 'synckit',
        // issue with synckit import in the generated code
        generateBundle(options, bundles) {
          for (const [, bundle] of Object.entries(bundles)) {
            // Remove the path prefix from node_modules imports
            if (bundle.fileName.endsWith('.mjs')) {
              bundle.code = bundle.code.replace(/ from "[\.\/]+\/node_modules\//gi, () => {
                return ' from "';
              });
            } else if (bundle.fileName.endsWith('.cjs')) {
              bundle.code = bundle.code.replace(/require\("[\.\/]+\/node_modules\//gi, () => {
                return 'require("';
              });
              bundle.code = bundle.code.replace('vitest/dist/config.js', () => {
                return 'vitest/config';
              });
            }
          }
        },
      },
    ],
  });
}
