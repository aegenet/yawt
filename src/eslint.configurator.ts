import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

/**
 * ESLint Configuration
 */
export function eslintConfigurator({
  type = 'node',
  cwd = process.cwd(),
}: { type?: 'node' | 'browser'; cwd?: string } = {}) {
  return tseslint.config(eslint.configs.recommended, ...tseslint.configs.recommended, eslintPluginPrettierRecommended, {
    files: ['*.ts', '*.tsx'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: cwd,
      },
      globals: {
        ...(type === 'node' ? { ...globals.node, ...globals.nodeBuiltin } : globals.browser),
        ...globals.es2021,
      },
    },
    rules: {
      'prettier/prettier': ['error'],
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
      '@typescript-eslint/no-floating-promises': ['error'],
      'no-promises/no-promises': 'error',
    },
  });
}
