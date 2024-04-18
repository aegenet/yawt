import { describe, test, expect } from 'vitest';
import { readFile, writeFile } from 'node:fs/promises';
import { yawt } from './index';

describe('yawt', () => {
  test('clean', async () => {
    await yawt({
      task: 'clean',
    });
  });

  test('lint', async () => {
    await yawt({
      task: 'lint',
    });
  });

  test('deleteNodeModules', async () => {
    await yawt({
      task: 'deleteNodeModules',
    });
  });

  test('upgrade', async () => {
    await yawt({
      task: 'upgrade',
    });
  });

  test('upgradeForce', async () => {
    await yawt({
      task: 'upgradeForce',
    });
  });

  test('dependencies', async () => {
    await yawt({
      task: 'dependencies',
    });
  });

  test('test', async () => {
    await expect(() =>
      yawt({
        task: 'test',
      })
    ).rejects.toThrowError();
  });

  test('testLocal', async () => {
    await yawt({
      task: 'testLocal',
    });
  });

  test('build', async () => {
    await yawt({
      task: 'build',
    });
  });

  test('version', async () => {
    await yawt({
      task: 'version',
    });
  });

  test('publish', async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const backPkg = await readFile('./packages/abc/package.json', 'utf-8');
    try {
      await expect(() =>
        yawt({
          task: 'publish',
          single: true,
          rootDir: './packages/abc',
          npmRegistryURL: 'https://registry.npmjs.test',
        })
      ).rejects.toThrowError();
    } finally {
      await writeFile('./packages/abc/package.json', backPkg, 'utf-8');
    }
  });
});
