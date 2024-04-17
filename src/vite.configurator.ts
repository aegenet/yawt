// vite.config.js
import { resolve } from 'node:path';
import { type InlineConfig, defineConfig } from 'vite';
import { nodeExternals } from '@aegenet/ya-node-externals';
import { yaViteBanner } from '@aegenet/ya-vite-banner';
import { configDefaults } from 'vitest/config';
import { cwd as processCwd } from 'node:process';

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
  nodeExternal?: boolean;
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
}) {
  folder = folder ? folder + '/' : '';
  const dependencies: Array<string | RegExp> = nodeExternal ? await nodeExternals(cwd) : [];
  if (dependencies.length) {
    console.log(`FYI: your project depends to ${dependencies.length} packages.`);
  }

  const asSingleEntryPoint = typeof entryPoint === 'string';
  const lib = asSingleEntryPoint
    ? {
        // Could also be a dictionary or array of multiple entry points
        entry: resolve(cwd, entryPoint || 'index.ts'),
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
    ],
    build: {
      outDir: resolve(cwd, `./dist/${folder}`),
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
        external: nodeExternal ? dependencies.concat([/^node:/]).concat(external || []) : external || [],
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
