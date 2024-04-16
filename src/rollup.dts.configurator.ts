import dts from 'rollup-plugin-dts';
import path from 'node:path';
import { nodeExternals } from '@aegenet/ya-node-externals';
import type { MergedRollupOptions, PluginImpl } from 'rollup';

export async function rollupDTSConfigurator(options: {
  cwd: string;
  entryPoint?: string;
  folder?: string;
  nodeExternal?: boolean;
  external?: string[];
  globals?: Record<string, string>;
}): Promise<MergedRollupOptions> {
  const folder = options.folder ? options.folder + '/' : '';
  return {
    input: path.resolve(options.cwd, `${options.entryPoint || 'src/index.ts'}`),
    // make sure to externalize deps that shouldn't be bundled
    // into your library
    external: options.nodeExternal
      ? ((await nodeExternals(options.cwd)) as (string | RegExp)[])
          .concat([/node_modules/, /^node:/])
          .concat(options.external || [])
      : options.external || [],
    output: [
      {
        format: 'es',
        file: `./dist/${folder}bundle.d.ts`,
        globals: options.globals || {},
      },
    ],
    plugins: [((dts as unknown as { default: PluginImpl }).default || dts)()],
  };
}
