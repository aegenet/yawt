import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

/**
 * ESLint Configuration
 */
export function eslintConfigurator({
  noConsole = false,
  namingConvention = false,
  type = 'node',
  cwd = process.cwd(),
}: { type?: 'node' | 'browser'; cwd?: string; noConsole?: boolean; namingConvention?: boolean } = {}) {
  return tseslint.config(eslint.configs.recommended, ...tseslint.configs.recommended, eslintPluginPrettierRecommended, {
    // files: ['*.ts', '*.tsx'],
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
      'no-console': noConsole ? 'error' : 'warn',
      'prettier/prettier': ['error'],
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
      '@typescript-eslint/no-floating-promises': ['error'],
      '@typescript-eslint/naming-convention': namingConvention
        ? [
            'error',
            // function
            {
              selector: 'function',
              modifiers: ['exported'],
              format: ['camelCase'],
              leadingUnderscore: 'forbid',
            },
            {
              selector: 'function',
              format: ['camelCase'],
              leadingUnderscore: 'require',
            },
            // Classes properties and methods
            {
              selector: ['classProperty', 'classMethod'],
              modifiers: ['public'],
              format: ['camelCase'],
              leadingUnderscore: 'forbid',
            },
            {
              selector: ['classProperty', 'classMethod'],
              modifiers: ['private'],
              format: ['camelCase'],
              leadingUnderscore: 'require',
            },
            // static public/private
            {
              selector: ['classProperty'],
              modifiers: ['static', 'private'],
              format: ['UPPER_CASE'],
              leadingUnderscore: 'require',
            },
            {
              selector: ['method'],
              modifiers: ['static', 'private'],
              format: ['camelCase'],
              leadingUnderscore: 'require',
            },
            {
              selector: ['classProperty'],
              modifiers: ['static', 'public'],
              format: ['UPPER_CASE'],
              leadingUnderscore: 'require',
            },
            {
              selector: ['method'],
              modifiers: ['static', 'public'],
              format: ['camelCase'],
              leadingUnderscore: 'forbid',
            },
          ]
        : ['off'],
      // '@typescript-eslint/explicit-member-accessibility': [
      //   'error',
      //   {
      //     accessibility: 'explicit',
      //     overrides: {
      //       constructors: 'no-public',
      //     },
      //   },
      // ],
    },
  });
}
