import { describe, expect, vi, beforeAll, afterAll } from 'vitest';
import { viteTSConfigPathsPlugin } from './vite-tsconfig-paths-plugin';
import { Volume } from 'memfs';

const defaultTSConfig = `{
    "extends": "./tsconfig.base.json",
    "exclude": [
      "./node_modules"
    ],
    "include": [
      "src"
    ],
    "compilerOptions": {
      "noEmit": false,
      "outDir": "./build"
    }
  }`;

let volume: any;
beforeAll(() => {
  volume = Volume.fromJSON(
    {
      './tsconfig.json': defaultTSConfig,
    },
    process.cwd()
  );
  vi.mock('fs/promises', () => ({
    readFile: vi.fn((path, encoding) => volume.promises.readFile(path, encoding)),
    writeFile: vi.fn((path, data, encoding) => volume.promises.writeFile(path, data, encoding)),
  }));
});

afterAll(() => {
  vi.clearAllMocks();
  volume.reset();
});

describe('vite-tsconfig-paths-plugin', () => {
  test('Nothing', async () => {
    await viteTSConfigPathsPlugin({
      cwd: '.',
    }).config({});
    expect(await volume.promises.readFile('./tsconfig.json', 'utf-8')).toBe(defaultTSConfig);
  });

  test('Nothing 2', async () => {
    await viteTSConfigPathsPlugin({
      cwd: '.',
    }).config({
      resolve: {
        alias: {},
      },
    });
    expect(await volume.promises.readFile('./tsconfig.json', 'utf-8')).toBe(defaultTSConfig);
  });

  test('One alias - resolve alias win32 format', async () => {
    await viteTSConfigPathsPlugin({
      cwd: '.',
    }).config({
      resolve: {
        alias: {
          '@': '.\\src\\ok\\index.ts',
        },
      },
    });
    expect(JSON.parse(await volume.promises.readFile('./tsconfig.json', 'utf-8'))).deep.equals({
      extends: './tsconfig.base.json',
      exclude: ['./node_modules'],
      include: ['src'],
      compilerOptions: {
        noEmit: false,
        outDir: './build',
        paths: {
          '@': ['./src/ok/index.ts'],
        },
      },
    });
  });

  test('One alias - resolve alias unix format', async () => {
    await viteTSConfigPathsPlugin({
      cwd: '.',
    }).config({
      resolve: {
        alias: {
          '@': './src/ok/index.ts',
        },
      },
    });
    expect(JSON.parse(await volume.promises.readFile('./tsconfig.json', 'utf-8'))).deep.equals({
      extends: './tsconfig.base.json',
      exclude: ['./node_modules'],
      include: ['src'],
      compilerOptions: {
        noEmit: false,
        outDir: './build',
        paths: {
          '@': ['./src/ok/index.ts'],
        },
      },
    });
  });

  test('Multiple alias - resolve alias unix format', async () => {
    await viteTSConfigPathsPlugin({
      cwd: '.',
    }).config({
      resolve: {
        alias: {
          '@': './src/ok/index.ts',
          Something: './src/ok/something.ts',
        },
      },
    });
    expect(JSON.parse(await volume.promises.readFile('./tsconfig.json', 'utf-8'))).deep.equals({
      extends: './tsconfig.base.json',
      exclude: ['./node_modules'],
      include: ['src'],
      compilerOptions: {
        noEmit: false,
        outDir: './build',
        paths: {
          '@': ['./src/ok/index.ts'],
          Something: ['./src/ok/something.ts'],
        },
      },
    });
  });
});
