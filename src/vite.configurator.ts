// vite.config.js
import { resolve as pathResolve } from 'node:path';
import { type InlineConfig, defineConfig, type Plugin, type ResolveOptions, type ServerOptions } from 'vite';
import { nodeExternals } from '@aegenet/ya-node-externals';
import { yaViteBanner } from '@aegenet/ya-vite-banner';
import { configDefaults } from 'vitest/config';
import { cwd as processCwd } from 'node:process';
import type { InputPluginOption } from 'rollup';
import { env as dynEnv } from 'node:process';
import { findNpmWorkspacePackages } from './common/find-npm-workspace-packages';
import { getNpmProjectsAlias } from './common/get-npm-projects-alias';
import { getYawtProjectDeps } from './common/get-yawt-project-deps';

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
  testAlias = {},
  testAutoAlias = false,
  autoAlias = false,
  configFileName = undefined,
  server = undefined,
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
  test?: Omit<InlineConfig, 'server' | 'css'> & { exclude?: string[] };
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
  /**
   * Vite resolve.alias options, but for tests
   */
  testAlias?: { [find: string]: string };
  /**
   * Auto alias for tests
   */
  testAutoAlias?: boolean;
  /**
   * Auto alias
   */
  autoAlias?: boolean;
  /**
   * Yawt config file name
   * @default `yawt.config.json`
   */
  configFileName?: string;
  /**
   * Vite server options
   */
  server?: ServerOptions;
}) {
  folder = folder ? folder + '/' : '';

  let dependencies: Array<string | RegExp> = [];

  const injectTestAlias = dynEnv.npm_lifecycle_script?.includes('vitest') ?? false;

  const npmWorkspace =
    isAWorkspace === undefined || isAWorkspace === true ? await findNpmWorkspacePackages(cwd) : false;

  if (nodeExternal) {
    const nodeExtParams = typeof nodeExternal !== 'boolean' ? nodeExternal : {};
    dependencies = await nodeExternals(cwd, nodeExtParams);

    if (npmWorkspace) {
      // Workspace
      dependencies = dependencies.concat(await nodeExternals(npmWorkspace!.rootDirectory, nodeExtParams));
    }

    if (dependencies.length) {
      console.log(`FYI: your project depends to ${dependencies.length} packages.`);
    }
  }

  if ((injectTestAlias && testAutoAlias) || autoAlias) {
    if (npmWorkspace) {
      const aliasGenerated = await getNpmProjectsAlias(npmWorkspace, libName);
      if (injectTestAlias) {
        testAlias = {
          ...aliasGenerated,
          ...testAlias,
        };
      } else {
        resolve = {
          ...resolve,
          alias: { ...resolve.alias, ...aliasGenerated },
        };
      }
    } else {
      const aliasGenerated = await getYawtProjectDeps({
        cwd,
        currentProject: libName.split('/').pop()!,
        yawtFileName: configFileName,
      });
      if (injectTestAlias) {
        testAlias = {
          ...aliasGenerated,
          ...testAlias,
        };
      } else {
        resolve = {
          ...resolve,
          alias: { ...resolve.alias, ...aliasGenerated },
        };
      }
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
      // testMatch: test?.testMatch ?? ["./src/**/*.spec.ts"],
      ...test,
      exclude: [...configDefaults.exclude, '**/build/**', ...(test?.exclude ?? [])],
    },
    server,
    plugins: [
      yaViteBanner({
        raw: true,
        banner: '#!/usr/bin/env node',
        entryOnly: true,
        test: /cli\.(js|ts|cjs|mjs|.umd.js)$/,
      }),
      ...plugins,
    ],
    resolve:
      injectTestAlias && testAlias
        ? {
            ...resolve,
            alias: { ...resolve.alias, ...testAlias },
          }
        : resolve,
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
