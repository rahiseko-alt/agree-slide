import { z } from 'zod';
import { bundleSchema, safeLink, type GuideBundle } from './schema.ts';

const language = z.string().regex(/^[a-z]{2,3}(-[A-Za-z]{2,4})?$/);
const text = z.record(language, z.string().max(4000)).refine(value => !!value.ja?.trim(), 'Japanese source text is required');
const id = z.string().regex(/^[a-zA-Z0-9_-]+$/);
const icon = z.enum(['sparkles', 'globe', 'layers', 'file', 'check', 'arrow', 'play', 'hand', 'shield', 'person', 'pen']);
export const projectSchema = z.object({
  id, title: text, description: text,
  slides: z.array(z.object({
    id, pattern: z.enum(['intro', 'steps', 'cards', 'compare', 'quote', 'finish']),
    title: text, body: text.optional(), label: text.optional(), icon: icon.default('person'),
    animation: z.enum(['fade', 'slide', 'scale']).default('slide'),
    durationSeconds: z.number().min(3).max(120).default(12),
    revealEverySeconds: z.number().min(0.3).max(10).default(1.2),
    pauseAfter: z.boolean().default(false),
    illustration: z.object({ assetId: id, alt: text }).optional(),
    items: z.array(z.object({ title: text, body: text.optional(), icon: icon.default('check') })).max(3).default([]),
    action: z.discriminatedUnion('type', [
      z.object({ type: z.literal('documents'), label: text }),
      z.object({ type: z.literal('link'), label: text, href: z.string().refine(safeLink, 'Unsafe link') }),
    ]).optional(),
    narration: z.object({ script: text, audio: z.record(language, z.string().refine(safeLink)).default({}) }).optional(),
    source: z.string().optional(),
  }).superRefine((scene, ctx) => {
    if (scene.illustration && !['intro', 'quote', 'finish'].includes(scene.pattern)) ctx.addIssue({ code: 'custom', message: 'Use illustrations in intro, quote or finish scenes. Other patterns use standard icons.' });
  })).min(1).max(60),
  documents: z.array(z.object({ id, title: text, description: text, kind: z.enum(['pdf', 'web']), href: z.string().refine(safeLink) })).default([]),
});
export type IllustrationAsset = { id: string; path: string };
export function compileProject(input: unknown, assets: IllustrationAsset[]): GuideBundle {
  const project = projectSchema.parse(input);
  const locales: Record<string, Record<string, string>> = { ja: {} };
  const add = (key: string, translations: Record<string, string>) => {
    for (const [language, value] of Object.entries(translations)) (locales[language] ??= {})[key] = value;
    return key;
  };
  const slides = project.slides.map(scene => {
    const prefix = `scene.${scene.id}`;
    const asset = scene.illustration && assets.find(asset => asset.id === scene.illustration!.assetId);
    if (scene.illustration && !asset) throw new Error(`Unknown illustration: ${scene.illustration.assetId}. Check public/illustrations/catalog.json.`);
    return {
      id: scene.id, layout: scene.pattern, titleKey: add(`${prefix}.title`, scene.title),
      bodyKey: scene.body && add(`${prefix}.body`, scene.body), eyebrowKey: scene.label && add(`${prefix}.label`, scene.label),
      icon: scene.icon, animation: scene.animation,
      playback: { durationMs: Math.round(scene.durationSeconds * 1000), revealEveryMs: Math.round(scene.revealEverySeconds * 1000), pauseAfter: scene.pauseAfter },
      illustration: asset && { src: asset.path, altKey: add(`${prefix}.alt`, scene.illustration!.alt) },
      items: scene.items.map((item, index) => ({ titleKey: add(`${prefix}.item${index}.title`, item.title), bodyKey: item.body && add(`${prefix}.item${index}.body`, item.body), icon: item.icon })),
      action: scene.action && { ...scene.action, label: undefined, labelKey: add(`${prefix}.action`, scene.action.label) },
      narration: scene.narration && { textKey: add(`${prefix}.narration`, scene.narration.script), audio: scene.narration.audio },
    };
  });
  return bundleSchema.parse({ version: 1, guide: {
    id: project.id, titleKey: add('guide.title', project.title), descriptionKey: add('guide.description', project.description), slides,
    documents: project.documents.map(document => ({ id: document.id, titleKey: add(`document.${document.id}.title`, document.title), descriptionKey: add(`document.${document.id}.body`, document.description), kind: document.kind, href: document.href })),
  }, locales });
}
