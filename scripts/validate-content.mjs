import fs from 'node:fs';
import path from 'node:path';
import { bundleSchema } from '../src/content/schema.ts';
export function readSource() {
  const published = 'src/content/published.bundle.json';
  if (fs.existsSync(published)) return JSON.parse(fs.readFileSync(published, 'utf8'));
  const locales = Object.fromEntries(fs.readdirSync('src/locales').filter(f => f.endsWith('.json')).map(file => [file.replace('.json', ''), JSON.parse(fs.readFileSync(`src/locales/${file}`, 'utf8'))]));
  return { version: 1, guide: JSON.parse(fs.readFileSync('src/content/guide.json', 'utf8')), locales };
}
const fileIndex = process.argv.indexOf('--file');
const bundle = bundleSchema.parse(fileIndex < 0 ? readSource() : JSON.parse(fs.readFileSync(process.argv[fileIndex + 1], 'utf8')));
const publicRoot = path.resolve('public');
const assetLinks = bundle.guide.slides.flatMap(slide => [slide.image, slide.illustration?.src, ...Object.values(slide.narration?.audio ?? {})]);
assetLinks.push(...bundle.guide.documents.map(document => document.href));
for (const link of assetLinks.filter(Boolean)) {
  if (/^(https:|data:)/.test(link)) continue;
  const filename = path.resolve(publicRoot, link.replace(/^\//, '').split(/[?#]/)[0]);
  if (!filename.startsWith(publicRoot + path.sep) || !fs.existsSync(filename)) throw new Error(`Missing public asset: ${link}`);
}
const keys = new Set([bundle.guide.titleKey, bundle.guide.descriptionKey]);
bundle.guide.slides.forEach(s => [s.titleKey,s.eyebrowKey,s.bodyKey,s.altKey,s.illustration?.altKey,s.narration?.textKey,s.action?.labelKey,...s.items.flatMap(i=>[i.titleKey,i.bodyKey])].filter(Boolean).forEach(k=>keys.add(k)));
bundle.guide.documents.forEach(d => {keys.add(d.titleKey);keys.add(d.descriptionKey)});
for (const [lang, strings] of Object.entries(bundle.locales)) {
  const missing = [...keys].filter(key => !strings[key]);
  if (missing.length) console.warn(`${lang}: ${missing.length} missing translations; Japanese fallback will be used.`);
}
console.log(`Content valid: ${bundle.guide.slides.length} slides, ${Object.keys(bundle.locales).length} languages, ${bundle.guide.documents.length} documents.`);
