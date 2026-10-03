import fs from 'node:fs';
import path from 'node:path';
import { compileProject } from '../src/content/project.ts';

const args = process.argv.slice(2);
const at = args.indexOf('--file');
const input = at >= 0 ? args[at + 1] : 'content/project.json';
if (!input || !fs.existsSync(input)) {
  console.error('Create content/project.json from the source material first. See docs/AUTHORING.md and content/demo.project.json.');
  process.exit(1);
}
const catalog = JSON.parse(fs.readFileSync('public/illustrations/catalog.json', 'utf8'));
const bundle = compileProject(JSON.parse(fs.readFileSync(input, 'utf8')), catalog.assets);
const outputAt = args.indexOf('--out');
const output = outputAt >= 0 ? args[outputAt + 1] : 'src/content/published.bundle.json';
if (!output) throw new Error('--out needs a filename');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(bundle, null, 2) + '\n');
console.log(`Compiled ${bundle.guide.slides.length} scenes → ${output}`);
