import { viteConfigurator } from './index';
import { cwd } from 'node:process';
import { resolve } from 'node:path';

describe('viteConfigurator', () => {
  test('should return the correct configuration', async () => {
    const config = await viteConfigurator({
      cwd: cwd(),
      libName: '@aegenet/yawt',
    });
    assert.isOk(config);

    assert.strictEqual(config.plugins?.length, 3);
  });

  test('auto-alias - npm config', async () => {
    const config = await viteConfigurator({
      autoAlias: true,
      cwd: resolve(cwd(), './samples/workspace4/packages/a'),
      libName: '@aegenet/a',
    });
    assert.isOk(config);

    assert.strictEqual(config.plugins?.length, 3);
    assert.deepStrictEqual(Object.keys(config.resolve!.alias!), ['@aegenet/b', '@aegenet/c']);
    assert.ok((config!.resolve!.alias as Record<string, string>)!['@aegenet/b']!.endsWith('src'));
    assert.ok((config!.resolve!.alias as Record<string, string>)!['@aegenet/c']!.endsWith('src'));
  });

  test('auto-alias - yawt config - without deps', async () => {
    const config = await viteConfigurator({
      autoAlias: true,
      cwd: resolve(cwd(), './samples/workspace3/packages/a'),
      libName: '@aegenet/a',
    });
    assert.isOk(config);

    assert.strictEqual(config.plugins?.length, 3);
    assert.deepStrictEqual(config.resolve!.alias, {});
  });

  test('auto-alias - yawt config - with one dep', async () => {
    const curCwd = resolve(cwd(), './samples/workspace3/packages/b');
    const config = await viteConfigurator({
      autoAlias: true,
      cwd: curCwd,
      libName: '@aegenet/b',
    });
    assert.isOk(config);

    assert.strictEqual(config.plugins?.length, 3);
    assert.deepStrictEqual(Object.keys(config.resolve!.alias!), ['@aegenet/a']);
    assert.ok((config!.resolve!.alias as Record<string, string>)!['@aegenet/a']!.endsWith('src'));
  });

  test('auto-alias - yawt config - with two deps', async () => {
    const config = await viteConfigurator({
      autoAlias: true,
      cwd: resolve(cwd(), './samples/workspace3/packages/c'),
      libName: '@aegenet/c',
    });
    assert.isOk(config);

    assert.strictEqual(config.plugins?.length, 3);
    assert.deepStrictEqual(Object.keys(config.resolve!.alias!), ['@aegenet/a', '@aegenet/b']);
    assert.ok((config!.resolve!.alias as Record<string, string>)!['@aegenet/a']!.endsWith('src'));
    assert.ok((config!.resolve!.alias as Record<string, string>)!['@aegenet/b']!.endsWith('src'));
  });
});
