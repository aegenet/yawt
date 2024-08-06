import type { OutputBundle, NormalizedOutputOptions } from 'rollup';
import { autoFixImportsPlugin } from './auto-fix-imports-plugin';

describe('autoFixImportsPlugin', () => {
  test('Nothing', async () => {
    const md = {
      code: 'import "test";',
      fileName: 'test.mjs',
    };
    autoFixImportsPlugin({}).generateBundle(
      {} as unknown as NormalizedOutputOptions,
      {
        test: md as unknown,
      } as OutputBundle
    );
    expect(md.code).toEqual('import "test";');
  });

  test('Fix import', async () => {
    const md = {
      code: 'import "a/node_modules/test";',
      fileName: 'test.mjs',
    };
    autoFixImportsPlugin({}).generateBundle(
      {} as unknown as NormalizedOutputOptions,
      {
        test: md as unknown,
      } as OutputBundle
    );
    expect(md.code).toEqual('import "test";');
  });

  test('Fix import {} from', async () => {
    const md = {
      code: 'import { xyz } from "a/node_modules/test";',
      fileName: 'test.mjs',
    };
    autoFixImportsPlugin({}).generateBundle(
      {} as unknown as NormalizedOutputOptions,
      {
        test: md as unknown,
      } as OutputBundle
    );
    expect(md.code).toEqual('import { xyz } from "test";');
  });

  test('Fix import * from', async () => {
    const md = {
      code: 'import * from "a/node_modules/test";',
      fileName: 'test.mjs',
    };
    autoFixImportsPlugin({}).generateBundle(
      {} as unknown as NormalizedOutputOptions,
      {
        test: md as unknown,
      } as OutputBundle
    );
    expect(md.code).toEqual('import * from "test";');
  });

  test('Fix require', async () => {
    const md = {
      code: 'require("a/node_modules/test");',
      fileName: 'test.cjs',
    };
    autoFixImportsPlugin({}).generateBundle(
      {} as unknown as NormalizedOutputOptions,
      {
        test: md as unknown,
      } as OutputBundle
    );
    expect(md.code).toEqual('require("test");');
  });

  test('Fix many requires (cjs)', async () => {
    const md = {
      code: 'require("a/node_modules/test");const something = require("a/node_modules/something");require("else");',
      fileName: 'test.cjs',
    };
    autoFixImportsPlugin({}).generateBundle(
      {} as unknown as NormalizedOutputOptions,
      {
        test: md as unknown,
      } as OutputBundle
    );
    expect(md.code).toEqual('require("test");const something = require("something");require("else");');
  });

  test('Fix many requires (umd)', async () => {
    const md = {
      code: 'require("a/node_modules/test");const something = require("a/node_modules/something");require("else");',
      fileName: 'test.umd.js',
    };
    autoFixImportsPlugin({}).generateBundle(
      {} as unknown as NormalizedOutputOptions,
      {
        test: md as unknown,
      } as OutputBundle
    );
    expect(md.code).toEqual('require("test");const something = require("something");require("else");');
  });
});
