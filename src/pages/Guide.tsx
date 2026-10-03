import { useContext, useEffect, useRef, useState, type ComponentType } from 'react';
import { Deck, DeckContext, Slide, type DeckProps } from 'spectacle';
import { Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, List, RotateCcw, RotateCw } from 'lucide-react';
import { useGuide } from '../state';
import { SlideContent } from '../components/SlideContent';
import { Modal } from '../components/Modal';
import { LanguageSelector } from '../components/LanguageSelector';
import { savePreference } from '../lib/storage';

// Spectacle forwards these documented-in-source runtime options to DeckInternal.
// Our router owns navigation, keeping static-host URLs and return positions stable.
const EmbeddedDeck = Deck as ComponentType<DeckProps & { disableInteractivity: boolean }>;
function RouteSync({ index }: { index: number }) {
  const deck = useContext(DeckContext);
  useEffect(() => { if (deck.initialized && deck.pendingView.slideIndex !== index) deck.skipTo({ slideIndex: index, stepIndex: 0 }); }, [index, deck.initialized, deck.pendingView.slideIndex, deck.skipTo]);
  return null;
}
export function Guide() {
  const { bundle } = useGuide(); const { t } = useTranslation(); const { slideId } = useParams(); const navigate = useNavigate();
  const slides = bundle.guide.slides; const index = slides.findIndex(slide => slide.id === slideId);
  const [contents, setContents] = useState(false); const [replay, setReplay] = useState(0);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const go = (next: number) => { if (next >= 0 && next < slides.length) navigate(`/guide/${slides[next].id}`); };
  useEffect(() => {
    if (index >= 0) savePreference(`guide-position-${bundle.guide.id}`, slides[index].id);
    const main = document.getElementById('main'); main?.setAttribute('tabindex', '-1'); main?.focus({ preventScroll: true });
  }, [index, slides, bundle.guide.id]);
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (document.querySelector('dialog[open]') || (e.target as HTMLElement).closest('input,textarea,select,button,a,[contenteditable]') || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
      if (e.key === 'Home') { e.preventDefault(); go(0); }
      if (e.key === 'End') { e.preventDefault(); go(slides.length - 1); }
    };
    window.addEventListener('keydown', keydown); return () => window.removeEventListener('keydown', keydown);
  }, [index, slides, navigate]);
  if (index < 0) return <Navigate replace to={`/guide/${slides[0].id}`} />;
  const list = <ol className="contents-list">{slides.map((slide, number) => <li key={slide.id}><button className={number === index ? 'active' : ''} aria-current={number === index ? 'step' : undefined} onClick={() => { go(number); setContents(false); }}><span className="list-number">{String(number + 1).padStart(2, '0')}</span><span>{t(slide.titleKey).replace(/\n/g, ' ')}</span>{number < index && <span className="completed-dot" />}</button></li>)}</ol>;
  return <main id="main" className="guide-page">
    <div className="page-heading"><div><div className="eyebrow">INTERACTIVE GUIDE</div><h2>{t(bundle.guide.titleKey)}</h2></div><Link className="text-link" to={`/documents?from=${slides[index].id}`}>{t('ui.documents')}<ArrowRight size={17} /></Link></div>
    <p className="orientation-note"><RotateCw size={18} />{t('ui.rotate')}</p><div className="guide-grid"><aside className="guide-sidebar"><div className="aside-label">{t('ui.contents')}<span>{String(slides.length).padStart(2, '0')}</span></div>{list}<div className="sidebar-note"><span className="small-dot" />{t('ui.reading')}</div></aside>
      <div className="guide-player">
        <div className="player-toolbar"><button className="text-button mobile-contents" onClick={() => setContents(true)}><List size={18} />{t('ui.contents')}</button><span className="player-step">{t('ui.step')} {String(index + 1).padStart(2, '0')} <span>/ {String(slides.length).padStart(2, '0')}</span></span><button className="icon-button" aria-label={t('ui.replay')} onClick={() => setReplay(value => value + 1)}><RotateCw size={18} /></button><div className="landscape-language"><LanguageSelector /></div></div>
        <div className="deck-frame" onTouchStartCapture={e => {
          e.stopPropagation(); if ((e.target as HTMLElement).closest('button,a,dialog')) { touch.current = null; return; }
          touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }} onTouchEndCapture={e => {
          e.stopPropagation(); const start = touch.current; touch.current = null; if (!start) return;
          const dx = e.changedTouches[0].clientX - start.x; const dy = e.changedTouches[0].clientY - start.y;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) go(index + (dx < 0 ? 1 : -1));
        }} onTouchCancelCapture={() => { touch.current = null; }}>
          <EmbeddedDeck key={bundle.guide.id} disableInteractivity theme={{ size: { width: 1024, height: 576 }, colors: { primary: '#193f35', secondary: '#193f35', tertiary: '#ffffff' }, backdropStyle: { position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#fff' } }} template={<></>} transition={{ from: { opacity: 1 }, enter: { opacity: 1 }, leave: { opacity: 1 } }}>
            <RouteSync index={index} />
            {slides.map(slide => <Slide key={slide.id} id={slide.id} padding={0} backgroundColor="#ffffff"><SlideContent slide={slide} replay={replay} /></Slide>)}
          </EmbeddedDeck>
        </div>
        <div className="player-progress" role="progressbar" aria-label={t('ui.progress')} aria-valuemin={0} aria-valuemax={slides.length} aria-valuenow={index + 1}><div style={{ width: `${(index + 1) / slides.length * 100}%` }} /></div>
        <nav className="player-navigation" aria-label={t('ui.guide')}><button className="button secondary" disabled={index === 0} onClick={() => go(index - 1)}><ArrowLeft size={19} />{t('ui.back')}</button><span className="page-counter" aria-live="polite">{index + 1} <span>/ {slides.length}</span></span>{index < slides.length - 1 ? <button className="button primary" onClick={() => go(index + 1)}>{t('ui.next')}<ArrowRight size={19} /></button> : <Link className="button primary" to="/complete">{t('ui.finish')}<IconCheck /></Link>}</nav>
      </div>
    </div><div className="guide-footer"><Link className="text-link muted" to={`/guide/${slides[0].id}`}><RotateCcw size={15} />{t('ui.restart')}</Link><span>{t('ui.keyboard')}</span></div>
    {contents && <Modal title={t('ui.contents')} onClose={() => setContents(false)}>{list}<Link className="text-link contents-home" to="/">{t('ui.home')}<ArrowRight size={16} /></Link></Modal>}
  </main>;
}
function IconCheck() { return <span aria-hidden="true">✓</span>; }
