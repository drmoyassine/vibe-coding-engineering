import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');
const suppliedTag = process.argv[2];
const expectedTag = `v${version}`;

if (suppliedTag !== expectedTag) {
  console.error(`Release tag mismatch: expected ${expectedTag}, received ${suppliedTag || '(none)'}`);
  process.exitCode = 1;
} else {
  console.log(`Release tag ${suppliedTag} matches package version ${version}.`);
}
