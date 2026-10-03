import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Link, NavLink, Routes, Route, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Check } from 'lucide-react';
import { LanguageSelector } from './components/LanguageSelector';
import { Home } from './pages/Home';
import { Documents } from './pages/Documents';
import { Studio } from './pages/Studio';
import { useGuide } from './state';
const Guide = lazy(() => import('./pages/Guide').then(module => ({ default: module.Guide })));
function Shell({ storageWarning }: { storageWarning: boolean }) {
  const { t, i18n } = useTranslation(); const location = useLocation(); const { bundle, isDraft } = useGuide();
  useEffect(() => { document.documentElement.lang = i18n.language; document.title = `${t(bundle.guide.titleKey)} · Agree Slide`; }, [i18n.language, t, bundle]);
  useEffect(() => { window.scrollTo(0, 0); const main = document.getElementById('main'); main?.setAttribute('tabindex', '-1'); main?.focus({ preventScroll: true }); }, [location.pathname]);
  return <><a className="skip-link" href="#main" onClick={e => { e.preventDefault(); document.getElementById('main')?.focus(); }}>{t('ui.skip')}</a><header className="app-header"><Link className="brand" to="/" aria-label={`Agree Slide — ${t('ui.home')}`}><span className="brand-mark"><span /><span /><span /></span><span>Agree<span className="brand-light">Slide</span></span></Link><nav className="header-nav" aria-label={t('ui.guide')}><NavLink to={`/guide/${bundle.guide.slides[0].id}`} className={location.pathname.startsWith('/guide/') ? 'active' : ''}>{t('ui.guide')}</NavLink><NavLink to="/documents">{t('ui.documents')}</NavLink></nav><LanguageSelector /></header>
    {storageWarning && <div className="storage-warning" role="status">{t('ui.storageError')}</div>}
    <Suspense fallback={<main id="main" className="complete-page" role="status">{t('ui.loading')}</main>}><Routes><Route path="/" element={<Home />} /><Route path="/guide/:slideId" element={<Guide />} /><Route path="/documents" element={<Documents />} /><Route path="/studio" element={<Studio />} /><Route path="/complete" element={<Complete />} /><Route path="*" element={<NotFound />} /></Routes></Suspense>
    <footer className="app-footer"><span>Agree Slide</span><span>{isDraft ? t('ui.localDraft') : t('ui.reading')}</span><Link to="/studio">{t('ui.studio')}<ArrowRight size={14} /></Link></footer>
  </>;
}
function Complete() { const { t } = useTranslation(); const { bundle } = useGuide(); return <main id="main" className="complete-page"><div className="complete-check"><Check size={48} /></div><div className="eyebrow">ALL DONE</div><h1>{t('ui.completed')}</h1><p>{t(bundle.guide.descriptionKey)}</p><Link className="button primary" to="/documents">{t('ui.documents')}<ArrowRight size={19} /></Link><Link className="text-link" to={`/guide/${bundle.guide.slides[0].id}`}>{t('ui.restart')}</Link></main>; }
function NotFound() { const { t } = useTranslation(); return <main id="main" className="complete-page"><h1>{t('ui.notFound')}</h1><Link className="button primary" to="/">{t('ui.goHome')}</Link></main>; }
export default function App(props: { storageWarning: boolean }) { return <HashRouter><Shell {...props} /></HashRouter>; }
