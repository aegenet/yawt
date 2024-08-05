import type { OutputBundle, NormalizedOutputOptions } from 'rollup';

/**
 * Track Invalid Imports Plugin
 */
export function trackInvalidImportsPlugin() {
  // Handle files
  return {
    name: 'track-invalid-imports',
    generateBundle(options: NormalizedOutputOptions, bundles: OutputBundle) {
      // track invalid imports
      let libs: string[] | undefined = undefined;
      for (const [, bundle] of Object.entries(bundles)) {
        if (bundle.fileName.endsWith('.mjs') || bundle.fileName.endsWith('.cjs')) {
          libs = [
            ...String((bundle as { code?: string }).code).matchAll(/ from "[^"]+\/node_modules\/([^"]+)"/gi),

            ...String((bundle as { code?: string }).code).matchAll(/require\("[^"]+\/node_modules\/([^"]+)"/gi),
          ].map(m => m[1]);
        }

        if (libs?.length) {
          throw new Error(
            `Found relative node_modules import in ${bundle.fileName}: ${libs.join(', ')}. Have you forgotten to add it in the package/peerDependencies?`
          );
        }
      }
    },
  };
}
