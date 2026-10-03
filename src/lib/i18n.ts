import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { readPreference } from './storage';
import type { GuideBundle } from '../content/schema';
export const uiLocales = Object.fromEntries(Object.entries(import.meta.glob('../locales/*.json', { eager: true, import: 'default' })).map(([path, data]) => [path.split('/').pop()!.replace('.json', ''), data as Record<string, string>]));
await i18n.use(initReactI18next).init({
  lng: readPreference('guide-language') ?? 'ja', fallbackLng: 'ja',
  resources: Object.fromEntries(Object.entries(uiLocales).map(([lang, translation]) => [lang, { translation }])),
  keySeparator: false, interpolation: { escapeValue: false }, returnEmptyString: false,
});
export async function applyLocales(bundle: GuideBundle) {
  for (const lang of Object.keys(i18n.store.data)) i18n.removeResourceBundle(lang, 'translation');
  for (const [lang, text] of Object.entries(bundle.locales)) {
    const uiOnly = (strings: Record<string, string> = {}) => Object.fromEntries(Object.entries(strings).filter(([key]) => key.startsWith('ui.') || key === 'languageName'));
    i18n.addResourceBundle(lang, 'translation', { ...uiOnly(uiLocales.ja), ...uiOnly(uiLocales[lang]), ...text }, true, true);
  }
  if (!bundle.locales[i18n.language]) await i18n.changeLanguage('ja');
}
export default i18n;
