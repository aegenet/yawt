import { eslintConfigurator } from './index';
import { cwd } from 'node:process';

describe('eslintConfigurator', () => {
  test('should return the correct configuration', async () => {
    assert.isOk(
      await eslintConfigurator({
        cwd: cwd(),
      })
    );

    const config = await eslintConfigurator({
      cwd: cwd(),
    });
    assert.strictEqual(config.length, 6);
  });
});
