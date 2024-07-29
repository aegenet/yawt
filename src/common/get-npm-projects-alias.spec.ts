import { describe, it, expect } from 'vitest';
import { getNpmProjectsAlias } from './get-npm-projects-alias';
import path from 'node:path';

describe('get-npm-projects-alias', () => {
  it('A path without parent workspace', async () => {
    const alias = await getNpmProjectsAlias(path.resolve(process.cwd(), './samples'), 'something');
    expect(await alias).deep.equals({});
  });

  describe('workspace1', () => {
    it('A path with main package.json', async () => {
      const alias = await getNpmProjectsAlias(path.resolve(process.cwd(), './samples/workspace1'), 'something');
      expect(Object.keys(alias)).deep.equals(['a', 'b', 'c']);
      Object.values(alias).forEach(v => expect(v).match(/[a-c]$/) && expect(v).not.match(/[d]$/));
    });

    it('A path with a parent workspace ./../../', async () => {
      const alias = await getNpmProjectsAlias(path.resolve(process.cwd(), './samples/workspace1/packages/a'), 'a');
      expect(Object.keys(alias)).deep.equals(['b', 'c']);
      Object.values(alias).forEach(v => expect(v).match(/[b-c]$/) && expect(v).not.match(/[a]$/));
    });

    it('A path with a parent workspace ./../', async () => {
      const alias = await getNpmProjectsAlias(path.resolve(process.cwd(), './samples/workspace1/a'), 'a');
      expect(Object.keys(alias)).deep.equals(['b', 'c']);
      Object.values(alias).forEach(v => expect(v).match(/[b-c]$/) && expect(v).not.match(/[a]$/));
    });
  });

  describe('workspace2', () => {
    it('A path with main package.json', async () => {
      const alias = await getNpmProjectsAlias(path.resolve(process.cwd(), './samples/workspace2'), 'something');
      expect(Object.keys(alias)).deep.equals(['@aegenet/a', '@aegenet/b', '@aegenet/c']);
      Object.values(alias).forEach(v => expect(v).match(/[a-c]$/) && expect(v).not.match(/[d]$/));
    });

    it('A path with a parent workspace ./../../', async () => {
      const alias = await getNpmProjectsAlias(
        path.resolve(process.cwd(), './samples/workspace2/packages/a'),
        '@aegenet/a'
      );
      expect(Object.keys(alias)).deep.equals(['@aegenet/b', '@aegenet/c']);
      Object.values(alias).forEach(v => expect(v).match(/[b-c]$/) && expect(v).not.match(/[a]$/));
    });

    it('A path with a parent workspace ./../', async () => {
      const alias = await getNpmProjectsAlias(path.resolve(process.cwd(), './samples/workspace2/a'), '@aegenet/a');
      expect(Object.keys(alias)).deep.equals(['@aegenet/b', '@aegenet/c']);
      Object.values(alias).forEach(v => expect(v).match(/[b-c]$/) && expect(v).not.match(/[a]$/));
    });

    it('A path with a parent workspace ./../ - appendPath', async () => {
      const alias = await getNpmProjectsAlias(
        path.resolve(process.cwd(), './samples/workspace2/a'),
        '@aegenet/a',
        'src/index.ts'
      );
      expect(Object.keys(alias)).deep.equals(['@aegenet/b', '@aegenet/c']);
      Object.values(alias).forEach(
        v => v.endsWith(path.resolve('b', 'src', 'index.ts')) || v.endsWith(path.resolve('c', 'src', 'index.ts'))
      );
    });
  });
});
