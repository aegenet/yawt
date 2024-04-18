import { yawt } from './yawt';
import { describe, test, expect } from 'vitest';

describe('yawt', () => {
  test('lint', async () => {
    await yawt({
      task: 'lint',
    });
  });

  test('build', async () => {
    await yawt({
      task: 'build',
    });
  });

  test('publish', async () => {
    await expect(() =>
      yawt({
        task: 'publish',
        single: true,
        rootDir: './packages/abc',
        npmRegistryURL: 'https://registry.npmjs.test',
      })
    ).rejects.toThrowError();
  });
});
