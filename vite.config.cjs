import { viteConfigurator } from './build/vite.configurator';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export default viteConfigurator({
  cwd: dirname(fileURLToPath(import.meta.url)),
  libName: '@aegenet/ya-workspace-toolkit',
  entryPoint: {
    index: './src/index.ts',
    'get-projects-cli': './src/get-projects-cli.ts',
    'yawt-cli': './src/yawt-cli.ts',
    'coverage-merge-cli': './src/coverage-merge-cli.ts',
  },
  nodeExternal: true,
});
