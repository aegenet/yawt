import { viteConfigurator } from '../dist/index.cjs';

export function viteConfig(entryPoint, cwd) {
  return viteConfigurator({
    cwd,
    libName: '@aegenet/yawt',
    entryPoint: entryPoint,
    nodeExternal: true,
    makeAbsoluteExternalsRelative: true,
    onAutoFixImports(options, bundle) {
      if (bundle.fileName.endsWith('.cjs')) {
        bundle.code = bundle.code.replace('vitest/dist/config.js', () => {
          return 'vitest/config';
        });
      }
    },
  });
}
