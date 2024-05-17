// vite.config.js
import { resolve as pathResolve } from 'node:path';
import { type InlineConfig, defineConfig, type Plugin, type ResolveOptions } from 'vite';
import { nodeExternals } from '@aegenet/ya-node-externals';
import { yaViteBanner } from '@aegenet/ya-vite-banner';
import { configDefaults } from 'vitest/config';
import { cwd as processCwd } from 'node:process';
import { access, readFile } from 'node:fs/promises';
import type { InputPluginOption } from 'rollup';
import { env as dynEnv } from 'node:process';

/**
 * Vite Configuration
 */
export async function viteConfigurator({
  cwd = processCwd(),
  libName = '',
  entryPoint = 'index.js',
  folder = '',
  outputName = 'index',
  nodeExternal = false,
  external = [],
  globals = {},
  minifyKeepClassNames = false,
  test,
  plugins = [],
  makeAbsoluteExternalsRelative = false,
  rollupPlugins = undefined,
  isAWorkspace = undefined,
  resolve = {},
}: {
  /** Working directory */
  cwd?: string;
  /**
   * lib name
   */
  libName: string;
  /**
   * entry point (with extension)
   */
  entryPoint?: string | Record<string, string>;
  /**
   * output subfolder (in ./dist/)
   */
  folder?: string;
  /**
   * output name (in ./dist/[folder]/[outputName].xxx)
   */
  outputName?: string;
  /**
   * node external? (boolean)
   */
  nodeExternal?: boolean | Parameters<typeof nodeExternals>[1];
  /**
   * make absolute externals relative
   * @default false
   */
  makeAbsoluteExternalsRelative?: boolean;
  /**
   * rollup external (string[])
   */
  external?: string[];
  /**
   * rollup globals
   * @param Record<string, string>
   */
  globals?: Record<string, string>;
  /**
   * Minify Keep Class Names
   */
  minifyKeepClassNames?: boolean;
  test?: Omit<InlineConfig, 'server' | 'css'>;
  plugins?: Plugin[];
  rollupPlugins?: InputPluginOption;
  /**
   * Is a workspace?
   *
   * If undefined, it will be detected automatically
   */
  isAWorkspace?: boolean;
  /**
   * Vite resolve options
   */
  resolve?: ResolveOptions & {
    alias?: { [find: string]: string };
  };
}) {
  folder = folder ? folder + '/' : '';

  let dependencies: Array<string | RegExp> = [];

  let workspaces: string[] = [];
  const vitestCtx = dynEnv.npm_lifecycle_script?.includes('vitest') ?? false;

  if (isAWorkspace === undefined) {
    const mainPkgPath = pathResolve(cwd, '../../package.json');
    if (
      await access(mainPkgPath)
        .then(() => true)
        .catch(() => false)
    ) {
      workspaces = JSON.parse(await readFile(mainPkgPath, 'utf-8')).workspaces ?? [];
      isAWorkspace = workspaces.length ? true : false;

      if (vitestCtx) {
        resolve.alias ??= {};
        let subWkPath: string;
        let pkgName: string;
        for (const workspace of workspaces) {
          subWkPath = pathResolve(cwd, `../../${workspace}`);
          pkgName = JSON.parse(await readFile(subWkPath, 'utf-8')).name as string;
          if (!(pkgName in resolve.alias) && pkgName !== libName) {
            resolve.alias[pkgName] = subWkPath;
          }
        }
      }
    }
  }

  if (nodeExternal) {
    const nodeExtParams = typeof nodeExternal !== 'boolean' ? nodeExternal : {};
    dependencies = await nodeExternals(cwd, nodeExtParams);

    if (isAWorkspace) {
      // Workspace
      dependencies = dependencies.concat(await nodeExternals(cwd, nodeExtParams));
    }

    if (dependencies.length) {
      console.log(`FYI: your project depends to ${dependencies.length} packages.`);
    }
  }

  const asSingleEntryPoint = typeof entryPoint === 'string';
  const lib = asSingleEntryPoint
    ? {
        // Could also be a dictionary or array of multiple entry points
        entry: pathResolve(cwd, entryPoint || 'index.ts'),
        name: libName,
        fileName: outputName || 'index',
      }
    : undefined;

  return defineConfig({
    test: {
      bail: 1,
      clearMocks: true,
      environment: 'node',
      globals: true,
      exclude: [...configDefaults.exclude, 'build/**'],
      // testMatch: test?.testMatch ?? ["./src/**/*.spec.ts"],
      ...test,
    },
    plugins: [
      yaViteBanner({
        raw: true,
        banner: '#!/usr/bin/env node',
        entryOnly: true,
        test: /cli\.(js|ts|cjs|mjs|.umd.js)$/,
      }),
      ...plugins,
    ],
    resolve,
    build: {
      outDir: pathResolve(cwd, `./dist/${folder}`),
      lib,
      minify: minifyKeepClassNames === true ? 'terser' : 'esbuild',
      terserOptions:
        minifyKeepClassNames === true
          ? {
              keep_classnames: true,
            }
          : undefined,
      rollupOptions: {
        input: !asSingleEntryPoint ? entryPoint : undefined,
        // input: resolve(cwd, `src/${entryPoint || 'index.ts'}`),
        // make sure to externalize deps that shouldn't be bundled
        // into your library
        external: nodeExternal
          ? dependencies.concat([/node_modules/, /^node:/]).concat(external || [])
          : external || [],
        makeAbsoluteExternalsRelative,
        plugins: rollupPlugins,
        output: [
          {
            name: libName,
            // generatedCode: 'es2015',
            format: 'cjs',
            entryFileNames: `[name].cjs`,
            globals: globals || {},
          },
          {
            name: libName,
            // generatedCode: 'es2015',
            format: 'es',
            entryFileNames: `[name].mjs`,
            globals: globals || {},
          },
          asSingleEntryPoint
            ? {
                name: libName,
                // generatedCode: 'es2015',
                format: 'umd',
                entryFileNames: `[name].[format].js`,
                inlineDynamicImports: false,
                globals: globals || {},
              }
            : {} /** not compat */,
        ],
      },
    },
  });
}
