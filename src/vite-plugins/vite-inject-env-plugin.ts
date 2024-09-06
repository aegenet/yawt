import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'dotenv';

/**
 * Create a Vite plugin that injects environment variables from a .env file
 */
export async function viteInjectEnvPlugin({
  envDir = './',
  mode = 'test',
  idFilter = /\/src\/cli\./,
}: { envDir?: string; mode?: string; idFilter?: RegExp } = {}) {
  let env = {};
  const envPath = join(envDir, `.env${mode ? '.' + mode : ''}`);
  try {
    env = parse(await readFile(envPath, 'utf8'));
  } catch (error) {
    console.warn(`No valid .env file found (${(error as Error).message})`);
  }

  return {
    name: 'vite-inject-env',
    transform(code: string, id: string) {
      if (idFilter.test(id)) {
        return {
          code: `Object.assign(process.env, ${JSON.stringify(env)});\n${code}`,
          map: null,
        };
      } else {
        return {
          code,
          map: null,
        };
      }
    },
  };
}
