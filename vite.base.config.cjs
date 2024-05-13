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
    plugins: [
      {
        name: 'synckit',
        // issue with synckit import in the generated code
        generateBundle(options, bundles) {
          for (const [, bundle] of Object.entries(bundles)) {
            bundle.code = bundle.code
              .replace(/import ([a-z]+) from "synckit"/gi, (match, p1) => {
                return `import * as ${p1} from 'synckit'`;
              })
              // Remove the path prefix from node_modules imports
              .replace(/"[\.\/]+\/node_modules\//gi, () => {
                return '"';
              });
          }
        },
      },
    ],
  });
}
