import fs from 'node:fs';
import { bundleSchema } from '../src/content/schema.ts';
const file = process.argv[2];
if (!file) { console.error('Usage: npm run content:publish -- /path/to/guide.bundle.json'); process.exit(1); }
const bundle = bundleSchema.parse(JSON.parse(fs.readFileSync(file, 'utf8')));
fs.writeFileSync('src/content/published.bundle.json', JSON.stringify(bundle, null, 2) + '\n');
console.log('Content added to src/content/published.bundle.json. Run npm run build to create a shareable static app.');
