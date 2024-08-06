import type { OutputBundle, NormalizedOutputOptions } from 'rollup';
import { trackInvalidImportsPlugin } from './track-invalid-imports-plugin';

describe('trackInvalidImportsPlugin', () => {
  test('OK', async () => {
    trackInvalidImportsPlugin().generateBundle(
      {} as unknown as NormalizedOutputOptions,
      {
        test: {
          code: 'import "test";',
          fileName: 'test.mjs',
        } as unknown,
      } as OutputBundle
    );
  });

  test('KO import', async () => {
    expect(() =>
      trackInvalidImportsPlugin().generateBundle(
        {} as unknown as NormalizedOutputOptions,
        {
          test: {
            code: 'import "a/node_modules/test";',
            fileName: 'test.mjs',
          } as unknown,
        } as OutputBundle
      )
    ).toThrowError(
      'Found node_modules import in test.mjs: test. Have you forgotten to add it in the package/peerDependencies?'
    );
  });

  test('KO import {} from', async () => {
    expect(() =>
      trackInvalidImportsPlugin().generateBundle(
        {} as unknown as NormalizedOutputOptions,
        {
          test: {
            code: 'import { xyz } from "a/node_modules/test";',
            fileName: 'test.mjs',
          } as unknown,
        } as OutputBundle
      )
    ).toThrowError(
      'Found node_modules import in test.mjs: test. Have you forgotten to add it in the package/peerDependencies?'
    );
  });

  test('KO import * from', async () => {
    expect(() =>
      trackInvalidImportsPlugin().generateBundle(
        {} as unknown as NormalizedOutputOptions,
        {
          test: {
            code: 'import * from "a/node_modules/test";',
            fileName: 'test.mjs',
          } as unknown,
        } as OutputBundle
      )
    ).toThrowError(
      'Found node_modules import in test.mjs: test. Have you forgotten to add it in the package/peerDependencies?'
    );
  });

  test('KO require', async () => {
    expect(() =>
      trackInvalidImportsPlugin().generateBundle(
        {} as unknown as NormalizedOutputOptions,
        {
          test: {
            code: 'require("a/node_modules/test");',
            fileName: 'test.mjs',
          } as unknown,
        } as OutputBundle
      )
    ).toThrowError(
      'Found node_modules import in test.mjs: test. Have you forgotten to add it in the package/peerDependencies?'
    );
  });

  test('KO require 2', async () => {
    expect(() =>
      trackInvalidImportsPlugin().generateBundle(
        {} as unknown as NormalizedOutputOptions,
        {
          test: {
            code: ';require("a/node_modules/test1");subrequire("a/node_modules/test2");',
            fileName: 'test.mjs',
          } as unknown,
        } as OutputBundle
      )
    ).toThrowError(
      'Found node_modules import in test.mjs: test1. Have you forgotten to add it in the package/peerDependencies?'
    );
  });

  test('KO multiples', async () => {
    expect(() =>
      trackInvalidImportsPlugin().generateBundle(
        {} as unknown as NormalizedOutputOptions,
        {
          test: {
            code: 'import * from "a/node_modules/test1";import * from "/node_modules/test2";import "/node_modules/test3";import { xyz } from "/node_modules/test3";',
            fileName: 'test.mjs',
          } as unknown,
        } as OutputBundle
      )
    ).toThrowError(
      'Found node_modules import in test.mjs: test1, test2, test3, test3. Have you forgotten to add it in the package/peerDependencies?'
    );
  });
});
