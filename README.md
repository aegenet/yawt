[![npm version](https://img.shields.io/npm/v/@aegenet/yawt.svg)](https://www.npmjs.com/package/@aegenet/yawt)
[![Build Status](https://github.com/aegenet/yawt/actions/workflows/ci.yml/badge.svg)](https://github.com/aegenet/yawt/actions)
[![codecov](https://codecov.io/gh/aegenet/yawt/branch/main/graph/badge.svg?token=4E9LC0O0X1)](https://codecov.io/gh/aegenet/yawt)
<br />

#  Yawt

Yet Another Workspace Toolkit - The purpose of this package is to provide a set of tools to help you manage your workspace.

## 💾 Installation

```shell
npm i @aegenet/yawt@~1 -D
# or
yarn add @aegenet/yawt@~1 -D
```

## 📝 Config files (./)

- `./.build/yawt.config.json`
```json
[{
  "name": "lib",
  "links": [],
  "dependencies": [],
  "publish": false
}, {
  "name": "app",
  "links": ["lib"],
  "dependencies": ["lib"],
  "publish": true
}]
```

- `eslint.config.cjs`
```javascript
const { eslintConfigurator } = require('@aegenet/yawt');
module.exports = eslintConfigurator();
```

- `prettier.config.cjs`
```javascript
const { prettierConfigurator } = require('@aegenet/yawt');
module.exports = prettierConfigurator();
```

- `vite.config.mjs`
```javascript
import { viteConfigurator } from '@aegenet/yawt';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export default viteConfigurator({
  cwd: dirname(fileURLToPath(import.meta.url)),
  libName: '@sample/lib',
  entryPoint: './src/index.ts',
  nodeExternal: true,
});
```

- `rollup.config.dts.cjs`
```javascript
const { rollupDTSConfigurator } = require('@aegenet/yawt');
const { cwd } = require('node:process');
export default rollupDTSConfigurator({
  cwd: cwd(),
  libName: '@sample/lib',
  entryPoint: './src/index.ts',
  nodeExternal: true,
});
```

- `tsconfig.json`
```json
{
  "extends": "./node_modules/@aegenet/yawt/tsconfig.base.json",
  "exclude": [
    "./node_modules",
  ],
  "include": [
    "src"
  ]
}
```

## 🖹 Exports

| Name | Description |
| --- | --- |
| `eslintConfigurator` | Configuration for eslint |
| `prettierConfigurator` | Configuration for prettier |
| `viteConfigurator` | Configuration for vite (and vitest) |
| `rollupDTSConfigurator` | Configuration for generate typings  |
| `yawt` | Yawt API  |

## CLI


## 📚 Examples


# Coverage

[![codecov](https://codecov.io/gh/aegenet/yawt/branch/main/graph/badge.svg?token=4E9LC0O0X1)](https://codecov.io/gh/aegenet/yawt)

![Coverage sunburst](https://codecov.io/gh/aegenet/yawt/branch/main/graphs/sunburst.svg?token=4E9LC0O0X1)

![Coverage tree](https://codecov.io/gh/aegenet/yawt/branch/main/graphs/tree.svg?token=4E9LC0O0X1)

## 📝 License

[The MIT License](LICENSE) - Copyright © 2024 [Alexandre Genet](https://github.com/aegenet).
