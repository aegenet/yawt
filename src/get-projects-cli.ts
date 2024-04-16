import * as fs from 'node:fs';

console.log(
  JSON.parse(fs.readFileSync('./.build/build-flow.config.json', 'utf8'))
    .map((f: { name: string }) => f.name)
    .join(',')
);
