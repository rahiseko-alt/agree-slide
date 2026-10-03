import { createContext, useContext, useState, type ReactNode } from 'react';
import { bundleSchema, type GuideBundle } from './content/schema';
import guide from './content/guide.json';
import { uiLocales, applyLocales } from './lib/i18n';
import { writeDraft } from './lib/storage';
const shipped = import.meta.glob('./content/published.bundle.json', { eager: true, import: 'default' });
export const defaultBundle = bundleSchema.parse(Object.values(shipped)[0] ?? { version: 1, guide, locales: uiLocales });
type State = { bundle: GuideBundle; isDraft: boolean; replace: (next: GuideBundle | null) => Promise<void> };
const Context = createContext<State | null>(null);
export function GuideProvider({ initial, children }: { initial: GuideBundle | null; children: ReactNode }) {
  const [bundle, setBundle] = useState(initial ?? defaultBundle); const [isDraft, setDraft] = useState(!!initial);
  const replace = async (next: GuideBundle | null) => { const value = next ? bundleSchema.parse(next) : defaultBundle; await writeDraft(next); await applyLocales(value); setBundle(value); setDraft(!!next); };
  return <Context.Provider value={{ bundle, isDraft, replace }}>{children}</Context.Provider>;
}
export function useGuide() { const context = useContext(Context); if (!context) throw new Error('GuideProvider is missing'); return context; }
