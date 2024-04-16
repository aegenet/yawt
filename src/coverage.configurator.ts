import path from 'node:path';
import { cwd as processCwd } from 'node:process';

/**
 *
 * @param {
 *   directory?: string;
 *   reporter?: Array<'lcov' | 'text-summary' | 'html' | 'json'>;
 * } options
 * @returns NYC Configuration
 *
 */
export function coverageConfiguration({
  cwd = processCwd(),
  reporter,
}: {
  cwd?: string;
  reporter?: Array<'lcov' | 'text-summary' | 'html' | 'json'>;
} = {}) {
  const coveragePath = path.join(cwd ?? path.join(__dirname, '..'), 'coverage');
  const tempPath = path.join(cwd ?? path.join(__dirname, '..'), '.nyc_output');

  return {
    include: ['src/**'],
    exclude: ['build/**/*.spec.js', 'src/**/*.spec.ts'],
    extension: ['.ts'],
    reporter: reporter ?? ['json', 'text-summary'],
    'report-dir': coveragePath,
    'temp-dir': tempPath,
    sourceMap: true,
    instrument: true,
  };
}
