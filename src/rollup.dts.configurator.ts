import dts from 'rollup-plugin-dts';
import { resolve } from 'node:path';
import { nodeExternals } from '@aegenet/ya-node-externals';
import type { MergedRollupOptions, PluginImpl } from 'rollup';
import { access, readFile } from 'node:fs/promises';
export async function rollupDTSConfigurator(options: {
  cwd: string;
  entryPoint?: string;
  folder?: string;
  nodeExternal?: boolean | Parameters<typeof nodeExternals>[1];
  external?: string[];
  globals?: Record<string, string>;
  plugins?: PluginImpl[];
}): Promise<MergedRollupOptions> {
  const folder = options.folder ? options.folder + '/' : '';
  let dependencies: Array<string | RegExp> = [];
  if (options.nodeExternal) {
    const nodeExtParams = typeof options.nodeExternal !== 'boolean' ? options.nodeExternal : {};
    dependencies = await nodeExternals(options.cwd, nodeExtParams);

    if (
      (await access(resolve(options.cwd, '../../package.json'))
        .then(() => true)
        .catch(() => false)) &&
      JSON.parse(await readFile(resolve(options.cwd, '../../package.json'), 'utf-8')).workspaces?.length
    ) {
      // Workspace
      dependencies = dependencies.concat(await nodeExternals(options.cwd, nodeExtParams));
    }
  }

  return {
    input: resolve(options.cwd, `${options.entryPoint || 'src/index.ts'}`),
    // make sure to externalize deps that shouldn't be bundled
    // into your library
    external: options.nodeExternal
      ? dependencies.concat([/node_modules/, /^node:/]).concat(options.external || [])
      : options.external || [],
    output: [
      {
        format: 'es',
        file: `./dist/${folder}bundle.d.ts`,
        globals: options.globals || {},
      },
    ],
    plugins: [
      ...(options.plugins?.length ? options.plugins : []),
      ((dts as unknown as { default: PluginImpl }).default || dts)(),
    ],
  };
}
