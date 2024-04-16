import { buildFlow } from './build-flow';

describe('buildFlow', () => {
  test('lint', async () => {
    await buildFlow({
      task: 'lint',
    });
  });
});
