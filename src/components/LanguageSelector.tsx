import { Globe2, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGuide } from '../state';
import { savePreference } from '../lib/storage';
export function LanguageSelector({ large = false }: { large?: boolean }) {
  const { i18n, t } = useTranslation(); const { bundle } = useGuide();
  return <label className={`language-select ${large ? 'language-large' : ''}`}><Globe2 size={large ? 21 : 18} /><span className="sr-only">{t('ui.language')}</span><select aria-label={t('ui.language')} value={i18n.language} onChange={e => { const lang = e.target.value; savePreference('guide-language', lang); void i18n.changeLanguage(lang); document.documentElement.lang = lang; }}>
    {Object.entries(bundle.locales).map(([code, text]) => <option key={code} value={code}>{text.languageName || new Intl.DisplayNames([code], { type: 'language' }).of(code) || code}</option>)}
  </select><ChevronDown size={16} /></label>;
}
