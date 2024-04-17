import { viteConfigurator } from './index';
import { cwd } from 'node:process';

describe('viteConfigurator', () => {
  test('should return the correct configuration', async () => {
    assert.isOk(
      await viteConfigurator({
        cwd: cwd(),
        libName: '@aegenet/yawt',
      })
    );

    const config = await viteConfigurator({
      cwd: cwd(),
      libName: '@aegenet/yawt',
    });
    assert.strictEqual(config.plugins?.length, 1);
  });
});
