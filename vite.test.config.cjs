// test -> npm run build:vite:mjs
import { viteConfig } from './.build/vite.base.test.config.cjs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export default viteConfig('./src/index.ts', dirname(fileURLToPath(import.meta.url)));
