import path from 'node:path';
import fs from 'node:fs/promises';
import child_process from 'node:child_process';
import util from 'node:util';
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
  deleteNodeModules: (project: YawtProject, { single }: YawtOptions) => {
    if (single) {
      return `node ./node_modules/rimraf/dist/esm/bin.mjs ./node_modules`;
    } else {
      return `node ./node_modules/rimraf/dist/esm/bin.mjs ./packages/${project.name}/node_modules`;
    }
  },
  /** Upgrade dependencies */
  upgrade: (project: YawtProject, { single }: YawtOptions) => {
    if (single) {
      return `node ./node_modules/rimraf/dist/esm/bin.mjs ./node_modules ./package.json.lock && npm i`;
    } else {
      const cmds: string[] = [
        `cd ./packages/${project.name}/`,
        `node ./../../node_modules/rimraf/dist/esm/bin.mjs ./node_modules ./package.json.lock`,
      ];

      project.links?.forEach(link => {
        cmds.push(`npm link ${link}`);
      });

      cmds.push('npm i', 'npm link');

      return cmds;
    }
  },
  /** Dependencies (npm i & link) */
  dependencies: (project: YawtProject, { single }: YawtOptions) => {
    if (!single) {
      let cmd = `cd ./packages/${project.name}/`;

      project.links?.forEach(link => {
        cmd += ` && npm link ${link}`;
      });

      cmd += ' && npm i && npm link';
      return cmd;
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
  /** Build */
  build: (project: YawtProject, { single }: YawtOptions) => {
    const cmds: string[] = [];
    if (!single) {
      cmds.push(`cd ./packages/${project.name}/`);
    }

    let version;
    if (process.env.GITHUB_REF_TYPE === 'tag') {
      version = process.env.GITHUB_REF_NAME;
    } else if (process.env.GITHUB_REF_NAME) {
      // workflow github
      version = `0.${new Date().getTime()}.0-dev`;
    }

    if (version) {
      cmds.push(`npm version "${version}"`);
    }

    cmds.push('npm build');

    return cmds.join(' && ');
  },
  /** Test */
  test: async (project: YawtProject, options: Required<YawtOptions>) => {
    const projectPath = options.single ? options.rootDir : path.join(options.rootDir, `./packages/${project.name}`);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkgProject = require(path.join(projectPath, 'package.json'));

    for (const key of ['main', 'module', 'browser']) {
      if (
        !(await fs
          .access(path.join(projectPath, pkgProject[key]))
          .then(() => true)
          .catch(() => false))
      ) {
        throw new Error(`package.json/${key} must exists (${pkgProject[key]})`);
      }
    }
    if (pkgProject.exports['.']) {
      for (const root in pkgProject.exports) {
        if (root === '.') {
          _ensureExports(projectPath, pkgProject.exports[root], 'node');
          _ensureExports(projectPath, pkgProject.exports[root], 'default');
        } else {
          _ensureExports(projectPath, pkgProject.exports, root);
        }
      }
    } else {
      _ensureExports(projectPath, pkgProject.exports, 'node');
      _ensureExports(projectPath, pkgProject.exports, 'default');
    }

    return options.single ? 'npm run test --if-present' : `cd ./packages/${project.name}/ && npm run test --if-present`;
  },
  /** Test local */
  testLocal: (project: YawtProject, { single }: YawtOptions) => {
    if (single) {
      return 'npm run test:local --if-present';
    } else {
      return `cd ./packages/${project.name}/ && npm run test:local --if-present`;
    }
  },
  /** Publish */
  publish: async (
    project: YawtProject,
    { single, npmRegistryURL, npmPublicPublish, npmNamespace, rootDir }: YawtOptions
  ) => {
    const registry = npmRegistryURL || 'https://npm.pkg.github.com/';
    const pkgPath = single ? './' : `./packages/${project.name}/`;
    const registryNS = npmNamespace ? npmNamespace + ':registry' : 'registry';
    let jsonPath = path.resolve(rootDir!, './node_modules/json');
    if (
      !(await fs
        .access(jsonPath)
        .then(() => true)
        .catch(() => false))
    ) {
      // try a fallback
      jsonPath = path.resolve(process.cwd(), './node_modules/json');
    }

    const cmds = [
      // Remove devDependencies in npm package
      `node ${jsonPath} -I -f ${pkgPath}package.json -e "this.devDependencies={};this.scripts={};this.jest=undefined;this.publishConfig||={};this.publishConfig['${registryNS}']='${registry}';"`,
      `cd ${pkgPath}`,
      `npm publish --${registryNS}=${registry}${npmPublicPublish ? ' --access public' : ''}`,
    ];
    return cmds.join(' && ');
  },
} as const;

async function _ensureExports(projectPath: string, pkgExports: Record<string, Record<string, string>>, folder: string) {
  for (const key of ['require', 'import']) {
    if (
      !(await fs
        .access(path.join(projectPath, pkgExports[folder][key]))
        .then(() => true)
        .catch(() => false))
    ) {
      throw new Error(`package.json/${folder}/${key} must exists (${pkgExports[folder][key]})`);
    }
  }
  if (pkgExports[folder].types) {
    if (
      !(await fs
        .access(path.join(projectPath, pkgExports[folder].types))
        .then(() => true)
        .catch(() => false))
    ) {
      throw new Error(`package.json/${folder}/types must exists (${pkgExports[folder].types})`);
    }
  }
}

export async function yawt(options: YawtOptions): Promise<void> {
  const taskMode = options.task;
  options.rootDir ||= cwd();
  options.configDirectory ||= path.resolve(cwd(), '.build');
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
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const currentPkg = require(path.resolve(options.rootDir, 'package.json'));
      projects = [
        {
          name: currentPkg.name,
          links: [],
          publish: taskMode === 'publish',
        },
      ];
    } else {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      projects = require(path.resolve(options.configDirectory, options.configFileName)) as {
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
};
export type YawtTaskNames = keyof typeof tasks;
