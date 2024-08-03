import fs from 'node:fs';
import path from 'node:path';

let folders = process.argv.slice(2);

let coverageBundle = {};
const buildConfigPath = path.join(__dirname, 'yawt.config.json');
const projects = fs.existsSync(buildConfigPath) ? JSON.parse(fs.readFileSync(buildConfigPath, 'utf-8')) : [];

if (projects?.length) {
  // If a config exists, we take it in addition to the specified folders.
  folders = folders.concat(...projects.map((f: { name: string }) => `./packages/${f.name}/coverage`));
}

for (let i = 0; i < folders.length; i++) {
  if (fs.existsSync(path.resolve(folders[i]))) {
    if (fs.existsSync(path.resolve(folders[i], 'coverage-final.json'))) {
      console.log(path.resolve(folders[i]));
      coverageBundle = Object.assign(
        coverageBundle,
        JSON.parse(fs.readFileSync(path.resolve(folders[i], 'coverage-final.json'), 'utf-8'))
      );
    } else {
      const files = fs.readdirSync(path.resolve(folders[i]));
      files.forEach(file => {
        if (file.endsWith('.json')) {
          coverageBundle = Object.assign(
            coverageBundle,
            JSON.parse(fs.readFileSync(path.resolve(path.join(path.resolve(folders[i]), file)), 'utf-8'))
          );
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
