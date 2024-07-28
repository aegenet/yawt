import { describe, it, expect } from 'vitest';
import { findNpmWorkspacePackages } from './find-npm-workspace-packages';
import path from 'path';

describe('find-npm-workspace-packages', () => {
  it('A path without parent workspace', async () => {
    const monorepo = await findNpmWorkspacePackages(path.resolve(process.cwd(), './samples'));
    expect(monorepo).equals(undefined);
  });

  describe('workspace1', () => {
    it('A path with main package.json', async () => {
      const monorepo = await findNpmWorkspacePackages(path.resolve(process.cwd(), './samples/workspace1'));
      expect(monorepo).deep.equals({
        rootDirectory: path.resolve(process.cwd(), './samples/workspace1'),
        rootPackagePath: path.resolve(process.cwd(), './samples/workspace1/package.json'),
        packages: ['packages/a', 'packages/b', 'packages/c'],
      });
    });

    it('A path with a parent workspace ./../../', async () => {
      const monorepo = await findNpmWorkspacePackages(path.resolve(process.cwd(), './samples/workspace1/packages/a'));
      expect(monorepo).deep.equals({
        rootDirectory: path.resolve(process.cwd(), './samples/workspace1'),
        rootPackagePath: path.resolve(process.cwd(), './samples/workspace1/package.json'),
        packages: ['packages/a', 'packages/b', 'packages/c'],
      });
    });

    it('A path with a parent workspace ./../', async () => {
      const monorepo = await findNpmWorkspacePackages(path.resolve(process.cwd(), './samples/workspace1/a'));
      expect(monorepo).deep.equals({
        rootDirectory: path.resolve(process.cwd(), './samples/workspace1'),
        rootPackagePath: path.resolve(process.cwd(), './samples/workspace1/package.json'),
        packages: ['packages/a', 'packages/b', 'packages/c'],
      });
    });
  });

  describe('workspace2', () => {
    it('A path with main package.json', async () => {
      const monorepo = await findNpmWorkspacePackages(path.resolve(process.cwd(), './samples/workspace2'));
      expect(monorepo).deep.equals({
        rootDirectory: path.resolve(process.cwd(), './samples/workspace2'),
        rootPackagePath: path.resolve(process.cwd(), './samples/workspace2/package.json'),
        packages: ['a', 'b', 'c'],
      });
    });

    it('A path with a parent workspace ./../../', async () => {
      const monorepo = await findNpmWorkspacePackages(path.resolve(process.cwd(), './samples/workspace2/packages/a'));
      expect(monorepo).deep.equals({
        rootDirectory: path.resolve(process.cwd(), './samples/workspace2'),
        rootPackagePath: path.resolve(process.cwd(), './samples/workspace2/package.json'),
        packages: ['a', 'b', 'c'],
      });
    });

    it('A path with a parent workspace ./../', async () => {
      const monorepo = await findNpmWorkspacePackages(path.resolve(process.cwd(), './samples/workspace2/a'));
      expect(monorepo).deep.equals({
        rootDirectory: path.resolve(process.cwd(), './samples/workspace2'),
        rootPackagePath: path.resolve(process.cwd(), './samples/workspace2/package.json'),
        packages: ['a', 'b', 'c'],
      });
    });
  });
});
