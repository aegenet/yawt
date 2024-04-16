import { prettierConfigurator } from './index';

describe('prettierConfigurator', () => {
  test('should return the correct configuration', () => {
    assert.isOk(prettierConfigurator());
    assert.deepEqual(prettierConfigurator(), {
      semi: true,
      trailingComma: 'es5',
      singleQuote: true,
      bracketSpacing: true,
      printWidth: 120,
      tabWidth: 2,
      endOfLine: 'auto',
      arrowParens: 'avoid',
      parser: 'typescript',
    });
  });
});
