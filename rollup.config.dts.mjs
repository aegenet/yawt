import { rollupDTSConfigurator } from './build/rollup.dts.configurator.mjs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export default rollupDTSConfigurator({
  cwd: dirname(fileURLToPath(import.meta.url)),
  libName: '@aegenet/yawt',
  entryPoint: './src/index.ts',
  nodeExternal: true,
});
