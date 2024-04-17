import * as fs from 'node:fs';

console.log(
  JSON.parse(fs.readFileSync('./.build/yawt.config.json', 'utf8'))
    .map((f: { name: string }) => f.name)
    .join(',')
);
