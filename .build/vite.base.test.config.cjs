import { viteConfigurator } from '../dist/index.cjs';

export function viteConfig(entryPoint, cwd) {
  return viteConfigurator({
    cwd,
    libName: '@aegenet/yawt',
    entryPoint: entryPoint,
    nodeExternal: true,
    makeAbsoluteExternalsRelative: true,
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
                return `require("`;
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
