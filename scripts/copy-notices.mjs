import fs from 'node:fs';
fs.cpSync('docs/licenses', 'dist/licenses', { recursive: true });
fs.copyFileSync('docs/THIRD_PARTY_LICENSES.md', 'dist/THIRD_PARTY_LICENSES.md');
fs.copyFileSync('LICENSE', 'dist/LICENSE');
