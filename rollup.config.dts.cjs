/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const { rollupDTSConfigurator } = require('./build/rollup.dts.configurator.js');
const { cwd } = require('node:process');
export default rollupDTSConfigurator({
  cwd: cwd(),
  libName: '@aegenet/ya-workspace-toolkit',
  entryPoint: './src/index.ts',
  nodeExternal: true,
});
