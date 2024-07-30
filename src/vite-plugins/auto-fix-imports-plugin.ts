import type { NormalizedOutputOptions, OutputAsset, OutputChunk, OutputBundle } from 'rollup';

/**
 * Auto fix imports plugins
 */
export function autoFixImportsPlugin(pluginOptions: {
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
  // Handle files
  return {
    name: 'auto-fix-imports',
    generateBundle(options: NormalizedOutputOptions, bundles: OutputBundle) {
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
          pluginOptions?.onAutoFixImports?.(options, bundle);
        }
      }
    },
  };
}
