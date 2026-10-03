import { useContext, useState } from 'react';
import { SlideContext } from 'spectacle';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ZoomIn } from 'lucide-react';
import { AnimatedElement } from './AnimatedElement';
import { Icon } from './Icon';
import { Modal } from './Modal';
import type { SlideData } from '../content/schema';
import { PlaybackContext } from './PlaybackContext';
import { revealInterval } from '../lib/timeline';
export function SlideContent({ slide, replay, onZoom }: { slide: SlideData; replay: number; onZoom: (open: boolean) => void }) {
  const context = useContext(SlideContext); const { t } = useTranslation(); const [zoom, setZoom] = useState(false);
  const elapsed = useContext(PlaybackContext);
  if (!context.isSlideActive) return null;
  return <article key={`${slide.id}-${replay}`} className={`slide-body layout-${slide.layout}${slide.illustration ? ' has-illustration' : ''}`} data-slide-id={slide.id}>
    {slide.layout !== 'image' && <AnimatedElement className="slide-symbol" slide={slide}><Icon name={slide.icon} size={36} /></AnimatedElement>}
    <AnimatedElement slide={slide} index={1}>
      {slide.eyebrowKey && <div className="eyebrow">{t(slide.eyebrowKey)}</div>}
      <h1 className="slide-title">{t(slide.titleKey)}</h1>
    </AnimatedElement>
    {slide.bodyKey && <AnimatedElement slide={slide} index={2}><p className="slide-description">{t(slide.bodyKey)}</p></AnimatedElement>}
    {slide.illustration && <AnimatedElement slide={slide} index={0} className="slide-illustration"><img src={slide.illustration.src} alt={t(slide.illustration.altKey)} /></AnimatedElement>}
    {slide.image && <AnimatedElement slide={slide} index={0} className="slide-image-container"><button className="image-button" onClick={() => { setZoom(true); onZoom(true); }} aria-label={t('ui.zoom')}><img src={slide.image} alt={t(slide.altKey ?? slide.titleKey)} /><span className="zoom-icon"><ZoomIn size={20} /></span></button></AnimatedElement>}
    {!!slide.items.length && <div className={`slide-items items-${slide.layout}`}>
      {slide.items.map((item, index) => <AnimatedElement slide={slide} index={index + 3} className="slide-item" key={item.titleKey}>
        <div className="item-icon"><Icon name={item.icon} size={25} /></div>
        <div><h2>{t(item.titleKey)}</h2>{item.bodyKey && <p>{t(item.bodyKey)}</p>}</div>
        {slide.layout === 'steps' && index < slide.items.length - 1 && <svg className="step-connector" viewBox="0 0 20 32" aria-hidden="true"><path d="M10 0 V27 M4 21 L10 27 L16 21" fill="none" stroke="currentColor" strokeWidth="2" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - Math.max(0, Math.min(1, (elapsed - (index + 3.5) * revealInterval(slide)) / 600))} /></svg>}
      </AnimatedElement>)}
    </div>}
    {slide.action && <AnimatedElement slide={slide} index={slide.items.length + 3} className="slide-action">
      {slide.action.type === 'documents' ? <Link className="button primary" to={`/documents?from=${encodeURIComponent(slide.id)}`}>{t(slide.action.labelKey)}<Icon name="arrow" size={20} /></Link>
        : <a className="button primary" href={slide.action.href} target="_blank" rel="noopener noreferrer">{t(slide.action.labelKey)}<ArrowUpRight size={20} /><span className="sr-only">{t('ui.newTab')}</span></a>}
    </AnimatedElement>}
    {zoom && slide.image && <Modal wide title={t('ui.zoom')} onClose={() => { setZoom(false); onZoom(false); }}><img className="zoom-image" src={slide.image} alt={t(slide.altKey ?? slide.titleKey)} /></Modal>}
  </article>;
}
