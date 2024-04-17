import fs from 'node:fs';
import path from 'node:path';

let folders = process.argv.slice(2);

let coverageBundle = {};
const buildConfigPath = path.join(__dirname, 'yawt.config.json');
const projects = fs.existsSync(buildConfigPath) ? require(buildConfigPath) : [];

if (projects?.length) {
  // If a config exists, we take it in addition to the specified folders.
  folders = folders.concat(...projects.map((f: { name: string }) => `./packages/${f.name}/coverage`));
}

for (let i = 0; i < folders.length; i++) {
  if (fs.existsSync(path.resolve(folders[i]))) {
    if (fs.existsSync(path.resolve(folders[i], 'coverage-final.json'))) {
      console.log(path.resolve(folders[i]));
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      coverageBundle = Object.assign(coverageBundle, require(path.resolve(folders[i], 'coverage-final.json')));
    } else {
      const files = fs.readdirSync(path.resolve(folders[i]));
      files.forEach(file => {
        if (file.endsWith('.json')) {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          coverageBundle = Object.assign(coverageBundle, require(path.join(path.resolve(folders[i]), file)));
        }
      });
    }
  }
}

const outputDir = path.join(__dirname, '..', '.nyc_output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}
fs.writeFileSync(path.join(outputDir, 'bundle.json'), JSON.stringify(coverageBundle, null, 2), 'utf8');
