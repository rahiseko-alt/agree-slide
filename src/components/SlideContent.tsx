import { useContext, useState } from 'react';
import { SlideContext } from 'spectacle';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ZoomIn } from 'lucide-react';
import { AnimatedElement } from './AnimatedElement';
import { Icon } from './Icon';
import { Modal } from './Modal';
import type { SlideData } from '../content/schema';
export function SlideContent({ slide, replay }: { slide: SlideData; replay: number }) {
  const context = useContext(SlideContext); const { t } = useTranslation(); const [zoom, setZoom] = useState(false);
  if (!context.isSlideActive) return null;
  return <article key={`${slide.id}-${replay}`} className={`slide-body layout-${slide.layout}`} data-slide-id={slide.id}>
    {slide.layout !== 'image' && <AnimatedElement className="slide-symbol" slide={slide}><Icon name={slide.icon} size={36} /></AnimatedElement>}
    <AnimatedElement slide={slide} index={1}>
      {slide.eyebrowKey && <div className="eyebrow">{t(slide.eyebrowKey)}</div>}
      <h1 className="slide-title">{t(slide.titleKey)}</h1>
    </AnimatedElement>
    {slide.bodyKey && <AnimatedElement slide={slide} index={2}><p className="slide-description">{t(slide.bodyKey)}</p></AnimatedElement>}
    {slide.image && <AnimatedElement slide={slide} index={2} className="slide-image-container"><button className="image-button" onClick={() => setZoom(true)} aria-label={t('ui.zoom')}><img src={slide.image} alt={t(slide.altKey ?? slide.titleKey)} /><span className="zoom-icon"><ZoomIn size={20} /></span></button></AnimatedElement>}
    {!!slide.items.length && <div className={`slide-items items-${slide.layout}`}>
      {slide.items.map((item, index) => <AnimatedElement slide={slide} index={index + 3} className="slide-item" key={item.titleKey}>
        <div className="item-icon">{slide.layout === 'steps' ? String(index + 1).padStart(2, '0') : <Icon name={item.icon} size={25} />}</div>
        <div><h2>{t(item.titleKey)}</h2>{item.bodyKey && <p>{t(item.bodyKey)}</p>}</div>
      </AnimatedElement>)}
    </div>}
    {slide.action && <AnimatedElement slide={slide} index={slide.items.length + 3} className="slide-action">
      {slide.action.type === 'documents' ? <Link className="button primary" to={`/documents?from=${encodeURIComponent(slide.id)}`}>{t(slide.action.labelKey)}<Icon name="arrow" size={20} /></Link>
        : <a className="button primary" href={slide.action.href} target="_blank" rel="noopener noreferrer">{t(slide.action.labelKey)}<ArrowUpRight size={20} /><span className="sr-only">{t('ui.newTab')}</span></a>}
    </AnimatedElement>}
    {zoom && slide.image && <Modal wide title={t('ui.zoom')} onClose={() => setZoom(false)}><img className="zoom-image" src={slide.image} alt={t(slide.altKey ?? slide.titleKey)} /></Modal>}
  </article>;
}
