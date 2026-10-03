import fs from 'node:fs';
import { bundleSchema } from '../src/content/schema.ts';
export function readSource() {
  const published = 'src/content/published.bundle.json';
  if (fs.existsSync(published)) return JSON.parse(fs.readFileSync(published, 'utf8'));
  const locales = Object.fromEntries(fs.readdirSync('src/locales').filter(f => f.endsWith('.json')).map(file => [file.replace('.json', ''), JSON.parse(fs.readFileSync(`src/locales/${file}`, 'utf8'))]));
  return { version: 1, guide: JSON.parse(fs.readFileSync('src/content/guide.json', 'utf8')), locales };
}
const fileIndex = process.argv.indexOf('--file');
const bundle = bundleSchema.parse(fileIndex < 0 ? readSource() : JSON.parse(fs.readFileSync(process.argv[fileIndex + 1], 'utf8')));
const keys = new Set([bundle.guide.titleKey, bundle.guide.descriptionKey]);
bundle.guide.slides.forEach(s => [s.titleKey,s.eyebrowKey,s.bodyKey,s.altKey,s.action?.labelKey,...s.items.flatMap(i=>[i.titleKey,i.bodyKey])].filter(Boolean).forEach(k=>keys.add(k)));
bundle.guide.documents.forEach(d => {keys.add(d.titleKey);keys.add(d.descriptionKey)});
for (const [lang, strings] of Object.entries(bundle.locales)) {
  const missing = [...keys].filter(key => !strings[key]);
  if (missing.length) console.warn(`${lang}: ${missing.length} missing translations; Japanese fallback will be used.`);
}
console.log(`Content valid: ${bundle.guide.slides.length} slides, ${Object.keys(bundle.locales).length} languages, ${bundle.guide.documents.length} documents.`);
