import path from 'node:path';
import { rollupDTSConfigurator } from './index';
import { cwd } from 'node:process';

describe('rollupDTSConfigurator', () => {
  test('should return the correct configuration', async () => {
    assert.isOk(
      await rollupDTSConfigurator({
        cwd: cwd(),
      })
    );

    const config = await rollupDTSConfigurator({
      cwd: cwd(),
    });
    assert.strictEqual(config.input, path.resolve(process.cwd() + '/src/index.ts'));
  });
});
