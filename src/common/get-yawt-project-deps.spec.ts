import { describe, it, expect } from 'vitest';
import { getYawtProjectDeps } from './get-yawt-project-deps';
import path from 'node:path';

describe('get-yawt-project-deps', () => {
  it('A path without parent workspace', async () => {
    const alias = await getYawtProjectDeps({
      cwd: path.resolve(process.cwd(), './samples/workspace3/'),
      currentProject: 'something',
    });
    expect(await alias).deep.equals({});
  });

  describe('workspace3', () => {
    it('Project a - alias', async () => {
      const alias = await getYawtProjectDeps({
        cwd: path.resolve(process.cwd(), './samples/workspace3/'),
        currentProject: 'a',
      });
      expect(Object.keys(alias)).deep.equals([]);
    });

    it('Project b - alias', async () => {
      const alias = await getYawtProjectDeps({
        cwd: path.resolve(process.cwd(), './samples/workspace3/'),
        currentProject: 'b',
      });
      expect(Object.keys(alias)).deep.equals(['a']);
      Object.values(alias).forEach(v => expect(v).match(/[a]$/) && expect(v).not.match(/[bc]$/));
    });

    it('Project c - alias', async () => {
      const alias = await getYawtProjectDeps({
        cwd: path.resolve(process.cwd(), './samples/workspace3/'),
        currentProject: 'c',
      });
      expect(Object.keys(alias)).deep.equals(['a', 'b']);
      Object.values(alias).forEach(v => expect(v).match(/[ab]$/) && expect(v).not.match(/[c]$/));
    });
  });
});
