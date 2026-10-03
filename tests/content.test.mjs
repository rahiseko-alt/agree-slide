import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { compileProject } from '../src/content/project.ts';

const source = JSON.parse(fs.readFileSync('content/demo.project.json', 'utf8'));
const assets = JSON.parse(fs.readFileSync('public/illustrations/catalog.json', 'utf8')).assets;
test('agent-authored content compiles all languages, illustration and narration without losing source text', () => {
  const output = compileProject(source, assets);
  assert.equal(output.guide.slides.length, source.slides.length);
  assert.deepEqual(Object.keys(output.locales).sort(), ['en', 'ja', 'ne', 'vi']);
  for (const [index, original] of source.slides.entries()) {
    const compiled = output.guide.slides[index];
    for (const language of Object.keys(output.locales)) {
      assert.equal(output.locales[language][compiled.titleKey], original.title[language]);
      assert.equal(output.locales[language][compiled.narration.textKey], original.narration.script[language]);
      assert.equal(compiled.narration.audio[language], original.narration.audio[language]);
    }
    if (original.illustration) assert.equal(compiled.illustration.src, assets.find(asset => asset.id === original.illustration.assetId).path);
  }
});
test('production rejects invented asset ids, unsafe signing links and overcrowded scenes', () => {
  const unknown = structuredClone(source); unknown.slides[0].illustration.assetId = 'not-downloaded';
  assert.throws(() => compileProject(unknown, assets), /Unknown illustration/);
  const unsafe = structuredClone(source); unsafe.slides[0].action = { type: 'link', label: { ja: '署名' }, href: 'javascript:alert(1)' };
  assert.throws(() => compileProject(unsafe, assets), /Unsafe link/);
  const crowded = structuredClone(source); crowded.slides[2].items.push(crowded.slides[2].items[0]);
  assert.throws(() => compileProject(crowded, assets));
});
test('comparison and quote patterns compile using the same production format', () => {
  const project = structuredClone(source);
  project.slides = [project.slides[1], project.slides[0]];
  project.slides[0].pattern = 'compare'; project.slides[1].pattern = 'quote';
  const output = compileProject(project, assets);
  assert.equal(output.guide.slides[0].layout, 'compare');
  assert.equal(output.guide.slides[1].layout, 'quote');
});
