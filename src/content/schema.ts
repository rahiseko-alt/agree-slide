import { z } from 'zod';

// Local paths and HTTPS links work on static hosts. Executable URL schemes are rejected.
export const safeLink = (value: string) => /^(https:\/\/[^\s]+|\/(?!\/)[^\s]*|\.\.?\/[^\s]*)$/.test(value)
  && !/[\\\u0000-\u0020]/.test(value);
const imageSource = (value: string) => safeLink(value) || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value);
const key = z.string().min(1).max(150);
const icon = z.enum(['sparkles', 'globe', 'layers', 'file', 'check', 'arrow', 'play', 'hand', 'shield']);
const slideSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  titleKey: key, eyebrowKey: key.optional(), bodyKey: key.optional(),
  layout: z.enum(['intro', 'steps', 'cards', 'image', 'finish']),
  icon: icon.default('sparkles'),
  animation: z.enum(['fade', 'slide', 'scale']).default('slide'),
  staggerMs: z.number().min(0).max(2000).default(160),
  items: z.array(z.object({ titleKey: key, bodyKey: key.optional(), icon: icon.default('check') })).max(8).default([]),
  image: z.string().refine(imageSource, 'Image must be a local path, HTTPS URL or PNG/JPEG/WebP data URL').optional(),
  altKey: key.optional(),
  action: z.discriminatedUnion('type', [
    z.object({ type: z.literal('documents'), labelKey: key }),
    z.object({ type: z.literal('link'), labelKey: key, href: z.string().refine(safeLink, 'Unsafe link') }),
  ]).optional(),
}).superRefine((slide, ctx) => {
  if (slide.layout === 'image' && (!slide.image || !slide.altKey)) ctx.addIssue({ code: 'custom', message: 'Image slides require image and altKey' });
});
export const guideSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]+$/), titleKey: key, descriptionKey: key,
  slides: z.array(slideSchema).min(1).max(60),
  documents: z.array(z.object({
    id: z.string().regex(/^[a-zA-Z0-9_-]+$/), titleKey: key, descriptionKey: key,
    kind: z.enum(['pdf', 'web']), href: z.string().refine(safeLink, 'Unsafe link'),
  })).max(100).default([]),
}).superRefine((guide, ctx) => {
  for (const field of ['slides', 'documents'] as const) {
    const ids = guide[field].map(item => item.id);
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', path: [field], message: 'IDs must be unique' });
  }
});
export const bundleSchema = z.object({
  version: z.literal(1), guide: guideSchema,
  locales: z.record(z.string().regex(/^[a-z]{2,3}(-[A-Za-z]{2,4})?$/), z.record(z.string(), z.string())),
}).superRefine((bundle, ctx) => {
  if (!bundle.locales.ja) { ctx.addIssue({ code: 'custom', path: ['locales'], message: 'Japanese (ja) is the fallback locale and must be provided' }); return; }
  const keys = [bundle.guide.titleKey, bundle.guide.descriptionKey];
  bundle.guide.slides.forEach(s => keys.push(s.titleKey, ...[s.eyebrowKey, s.bodyKey, s.altKey, s.action?.labelKey].filter((k): k is string => !!k), ...s.items.flatMap(item => [item.titleKey, ...(item.bodyKey ? [item.bodyKey] : [])])));
  bundle.guide.documents.forEach(d => keys.push(d.titleKey, d.descriptionKey));
  for (const k of new Set(keys)) if (!bundle.locales.ja[k]?.trim()) ctx.addIssue({ code: 'custom', path: ['locales', 'ja', k], message: 'Missing Japanese content translation' });
});
export type GuideBundle = z.infer<typeof bundleSchema>;
export type GuideData = GuideBundle['guide'];
export type SlideData = GuideData['slides'][number];
