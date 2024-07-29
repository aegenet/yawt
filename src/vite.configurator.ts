// vite.config.js
import { resolve as pathResolve } from 'node:path';
import { type InlineConfig, defineConfig, type Plugin, type ResolveOptions, type ServerOptions } from 'vite';
import { nodeExternals } from '@aegenet/ya-node-externals';
import { yaViteBanner } from '@aegenet/ya-vite-banner';
import { configDefaults } from 'vitest/config';
import { cwd as processCwd } from 'node:process';
import type { InputPluginOption, NormalizedOutputOptions, OutputAsset, OutputChunk } from 'rollup';
import { env as dynEnv } from 'node:process';
import { findNpmWorkspacePackages } from './common/find-npm-workspace-packages';
import { getNpmProjectsAlias } from './common/get-npm-projects-alias';
import { getYawtProjectDeps } from './common/get-yawt-project-deps';
import { writeFile, readFile } from 'node:fs/promises';

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
  autoAliasSubPath = 'src/index.ts',
  autoAlias = false,
  configFileName = undefined,
  server = undefined,
  autoFixImports = true,
  onAutoFixImports = undefined,
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
   * Alias sub path (auto)
   *
   * @default `src/index.ts`
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
      {
        name: 'auto-fix-imports',
        generateBundle(options, bundles) {
          if (autoFixImports) {
            for (const [, bundle] of Object.entries(bundles)) {
              if ((bundle as { code?: string }).code) {
                // Remove the path prefix from node_modules imports
                if (bundle.fileName.endsWith('.mjs')) {
                  (bundle as { code: string }).code = (bundle as { code: string }).code.replace(
                    // eslint-disable-next-line no-useless-escape
                    / from "[\.\/]+\/node_modules\//gi,
                    () => {
                      return ' from "';
                    }
                  );
                } else if ((bundle as { fileName: string }).fileName.endsWith('.cjs')) {
                  (bundle as { code: string }).code = (bundle as { code: string }).code.replace(
                    // eslint-disable-next-line no-useless-escape
                    /require\("[\.\/]+\/node_modules\//gi,
                    () => {
                      return 'require("';
                    }
                  );
                }

                // Custom action
                onAutoFixImports?.(options, bundle);
              }
            }
          } else {
            // track invalid imports
            let libs: string[] | undefined = undefined;
            for (const [, bundle] of Object.entries(bundles)) {
              if (bundle.fileName.endsWith('.mjs')) {
                libs = [
                  // eslint-disable-next-line no-useless-escape
                  ...String((bundle as { code?: string }).code).matchAll(/ from "[\.\/]+\/node_modules\/([^"]+)"/gi),
                ].map(m => m[1]);
              } else if (bundle.fileName.endsWith('.cjs')) {
                libs = [
                  // eslint-disable-next-line no-useless-escape
                  ...String((bundle as { code?: string }).code).matchAll(/require\("[\.\/]+\/node_modules\/([^"]+)"/gi),
                ].map(m => m[1]);
              }
              if (libs?.length) {
                throw new Error(
                  `Found relative node_modules import in ${bundle.fileName}: ${libs.join(', ')}. Have you forgotten to add it in the package/peerDependencies?`
                );
              }
            }
          }
        },
      },
      {
        name: 'vite-tsconfig-paths',
        async config(config) {
          const resolveAlias = config.resolve?.alias;
          if (hasAutoAlias && resolveAlias) {
            const tsconfigPath = pathResolve(cwd, 'tsconfig.json');
            const tsconfig = JSON.parse(await readFile(tsconfigPath, 'utf-8'));
            tsconfig.compilerOptions ||= {};
            tsconfig.compilerOptions.paths ||= {};

            let hasChanged: boolean = false;
            let currentAlias: string | undefined;
            for (const alias in config.resolve!.alias) {
              currentAlias = (config.resolve!.alias! as Record<string, string>)![alias];
              if (tsconfig.compilerOptions.paths[alias]?.[0] !== currentAlias) {
                tsconfig.compilerOptions.paths[alias] = [currentAlias];
                hasChanged = true;
              }
            }

            if (hasChanged) {
              await writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 2), 'utf-8');
            }
          }
        },
      },
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
