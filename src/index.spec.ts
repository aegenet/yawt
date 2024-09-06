import { describe, test, expect } from 'vitest';
import * as YawtLib from './index';

describe('index', () => {
  test('exports', async () => {
    expect(YawtLib).toBeDefined();
    expect(Object.keys(YawtLib)).toEqual([
      'coverageConfiguration',
      'viteConfigurator',
      'viteInjectEnvPlugin',
      'rollupDTSConfigurator',
      'eslintConfigurator',
      'prettierConfigurator',
      'argv2Object',
      'yawt',
    ]);
  });
});
