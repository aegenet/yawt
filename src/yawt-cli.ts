import { type YawtTaskNames, yawt } from './yawt';
import { argv2Object } from './utils/argv-2-object';

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
}>(process.argv.slice(2));

let npmVersion: string | undefined = cliParams.npmVersion?.trim();
if (!npmVersion) {
  if (process.env.GITHUB_REF_TYPE === 'tag') {
    npmVersion = process.env.GITHUB_REF_NAME;
  } else if (process.env.GITHUB_REF_NAME) {
    // workflow github
    npmVersion = `0.${new Date().getTime()}.0-dev`;
  }
}

yawt({
  task: cliParams.task,
  workers: cliParams.workers || parseInt(process.env.YAWT_WORKER_THREADS || '8', 10),
  silent: cliParams.silent || process.env.YAWT_SILENT === 'true',
  single: cliParams.single || process.env.YAWT_SINGLE === 'true',
  npmRegistryURL: cliParams.npmRegistryURL || process.env.YAWT_NPM_PUSH_REGISTRY,
  npmPublicPublish: cliParams.npmPublicPublish || process.env.YAWT_NPM_PUBLIC_PUBLISH === 'true',
  npmNamespace: cliParams.npmNamespace || process.env.YAWT_NPM_NAMESPACE,
  npmVersion: npmVersion,
})
  .then(() => {
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
