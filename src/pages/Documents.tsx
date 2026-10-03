import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, ArrowLeft, ArrowUpRight, Globe2 } from 'lucide-react';
import { useGuide } from '../state';
import { readPreference } from '../lib/storage';
export function Documents() {
  const { bundle } = useGuide(); const { t } = useTranslation(); const [params] = useSearchParams();
  const from = params.get('from') ?? readPreference(`guide-position-${bundle.guide.id}`);
  const slide = bundle.guide.slides.find(s => s.id === from) ?? bundle.guide.slides[0];
  return <main id="main" className="documents-page"><Link className="text-link muted back-link" to={`/guide/${slide.id}`}><ArrowLeft size={17} />{t('ui.return')}</Link><div className="eyebrow">RESOURCE LIBRARY</div><h1>{t('ui.documents')}</h1><p className="page-description">{t(bundle.guide.descriptionKey)}</p>
    <div className="document-list">{bundle.guide.documents.length ? bundle.guide.documents.map((document, index) => <article className="document-card" key={document.id}><div className="document-icon">{document.kind === 'pdf' ? <FileText size={29} /> : <Globe2 size={29} />}</div><div className="document-copy"><div className="document-meta">{String(index + 1).padStart(2, '0')} / {t(document.kind === 'pdf' ? 'ui.pdf' : 'ui.external')}</div><h2>{t(document.titleKey)}</h2><p>{t(document.descriptionKey)}</p></div><a href={document.href} className="button secondary" target="_blank" rel="noopener noreferrer" aria-label={`${t(document.titleKey)} — ${t('ui.open')} (${t('ui.newTab')})`}>{t('ui.open')}<ArrowUpRight size={18} /></a></article>) : <div className="empty-state"><FileText size={36} /><h2>{t('ui.noDocuments')}</h2><p>{t('ui.noDocumentsBody')}</p></div>}</div>
    <Link className="button primary" to={`/guide/${slide.id}`}><ArrowLeft size={19} />{t('ui.return')}</Link>
  </main>;
}
