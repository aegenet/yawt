// vite.config.js
import { resolve as pathResolve } from 'node:path';
import {
  type InlineConfig,
  defineConfig,
  type Plugin,
  type ResolveOptions,
  type ServerOptions,
  type UserConfig,
} from 'vite';
import { nodeExternals } from '@aegenet/ya-node-externals';
import { yaViteBanner } from '@aegenet/ya-vite-banner';
import { configDefaults } from 'vitest/config';
import { cwd as processCwd } from 'node:process';
import type { NormalizedOutputOptions, OutputAsset, OutputChunk, RollupOptions, OutputOptions } from 'rollup';
import { env as dynEnv } from 'node:process';
import { findNpmWorkspacePackages } from './common/find-npm-workspace-packages';
import { getNpmProjectsAlias } from './common/get-npm-projects-alias';
import { getYawtProjectDeps } from './common/get-yawt-project-deps';
import { trackInvalidImportsPlugin } from './vite-plugins/track-invalid-imports-plugin';
import { autoFixImportsPlugin } from './vite-plugins/auto-fix-imports-plugin';
import { viteTSConfigPathsPlugin } from './vite-plugins/vite-tsconfig-paths-plugin';
import * as terser from '@rollup/plugin-terser';

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
  minify = 'esbuild',
  terserOptions = undefined,
  test,
  plugins = [],
  makeAbsoluteExternalsRelative = false,
  isAWorkspace = undefined,
  resolve = {},
  testAlias = {},
  testAutoAlias = false,
  autoAliasSubPath = 'src',
  autoAlias = false,
  configFileName = undefined,
  server = undefined,
  autoFixImports = true,
  onAutoFixImports = undefined,
  rollupOptions = undefined,
  viteOptions = undefined,
  outputFormats = {
    cjs: true,
    es: true,
    umd: true,
  },
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
   * Minify
   */
  minify?: boolean | 'terser' | 'esbuild';
  /**
   * Minify Terser Options
   */
  terserOptions?: terser.Options;
  test?: Omit<InlineConfig, 'server' | 'css'> & { exclude?: string[] };
  plugins?: Plugin[];
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
   * Alias sub path (auto)
   *
   * @default `src`
   */
  autoAliasSubPath?: string;
  /**
   * Yawt config file name
   * @default `yawt.config.json`
   */
  configFileName?: string;
  /**
   * Vite server options
   */
  server?: ServerOptions;
  /**
   * Auto fix imports: when true, it will try to fix imports that are relative or absolute to node_modules
   *
   * @default true
   */
  autoFixImports?: boolean;
  /**
   * On auto fix imports
   *
   * This is useful to fix imports that are not correctly resolved
   *
   * @example
   * ```ts
   * if (bundle.fileName.endsWith('.cjs')) {
   *   bundle.code = bundle.code.replace('vitest/dist/config.js', () => {
   *     return 'vitest/config';
   *   });
   * }
   * ```
   */
  onAutoFixImports?: (options: NormalizedOutputOptions, bundle: OutputAsset | OutputChunk) => void;
  /**
   * Extends yawt default RollupOptions
   */
  rollupOptions?: RollupOptions | undefined;
  /**
   * Extends yawt default ViteOptions
   */
  viteOptions?: UserConfig;
  /**
   * Default output formats
   */
  outputFormats?: {
    /**
     * CommonJS
     *
     * @default true
     */
    cjs?: boolean | OutputOptions;
    /**
     * ES Module
     *
     * @default true
     */
    es?: boolean | OutputOptions;
    /**
     * Universal Module Definition
     *
     * @default true
     */
    umd?: boolean | OutputOptions;
  };
}) {
  outputFormats.cjs ??= true;
  outputFormats.es ??= true;
  outputFormats.umd ??= true;

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

  const hasAutoAlias = (injectTestAlias && testAutoAlias) || autoAlias;
  if (hasAutoAlias) {
    // We try to get the alias from the yawt config file (more reliable)
    let aliasGenerated = await getYawtProjectDeps({
      cwd,
      currentProject: libName.split('/').pop()!,
      yawtFileName: configFileName,
      appendPath: autoAliasSubPath,
    });

    if (!aliasGenerated && npmWorkspace) {
      // We fallback to the npm workspace
      aliasGenerated = await getNpmProjectsAlias(npmWorkspace, libName, autoAliasSubPath);
    }

    if (aliasGenerated) {
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

  rollupOptions ??= {};
  if (minify === 'terser') {
    rollupOptions.plugins ??= [];
    if (!Array.isArray(rollupOptions.plugins)) {
      rollupOptions.plugins = [rollupOptions.plugins];
    }
    (rollupOptions.plugins as any[]).push(
      terser.default(
        terserOptions ?? {
          format: {
            comments: false,
          },
          compress: {
            drop_debugger: true,
            passes: 3,
          },
          mangle: {
            keep_classnames: false,
            reserved: [],
            properties: {
              regex: /^_/,
            },
          },
        }
      )
    );
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
  const sharedOutputOpts: OutputOptions = {
    compact: true,
    globals: globals || {},
    generatedCode: 'es2015',
  };

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
      autoFixImports
        ? autoFixImportsPlugin({
            onAutoFixImports,
          })
        : undefined,
      trackInvalidImportsPlugin(),
      viteTSConfigPathsPlugin({
        cwd,
      }),
      ...plugins,
    ].filter(f => f),
    resolve:
      injectTestAlias && testAlias
        ? {
            ...resolve,
            alias: { ...resolve.alias, ...testAlias },
          }
        : resolve,
    build: {
      outDir: pathResolve(cwd, 'dist', folder),
      lib,
      minify,
      sourcemap: true,
      terserOptions: minify === 'terser' ? terserOptions : undefined,
      rollupOptions: {
        input: !asSingleEntryPoint ? entryPoint : undefined,
        // input: resolve(cwd, `src/${entryPoint || 'index.ts'}`),
        // make sure to externalize deps that shouldn't be bundled
        // into your library
        external: nodeExternal
          ? dependencies.concat([/node_modules/, /^node:/]).concat(external || [])
          : external || [],
        makeAbsoluteExternalsRelative,
        output: (
          [
            outputFormats.cjs
              ? {
                  ...sharedOutputOpts,
                  name: libName,
                  format: 'cjs',
                  entryFileNames: `[name].cjs`,
                  dynamicImportInCjs: true,
                  ...(outputFormats.cjs === true ? {} : outputFormats.cjs),
                }
              : undefined,
            outputFormats.es
              ? {
                  ...sharedOutputOpts,
                  name: libName,
                  format: 'es',
                  entryFileNames: `[name].mjs`,
                  ...(outputFormats.es === true ? {} : outputFormats.es),
                }
              : undefined,
            asSingleEntryPoint && outputFormats.umd
              ? {
                  ...sharedOutputOpts,
                  name: libName,
                  format: 'umd',
                  entryFileNames: `[name].[format].js`,
                  inlineDynamicImports: false,
                  ...(outputFormats.umd === true ? {} : outputFormats.umd),
                }
              : undefined /** not compat */,
          ] as (OutputOptions | undefined)[]
        ).filter(f => f) as OutputOptions[],
        ...rollupOptions,
      },
    },
    ...viteOptions,
  });
}
