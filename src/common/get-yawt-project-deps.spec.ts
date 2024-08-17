import { describe, it, expect } from 'vitest';
import { getYawtProjectDeps } from './get-yawt-project-deps';
import { resolve } from 'node:path';

describe('get-yawt-project-deps', () => {
  describe('workspace1 - Without a yawt config', () => {
    it('Project unknown - alias - relative', async () => {
      const alias = await getYawtProjectDeps({
        cwd: resolve(process.cwd(), './samples/workspace1/packages/a/'),
        currentProject: 'unknown',
        relative: true,
      });
      expect(alias).toBeUndefined();
    });
    it('Project unknown - alias - absolute', async () => {
      const alias = await getYawtProjectDeps({
        cwd: resolve(process.cwd(), './samples/workspace1/packages/a/'),
        currentProject: 'unknown',
        relative: true,
      });
      expect(alias).toBeUndefined();
    });
  });

  describe('workspace3', () => {
    it('Project unknown - alias - relative', async () => {
      const alias = await getYawtProjectDeps({
        cwd: resolve(process.cwd(), './samples/workspace3/'),
        currentProject: 'unknown',
        relative: true,
      });
      expect(alias).toBeTruthy();
      expect(Object.keys(alias!)).deep.equals([]);
      expect(alias).deep.equals({});
    });
    it('Project unknown - alias - absolute', async () => {
      const alias = await getYawtProjectDeps({
        cwd: resolve(process.cwd(), './samples/workspace3/'),
        currentProject: 'unknown',
      });
      expect(alias).toBeTruthy();
      expect(Object.keys(alias!)).deep.equals([]);
      expect(alias).deep.equals({});
    });

    it('Project a - alias - relative', async () => {
      const alias = await getYawtProjectDeps({
        cwd: resolve(process.cwd(), './samples/workspace3/'),
        currentProject: 'a',
        relative: true,
      });
      expect(alias).toBeTruthy();
      expect(Object.keys(alias!)).deep.equals([]);
      expect(alias).deep.equals({});
    });

    it('Project a - alias - absolute', async () => {
      const alias = await getYawtProjectDeps({
        cwd: resolve(process.cwd(), './samples/workspace3/'),
        currentProject: 'a',
      });
      expect(alias).toBeTruthy();
      expect(Object.keys(alias!)).deep.equals([]);
      expect(alias).deep.equals({});
    });

    it('Project b - alias - relative', async () => {
      const alias = await getYawtProjectDeps({
        cwd: resolve(process.cwd(), './samples/workspace3/'),
        currentProject: 'b',
        relative: true,
      });
      expect(alias).toBeTruthy();
      expect(Object.keys(alias!)).deep.equals(['@aegenet/a']);
      Object.values(alias!).forEach(v => expect(v).match(/[a]$/) && expect(v).not.match(/[bc]$/));
      expect(alias).deep.equals({
        '@aegenet/a': './packages/a',
      });
    });

    it('Project b - alias - absolute', async () => {
      const alias = await getYawtProjectDeps({
        cwd: resolve(process.cwd(), './samples/workspace3/'),
        currentProject: 'b',
      });
      expect(alias).toBeTruthy();
      expect(Object.keys(alias!)).deep.equals(['@aegenet/a']);
      Object.values(alias!).forEach(v => expect(v).match(/[a]$/) && expect(v).not.match(/[bc]$/));
    });

    it('Project c - alias - relative', async () => {
      const alias = await getYawtProjectDeps({
        cwd: resolve(process.cwd(), './samples/workspace3/'),
        currentProject: 'c',
        relative: true,
      });
      expect(alias).toBeTruthy();
      expect(Object.keys(alias!)).deep.equals(['@aegenet/a', '@aegenet/b']);
      Object.values(alias!).forEach(v => expect(v).match(/[ab]$/) && expect(v).not.match(/[c]$/));
      expect(alias).deep.equals({
        '@aegenet/a': './packages/a',
        '@aegenet/b': './packages/b',
      });
    });

    it('Project c - alias - absolute', async () => {
      const alias = await getYawtProjectDeps({
        cwd: resolve(process.cwd(), './samples/workspace3/'),
        currentProject: 'c',
      });
      expect(alias).toBeTruthy();
      expect(Object.keys(alias!)).deep.equals(['@aegenet/a', '@aegenet/b']);
      Object.values(alias!).forEach(v => expect(v).match(/[ab]$/) && expect(v).not.match(/[c]$/));
    });

    it('Project b - alias - appendPath', async () => {
      const alias = await getYawtProjectDeps({
        cwd: resolve(process.cwd(), './samples/workspace3/'),
        currentProject: 'b',
        appendPath: 'src/index.ts',
        relative: true,
      });
      expect(alias).toBeTruthy();
      expect(Object.keys(alias!)).deep.equals(['@aegenet/a']);
      Object.values(alias!).forEach(v => v.endsWith(resolve('a', 'src', 'index.ts')));
      expect(alias).deep.equals({
        '@aegenet/a': './packages/a/src/index.ts',
      });
    });

    it('Project b - alias - appendPath - absolute', async () => {
      const alias = await getYawtProjectDeps({
        cwd: resolve(process.cwd(), './samples/workspace3/'),
        currentProject: 'b',
        appendPath: 'src/index.ts',
      });
      expect(alias).toBeTruthy();
      expect(Object.keys(alias!)).deep.equals(['@aegenet/a']);
      Object.values(alias!).forEach(v => v.endsWith(resolve('a', 'src', 'index.ts')));
    });

    it('Project c - alias - appendPath - relative', async () => {
      const alias = await getYawtProjectDeps({
        cwd: resolve(process.cwd(), './samples/workspace3/'),
        currentProject: 'c',
        appendPath: 'src/index.ts',
        relative: true,
      });
      expect(alias).toBeTruthy();
      expect(Object.keys(alias!)).deep.equals(['@aegenet/a', '@aegenet/b']);
      Object.values(alias!).forEach(
        v => v.endsWith(resolve('a', 'src', 'index.ts')) || v.endsWith(resolve('b', 'src', 'index.ts'))
      );
      expect(alias).deep.equals({
        '@aegenet/a': './packages/a/src/index.ts',
        '@aegenet/b': './packages/b/src/index.ts',
      });
    });

    it('Project c - alias - appendPath - absolute', async () => {
      const alias = await getYawtProjectDeps({
        cwd: resolve(process.cwd(), './samples/workspace3/'),
        currentProject: 'c',
        appendPath: 'src/index.ts',
      });
      expect(alias).toBeTruthy();
      expect(Object.keys(alias!)).deep.equals(['@aegenet/a', '@aegenet/b']);
      Object.values(alias!).forEach(
        v => v.endsWith(resolve('a', 'src', 'index.ts')) || v.endsWith(resolve('b', 'src', 'index.ts'))
      );
    });

    it('Project c - alias - appendPath - cwd c - relative', async () => {
      const alias = await getYawtProjectDeps({
        cwd: resolve(process.cwd(), './samples/workspace3/packages/c'),
        currentProject: 'c',
        appendPath: 'src/index.ts',
        relative: true,
      });
      expect(alias).toBeTruthy();
      expect(Object.keys(alias!)).deep.equals(['@aegenet/a', '@aegenet/b']);
      Object.values(alias!).forEach(
        v => v.endsWith(resolve('a', 'src', 'index.ts')) || v.endsWith(resolve('b', 'src', 'index.ts'))
      );
      expect(alias).deep.equals({
        '@aegenet/a': './../a/src/index.ts',
        '@aegenet/b': './../b/src/index.ts',
      });
    });

    it('Project c - alias - appendPath - cwd c - absolute', async () => {
      const alias = await getYawtProjectDeps({
        cwd: resolve(process.cwd(), './samples/workspace3/packages/c'),
        currentProject: 'c',
        appendPath: 'src/index.ts',
      });
      expect(alias).toBeTruthy();
      expect(Object.keys(alias!)).deep.equals(['@aegenet/a', '@aegenet/b']);
      Object.values(alias!).forEach(
        v => v.endsWith(resolve('a', 'src', 'index.ts')) || v.endsWith(resolve('b', 'src', 'index.ts'))
      );
    });
  });
});
