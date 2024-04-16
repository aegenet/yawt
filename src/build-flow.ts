import path from 'node:path';
import fs from 'node:fs';
import child_process from 'node:child_process';
import util from 'node:util';
import type { BuildFlowProject } from './build-flow-project';
import { cwd } from 'node:process';

const exec = util.promisify(child_process.exec);

const tasks = {
  /** Clean up */
  clean: (project: BuildFlowProject) => `cd ./packages/${project.name}/ && npm run clean`,
  /** Delete dependencies */
  deleteNodeModules: (project: BuildFlowProject) => {
    const cmd = `node ./node_modules/rimraf/dist/esm/bin.mjs ./packages/${project.name}/node_modules`;
    return cmd;
  },
  /** Upgrade dependencies */
  upgrade: (project: BuildFlowProject) => {
    let cmd = `cd ./packages/${project.name}/ && node ./../../node_modules/rimraf/dist/esm/bin.mjs ./node_modules && node ./../../node_modules/rimraf/dist/esm/bin.mjs ./npm.lock`;

    project.links?.forEach(link => {
      cmd += ` && npm link ${link}`;
    });

    cmd += ' && npm i && npm link';

    return cmd;
  },
  /** Dependencies (npm i & link) */
  dependencies: (project: BuildFlowProject) => {
    let cmd = `cd ./packages/${project.name}/`;

    project.links?.forEach(link => {
      cmd += ` && npm link ${link}`;
    });

    cmd += ' && npm i && npm link';

    return cmd;
  },
  /** Lint */
  lint: (project: BuildFlowProject) => `cd ./packages/${project.name}/ && npm run lint`,
  /** Build */
  build: (project: BuildFlowProject) => {
    const cmds: string[] = [];
    cmds.push(`cd ./packages/${project.name}/`);

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
  test: (project: BuildFlowProject, options: Required<BuildFlowOptions>) => {
    const projectPath = path.join(options.rootDir, `./packages/${project.name}`);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkgProject = require(path.join(projectPath, 'package.json'));

    for (const key of ['main', 'module', 'browser']) {
      if (!fs.existsSync(path.join(projectPath, pkgProject[key]))) {
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

    return `cd ./packages/${project.name}/ && npm run test-node`;
  },
  /** Test local */
  local: (project: BuildFlowProject) => `cd ./packages/${project.name}/ && npm run test-node-local`,
  /** Publish */
  publish: (project: BuildFlowProject) => {
    if (project.publish) {
      const registry = process.env.NPM_PUSH_REGISTRY || 'https://npm.pkg.github.com/';
      const cmds = [
        // Remove devDependencies in npm package
        `node ./node_modules/json -I -f ./packages/${project.name}/package.json -e "this.devDependencies={};this.scripts={};this.jest=undefined;this.publishConfig['@aegenet:registry']='${registry}';"`,
        `cd ./packages/${project.name}/`,
        `npm publish --@aegenet:registry=${registry}${
          process.env.NPM_PUBLISH_PUBLIC === '1' ? ' --access public' : ''
        }`,
      ];
      return cmds.join(' && ');
    } else {
      return '';
    }
  },
  /** Local Publish (yalc) */
  localPublish: (project: BuildFlowProject) => {
    if (project.publish) {
      const cmds = [`cd ./packages/${project.name}/`, `yalc installations clean && yalc publish`];
      return cmds.join(' && ');
    } else {
      return '';
    }
  },
} as const;

function _ensureExports(projectPath: string, pkgExports: Record<string, Record<string, string>>, folder: string) {
  for (const key of ['require', 'import']) {
    if (!fs.existsSync(path.join(projectPath, pkgExports[folder][key]))) {
      throw new Error(`package.json/${folder}/${key} must exists (${pkgExports[folder][key]})`);
    }
  }
  if (pkgExports[folder].types) {
    if (!fs.existsSync(path.join(projectPath, pkgExports[folder].types))) {
      throw new Error(`package.json/${folder}/types must exists (${pkgExports[folder].types})`);
    }
  }
}

export async function buildFlow(options: BuildFlowOptions): Promise<void> {
  const taskMode = options.task;
  options.rootDir ||= cwd();
  options.configDirectory ||= path.resolve(cwd(), '.build');
  options.configFileName ||= 'build-flow.config.json';
  options.workers ||= 8;

  if (taskMode && taskMode in tasks) {
    const startAt = new Date();
    console.log(`[BUILD-FLOW] ${taskMode} starting at ${startAt.toLocaleString()}...`);
    const task = tasks[taskMode];
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const projects = require(path.resolve(options.configDirectory, options.configFileName)) as {
      name: string;
      links?: string[];
      publish?: boolean;
    }[];

    const workers = options.workers;

    const concurrentProjects = workers < 2 ? [] : projects.filter(f => !f.links || f.links.length === 0);
    const seqProjects = workers < 2 ? projects : projects.filter(f => f.links?.length);

    let packProms: Promise<void>[] = [];
    for (let i = 0; i < concurrentProjects.length; i++) {
      const project = concurrentProjects[i];

      console.log(`[BUILD-FLOW] ${taskMode}/${project.name}...`);
      const cmd = task(project, options as Required<BuildFlowOptions>);
      if (cmd) {
        packProms.push(
          exec(cmd, {
            cwd: options.rootDir,
            maxBuffer: undefined,
          })
            .then(res => {
              if (!options.silent) {
                console.log(res.stdout);
                console.error(res.stderr);
              }
            })
            .catch(error => {
              console.log(error.stdout);
              console.error(error.stderr);
              console.log(`[BUILD-FLOW] ${taskMode}/${project.name} failed.`);
              throw error;
            })
        );
      }

      if ((i + 1) % workers === 0) {
        await Promise.allSettled(packProms);
        packProms = [];
      }
    }
    if (packProms.length) {
      await Promise.allSettled(packProms);
    }

    for (let i = 0; i < seqProjects.length; i++) {
      const project = seqProjects[i];
      console.log(`[BUILD-FLOW] ${taskMode}/${project.name}...`);
      const cmd = task(project, options as Required<BuildFlowOptions>);
      if (cmd) {
        child_process.execSync(cmd, {
          cwd: options.rootDir,
          stdio: 'inherit',
        });
      }
    }
    const endAt = new Date();
    console.log(
      `[BUILD-FLOW] ${taskMode} finished at ${endAt.toLocaleString()} in ${(
        (endAt.getTime() - startAt.getTime()) /
        60000
      ).toFixed(2)} minutes.`
    );
  } else {
    throw new Error(`[BUILD-FLOW] invalid task ${taskMode} provided.`);
  }
}

export type BuildFlowOptions = {
  task: BuildFlowTaskNames;
  rootDir?: string;
  configDirectory?: string;
  configFileName?: string;
  workers?: number;
  silent?: boolean;
};
export type BuildFlowTaskNames = keyof typeof tasks;
