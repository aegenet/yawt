import { describe, expect } from 'vitest';
import { viteInjectEnvPlugin } from './vite-inject-env-plugin';

describe('vite-inject-env-plugin', () => {
  test('No files', async () => {
    expect((await viteInjectEnvPlugin({ envDir: './src' })).transform('code', 'id')).deep.equals({
      code: 'code',
      map: null,
    });
  });

  test('No match', async () => {
    expect((await viteInjectEnvPlugin({ envDir: '.' })).transform('code', 'id')).deep.equals({
      code: 'code',
      map: null,
    });
  });

  test('.env', async () => {
    expect((await viteInjectEnvPlugin({ envDir: '.', idFilter: /^id$/ })).transform('Actual Code', 'id')).deep.equals({
      code: 'Object.assign(process.env, {"SOMETHING":"ELSE"});\nActual Code',
      map: null,
    });
  });
});
