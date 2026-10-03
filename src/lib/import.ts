import { bundleSchema, type GuideBundle } from '../content/schema';

const MAX_BYTES = 30 * 1024 * 1024;
export async function importJson(file: File): Promise<GuideBundle> {
  if (file.size > 100 * 1024 * 1024) throw new Error('JSON must be under 100 MB');
  return bundleSchema.parse(JSON.parse(await file.text()));
}
const readImage = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file);
});
export async function importMedia(files: File[], onProgress: (done: number, total: number) => void): Promise<GuideBundle> {
  const images: { source: string; name: string }[] = [];
  const isPdf = files.length === 1 && /\.pdf$/i.test(files[0].name);
  if (files.reduce((sum, f) => sum + f.size, 0) > MAX_BYTES) throw new Error('Total input must be under 30 MB');
  if (isPdf) {
    const pdfjs = await import('pdfjs-dist');
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const loading = pdfjs.getDocument({ data: new Uint8Array(await files[0].arrayBuffer()) });
    const pdf = await loading.promise;
    try {
      if (pdf.numPages > 60) throw new Error('PDF must have 60 pages or fewer');
      for (let number = 1; number <= pdf.numPages; number++) {
        const page = await pdf.getPage(number);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(2, 1600 / Math.max(base.width, base.height)) });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas unavailable');
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        images.push({ source: canvas.toDataURL('image/jpeg', 0.86), name: `${files[0].name} · ${number}` });
        canvas.width = 0; canvas.height = 0; page.cleanup(); onProgress(number, pdf.numPages);
        await new Promise(resolve => window.setTimeout(resolve, 0));
      }
    } finally { await loading.destroy(); }
  } else {
    if (!files.length || files.length > 60) throw new Error('Select 1–60 images');
    // The order is explicit: filenames, using numeric sorting (01, 02, …, 10).
    const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    for (const [index, file] of sorted.entries()) {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Use PNG, JPEG or WebP images, or one PDF');
      const source = await readImage(file);
      const img = new Image(); img.src = source; await img.decode();
      images.push({ source, name: file.name }); onProgress(index + 1, files.length);
    }
  }
  const strings: Record<string, string> = { 'guide.title': files[0].name.replace(/\.[^.]+$/, ''), 'guide.description': '', };
  // Image content is unchanged by language selection; text can be added via exported JSON.
  strings['guide.description'] = 'インポートしたスライド';
  const slides = images.map((image, index) => {
    strings[`import.${index}.title`] = image.name;
    strings[`import.${index}.alt`] = image.name;
    return { id: `page-${index + 1}`, titleKey: `import.${index}.title`, layout: 'image' as const, image: image.source, altKey: `import.${index}.alt`, animation: 'fade' as const, items: [] };
  });
  return bundleSchema.parse({ version: 1, guide: { id: 'imported-guide', titleKey: 'guide.title', descriptionKey: 'guide.description', slides, documents: [] }, locales: { ja: strings, en: {}, ne: {}, vi: {} } });
}
export function downloadBundle(bundle: GuideBundle) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'guide.bundle.json'; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
