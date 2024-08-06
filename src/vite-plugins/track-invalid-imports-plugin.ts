import type { OutputBundle, NormalizedOutputOptions, OutputAsset, OutputChunk } from 'rollup';

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
      let bundle: OutputAsset | OutputChunk;
      for (const bundleName in bundles) {
        bundle = bundles[bundleName];
        if (
          bundle.fileName.endsWith('.mjs') ||
          bundle.fileName.endsWith('.cjs') ||
          bundle.fileName.endsWith('.umd.js')
        ) {
          libs = [
            ...String((bundle as { code?: string }).code).matchAll(/ from "[^"]*\/node_modules\/([^"]+)"/gi),
            ...String((bundle as { code?: string }).code).matchAll(/\bimport "[^"]*\/node_modules\/([^"]+)"/gi),
            ...String((bundle as { code?: string }).code).matchAll(/\brequire\("[^"]*\/node_modules\/([^"]+)"/gi),
          ].map(m => m[1]);
        }

        if (libs?.length) {
          throw new Error(
            `Found node_modules import in ${bundle.fileName}: ${libs.join(', ')}. Have you forgotten to add it in the package/peerDependencies?`
          );
        }
      }
    },
  };
}
