import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Check, Globe2, Smartphone, FileText } from 'lucide-react';
import { useGuide } from '../state';
import { readPreference } from '../lib/storage';
import { LanguageSelector } from '../components/LanguageSelector';
export function Home() {
  const { t } = useTranslation(); const { bundle } = useGuide(); const slides = bundle.guide.slides;
  const stored = readPreference(`guide-position-${bundle.guide.id}`); const resume = slides.find(s => s.id === stored);
  return <main id="main" className="home-page">
    <section className="home-hero"><div className="hero-copy"><div className="badge"><span className="small-dot" />{t('ui.choose')}</div><h1>{t('ui.welcome')}</h1><p className="hero-description">{t(bundle.guide.descriptionKey)}</p><div className="hero-features"><span><Globe2 size={16} />{t('ui.languagesCount', { count: Object.keys(bundle.locales).length })}</span><span><Smartphone size={16} />{t('ui.feature2')}</span></div></div>
      <div className="hero-art" aria-hidden="true"><img className="hero-stock" src="./illustrations/sitting-reading.png" alt="" /></div>
    </section>
    <section className="start-panel"><div className="start-copy"><div className="eyebrow">LET’S GET STARTED</div><h2>{t(bundle.guide.titleKey)}</h2><p>{t('ui.readyBody', { count: slides.length })}</p></div><div className="start-controls"><LanguageSelector large /><Link className="button primary start-button" to={`/guide/${slides[0].id}`}>{t('ui.start')}<ArrowRight size={20} /></Link>{resume && resume.id !== slides[0].id && <Link className="resume-link" to={`/guide/${resume.id}`}>{t('ui.continue')}<ArrowUpRight size={15} /></Link>}</div></section>
    <div className="home-bottom"><span><Check size={16} />{t('ui.privacy')}</span><Link className="text-link" to="/studio">{t('ui.studio')}<ArrowUpRight size={17} /></Link></div>
    <section className="preview-strip"><div className="eyebrow">{t('ui.contents')}</div><div className="preview-items">{slides.slice(0, 5).map((slide, index) => <Link to={`/guide/${slide.id}`} key={slide.id}><span>{String(index + 1).padStart(2, '0')}</span><p>{t(slide.titleKey).replace(/\n/g, ' ')}</p><ArrowUpRight size={17} /></Link>)}</div></section>
  </main>;
}
