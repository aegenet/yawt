import { coverageConfiguration } from './index';
import { cwd } from 'node:process';

describe('coverageConfiguration', () => {
  test('should return the correct configuration', async () => {
    assert.isOk(
      await coverageConfiguration({
        cwd: cwd(),
      })
    );

    const config = await coverageConfiguration({
      cwd: cwd(),
    });
    assert.deepStrictEqual(config.include, ['src/**']);
  });
});
