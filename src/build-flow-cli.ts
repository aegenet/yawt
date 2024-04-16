import { type BuildFlowTaskNames, buildFlow } from './build-flow';

buildFlow({
  task: process.argv[2] as unknown as BuildFlowTaskNames,
  workers: parseInt(process.env.BUILD_WORKER_THREADS || '8', 10),
  silent: process.env.BUILD_SILENT === 'true',
})
  .then(() => {
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
