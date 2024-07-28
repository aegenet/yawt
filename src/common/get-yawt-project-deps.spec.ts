import { describe, it, expect } from 'vitest';
import { getYawtProjectDeps } from './get-yawt-project-deps';
import path from 'node:path';

describe('get-yawt-project-deps', () => {
  describe('workspace1 - Without a yawt config', () => {
    it('Project unknown - alias', async () => {
      const alias = await getYawtProjectDeps({
        cwd: path.resolve(process.cwd(), './samples/workspace1/packages/a/'),
        currentProject: 'unknown',
      });
      expect(alias).toBeUndefined();
    });
  });

  describe('workspace3', () => {
    it('Project unknown - alias', async () => {
      const alias = await getYawtProjectDeps({
        cwd: path.resolve(process.cwd(), './samples/workspace3/'),
        currentProject: 'unknown',
      });
      expect(alias).toBeTruthy();
      expect(Object.keys(alias!)).deep.equals([]);
    });

    it('Project a - alias', async () => {
      const alias = await getYawtProjectDeps({
        cwd: path.resolve(process.cwd(), './samples/workspace3/'),
        currentProject: 'a',
      });
      expect(alias).toBeTruthy();
      expect(Object.keys(alias!)).deep.equals([]);
    });

    it('Project b - alias', async () => {
      const alias = await getYawtProjectDeps({
        cwd: path.resolve(process.cwd(), './samples/workspace3/'),
        currentProject: 'b',
      });
      expect(alias).toBeTruthy();
      expect(Object.keys(alias!)).deep.equals(['a']);
      Object.values(alias!).forEach(v => expect(v).match(/[a]$/) && expect(v).not.match(/[bc]$/));
    });

    it('Project c - alias', async () => {
      const alias = await getYawtProjectDeps({
        cwd: path.resolve(process.cwd(), './samples/workspace3/'),
        currentProject: 'c',
      });
      expect(alias).toBeTruthy();
      expect(Object.keys(alias!)).deep.equals(['a', 'b']);
      Object.values(alias!).forEach(v => expect(v).match(/[ab]$/) && expect(v).not.match(/[c]$/));
    });
  });
});
