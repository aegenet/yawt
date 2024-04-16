import { viteConfigurator } from './index';
import { cwd } from 'node:process';

describe('viteConfigurator', () => {
  test('should return the correct configuration', async () => {
    assert.isOk(
      await viteConfigurator({
        cwd: cwd(),
        libName: '@aegenet/ya-workspace-toolkit',
      })
    );

    const config = await viteConfigurator({
      cwd: cwd(),
      libName: '@aegenet/ya-workspace-toolkit',
    });
    assert.strictEqual(config.plugins?.length, 1);
  });
});
