import { type YawtTaskNames, yawt } from './yawt';
import { argv2Object } from './utils/argv-2-object';
import { env, argv, exit } from 'node:process';

const cliParams = argv2Object<{
  task: YawtTaskNames;
  workers: number;
  silent: boolean;
  single: boolean;
  npmRegistryURL: string;
  npmPublicPublish: boolean;
  npmNamespace: string;
  publish: boolean;
  npmVersion: string;
}>(argv.slice(2));

let npmVersion: string | undefined = cliParams.npmVersion?.trim();
if (!npmVersion) {
  if (env.GITHUB_REF_TYPE === 'tag') {
    npmVersion = env.GITHUB_REF_NAME;
  } else if (env.GITHUB_REF_NAME) {
    // workflow github
    npmVersion = `0.${new Date().getTime()}.0-dev`;
  }
}

yawt({
  task: cliParams.task,
  workers: cliParams.workers || parseInt(env.YAWT_WORKER_THREADS || '8', 10),
  silent: cliParams.silent || env.YAWT_SILENT === 'true',
  single: cliParams.single || env.YAWT_SINGLE === 'true',
  npmRegistryURL: cliParams.npmRegistryURL || env.YAWT_NPM_PUSH_REGISTRY,
  npmPublicPublish: cliParams.npmPublicPublish || env.YAWT_NPM_PUBLIC_PUBLISH === 'true',
  npmNamespace: cliParams.npmNamespace || env.YAWT_NPM_NAMESPACE,
  npmVersion: npmVersion,
})
  .then(() => {
    exit(0);
  })
  .catch(e => {
    console.error(e);
    exit(1);
  });
