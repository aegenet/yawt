import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import * as child_process from 'node:child_process';
import * as util from 'node:util';
import type { YawtProject } from './yawt-project';
import { cwd } from 'node:process';

const exec = util.promisify(child_process.exec);

const tasks = {
  /** Clean up */
  clean: (project: YawtProject, { single }: YawtOptions) => {
    const cmds: string[] = [];
    if (!single) {
      cmds.push(`cd ./packages/${project.name}/`);
    } else {
      cmds.push(`npm run clean`);
    }
    return cmds;
  },
  /** Delete node modules */
  deleteNodeModules: async (project: YawtProject, { single, rootDir }: YawtOptions) => {
    const rimrafPath = await _getRimrafLibPath(rootDir!);
    if (single) {
      return `node ${rimrafPath} ./node_modules`;
    } else {
      return `node ${rimrafPath} ./packages/${project.name}/node_modules`;
    }
  },
  /** Upgrade dependencies */
  upgrade: async (project: YawtProject, { single, rootDir }: YawtOptions) => {
    const rimrafPath = await _getRimrafLibPath(rootDir!);
    if (single) {
      return `node ${rimrafPath} ./node_modules ./package.json.lock && npm i`;
    } else {
      const cmds: string[] = [
        `node ${rimrafPath} ./packages/${project.name}/node_modules ./packages/${project.name}/package.json.lock`,
        `cd ./packages/${project.name}/`,
      ];

      cmds.push('npm i', 'npm upgrade');
      project.links?.forEach(link => {
        cmds.push(`npm link ${link}`);
      });
      cmds.push('npm link');

      return cmds;
    }
  },
  /** Upgrade dependencies */
  upgradeForce: async (project: YawtProject, { single, rootDir }: YawtOptions) => {
    const rimrafPath = await _getRimrafLibPath(rootDir!);
    if (single) {
      return `node ${rimrafPath} ./node_modules ./package.json.lock && npm i`;
    } else {
      const cmds: string[] = [
        `node ${rimrafPath} ./packages/${project.name}/node_modules ./packages/${project.name}/package.json.lock`,
        `cd ./packages/${project.name}/`,
      ];

      cmds.push('npm i', 'npm upgrade --latest');
      project.links?.forEach(link => {
        cmds.push(`npm link ${link}`);
      });
      cmds.push('npm link');

      return cmds;
    }
  },
  /** Dependencies (npm i & link) */
  dependencies: (project: YawtProject, { single }: YawtOptions) => {
    if (!single) {
      const cmds = [`cd ./packages/${project.name}/`, 'npm i'];

      if (project.links?.length) {
        cmds.push(`npm link ${project.links.join(' ')}`);
      }

      cmds.push('npm link');
      return cmds;
    } else {
      return '';
    }
  },
  /** Lint */
  lint: (project: YawtProject, { single }: YawtOptions) => {
    if (single) {
      return `npm run lint`;
    } else {
      return `cd ./packages/${project.name}/ && npm run lint --if-present`;
    }
  },
  /** Version */
  version: async (project: YawtProject, { single, npmVersion, rootDir }: YawtOptions) => {
    const cmds: string[] = [];
    if (!single) {
      cmds.push(`cd ./packages/${project.name}/`);
    }

    const version = npmVersion;
    if (version) {
      if (version === '0.0.0-dev') {
        throw new Error('Invalid version 0.0.0-dev');
      }

      const jsonPath = await _getJSONLibPath(rootDir!);
      project.dependencies?.forEach(dep => {
        cmds.push(
          `node ${jsonPath} -I -f ./package.json -e "this.dependencies||={};this.dependencies['${dep}']='~${version}';"`
        );
      });
      project.devDependencies?.forEach(dep => {
        cmds.push(
          `node ${jsonPath} -I -f ./package.json -e "this.devDependencies||={};this.devDependencies['${dep}']='~${version}';"`
        );
      });
      project.peerDependencies?.forEach(dep => {
        cmds.push(
          `node ${jsonPath} -I -f ./package.json -e "this.peerDependencies||={};this.peerDependencies['${dep}']='~${version}';"`
        );
      });
      cmds.push(`node ${jsonPath} -I -f ./package.json -e "this.version='${version}';"`);
      // cmds.push(`npm version --no-commit-hooks --no-git-tag-version "${version}"`);
    }

    return cmds.join(' && ');
  },
  /** Build */
  build: (project: YawtProject, { single }: YawtOptions) => {
    const cmds: string[] = [];
    if (!single) {
      cmds.push(`cd ./packages/${project.name}/`);
    }

    cmds.push('npm run build');

    return cmds.join(' && ');
  },
  /** Test */
  test: async (project: YawtProject, options: Required<YawtOptions>) => {
    const projectPath = options.single ? options.rootDir : path.join(options.rootDir, `./packages/${project.name}`);
    const pkgProject = JSON.parse(await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8'));

    for (const key of ['main', 'module', 'browser', 'types']) {
      if (pkgProject[key]) {
        if (
          !(await fs
            .access(path.join(projectPath, pkgProject[key]))
            .then(() => true)
            .catch(() => false))
        ) {
          throw new Error(`package.json/${key} must exists (${pkgProject[key]})`);
        }
      } else if (key !== 'browser') {
        throw new Error(`package.json/${key} must exists`);
      }
    }
    if (pkgProject.exports['.']) {
      for (const root in pkgProject.exports) {
        if (root === '.') {
          await _ensureExports(projectPath, pkgProject.exports[root], 'node');
          await _ensureExports(projectPath, pkgProject.exports[root], 'default');
        } else {
          await _ensureExports(projectPath, pkgProject.exports, root);
        }
      }
    } else {
      await _ensureExports(projectPath, pkgProject.exports, 'node');
      await _ensureExports(projectPath, pkgProject.exports, 'default');
    }

    return options.single ? 'npm run test --if-present' : `cd ./packages/${project.name}/ && npm run test --if-present`;
  },
  /** Publish */
  publish: async (
    project: YawtProject,
    { single, npmRegistryURL, npmPublicPublish, npmNamespace, rootDir }: YawtOptions
  ) => {
    const registry = npmRegistryURL || 'https://npm.pkg.github.com/';
    const pkgPath = single ? './' : `./packages/${project.name}/`;
    const registryNS = npmNamespace ? npmNamespace + ':registry' : 'registry';
    const jsonPath = await _getJSONLibPath(rootDir!);

    const cmds = [
      // Remove devDependencies in npm package
      `node ${jsonPath} -I -f ${pkgPath}package.json -e "this.devDependencies={};this.scripts={};this.jest=undefined;this.publishConfig||={};this.publishConfig['${registryNS}']='${registry}';"`,
      `cd ${pkgPath}`,
      `npm publish --${registryNS}=${registry}${npmPublicPublish ? ' --access public' : ''}`,
    ];
    return cmds.join(' && ');
  },
  /**
   * Regenerate package-lock.json (even if it's a npm workspace)
   */
  regenPackageLock: (project: YawtProject, { single }: YawtOptions) => {
    if (single) {
      return `npm i --package-lock-only --workspaces false`;
    } else {
      return `cd ./packages/${project.name}/ && npm i --package-lock-only --workspaces false`;
    }
  },
  /** forEach project */
  forEach: (project: YawtProject, { single, param }: YawtOptions) => {
    if (!param) {
      throw new Error('"--param=something" is required for the "forEach" task');
    }

    if (single) {
      return `npm run ${param} --if-present`;
    } else {
      return `cd ./packages/${project.name}/ && npm run ${param} --if-present`;
    }
  },
} as const;

async function _ensureExports(projectPath: string, pkgExports: Record<string, Record<string, string>>, folder: string) {
  for (const key of ['require', 'import', 'types']) {
    if (
      !(await fs
        .access(path.join(projectPath, pkgExports[folder][key]))
        .then(() => true)
        .catch(() => false))
    ) {
      throw new Error(`package.json/${folder}/${key} must exists (${pkgExports[folder][key]})`);
    }
  }
}

export async function yawt(options: YawtOptions): Promise<void> {
  const taskMode = options.task;
  options.rootDir ||= cwd();
  options.configDirectory ||= path.resolve(options.rootDir, '.build');
  options.configFileName ||= 'yawt.config.json';
  options.workers ||= 8;

  if (taskMode && taskMode in tasks) {
    const startAt = new Date();
    console.log(`[YAWT] ${taskMode} starting at ${startAt.toLocaleString()}...`);
    const task = tasks[taskMode];
    let projects: {
      name: string;
      links?: string[];
      publish?: boolean;
    }[];

    if (options.single) {
      const currentPkg = await fs.readFile(path.resolve(options.rootDir, 'package.json'), 'utf-8').then(JSON.parse);
      projects = [
        {
          name: currentPkg.name,
          links: [],
          publish: taskMode === 'publish',
        },
      ];
    } else {
      projects = (await fs
        .readFile(path.resolve(options.configDirectory, options.configFileName), 'utf-8')
        .then(JSON.parse)) as {
        name: string;
        links?: string[];
        publish?: boolean;
      }[];
    }

    const workers = options.workers;

    const concurrentProjects = workers < 2 ? [] : projects.filter(f => !f.links || f.links.length === 0);
    const seqProjects = workers < 2 ? projects : projects.filter(f => f.links?.length);

    let packProms: Promise<{ error?: Error }>[] = [];
    for (let i = 0; i < concurrentProjects.length; i++) {
      const project = concurrentProjects[i];

      console.log(`[YAWT] ${taskMode}/${project.name}...`);
      const cmd = await task(project, options as Required<YawtOptions>);
      if (cmd?.length) {
        packProms.push(
          exec(Array.isArray(cmd) ? cmd.join(' && ') : cmd, {
            cwd: options.rootDir,
            maxBuffer: undefined,
          })
            .then(res => {
              if (!options.silent) {
                console.log(res.stdout);
                console.error(res.stderr);
              }
              return {};
            })
            .catch(error => {
              console.log(error.stdout);
              console.error(error.stderr);
              console.log(`[YAWT] ${taskMode}/${project.name} failed.`);
              return { error };
            })
        );
      }

      if ((i + 1) % workers === 0) {
        const errors = (await Promise.all(packProms)).filter(r => r.error);
        if (errors.length) {
          throw new Error(`[YAWT] ${taskMode} failed: ${errors.map(e => e.error?.message).join(', ')}`);
        }
        packProms = [];
      }
    }
    if (packProms.length) {
      const errors = (await Promise.all(packProms)).filter(r => r.error);
      if (errors.length) {
        throw new Error(`[YAWT] ${taskMode} failed: ${errors.map(e => e.error?.message).join(', ')}`);
      }
    }

    for (let i = 0; i < seqProjects.length; i++) {
      const project = seqProjects[i];
      console.log(`[YAWT] ${taskMode}/${project.name}...`);
      const cmd = await task(project, options as Required<YawtOptions>);
      if (cmd?.length) {
        try {
          child_process.execSync(Array.isArray(cmd) ? cmd.join(' && ') : cmd, {
            cwd: options.rootDir,
            stdio: 'inherit',
          });
        } catch (error) {
          throw new Error(`[YAWT] ${taskMode} failed: ${(error as { message?: string })?.message}`);
        }
      }
    }
    const endAt = new Date();
    console.log(
      `[YAWT] ${taskMode} finished at ${endAt.toLocaleString()} in ${(
        (endAt.getTime() - startAt.getTime()) /
        60000
      ).toFixed(2)} minutes.`
    );
  } else {
    throw new Error(`[YAWT] invalid task ${taskMode} provided.`);
  }
}

const _getJSONLibPath = _getLibPath.bind(null, './node_modules/json');
const _getRimrafLibPath = _getLibPath.bind(null, './node_modules/rimraf/dist/esm/bin.mjs');

async function _getLibPath(libPath: string, rootDir: string): Promise<string> {
  let jsonPath = path.resolve(rootDir, libPath);
  if (
    !(await fs
      .access(jsonPath)
      .then(() => true)
      .catch(() => false))
  ) {
    // try a fallback
    jsonPath = path.resolve(process.cwd(), libPath);
  }
  return jsonPath;
}

export type YawtOptions = {
  task: YawtTaskNames;
  rootDir?: string;
  configDirectory?: string;
  configFileName?: string;
  workers?: number;
  silent?: boolean;
  single?: boolean;
  npmRegistryURL?: string;
  npmPublicPublish?: boolean;
  npmNamespace?: string;
  npmVersion?: string;
  /**
   * Generic parameter for tasks
   */
  param?: string;
};
export type YawtTaskNames = keyof typeof tasks;
