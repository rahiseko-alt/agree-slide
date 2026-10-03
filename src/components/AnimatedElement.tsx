import { motion, useReducedMotion } from 'framer-motion';
import { useContext, type ReactNode } from 'react';
import type { SlideData } from '../content/schema';
import { PlaybackContext } from './PlaybackContext';
import { revealInterval } from '../lib/timeline';
export function AnimatedElement({ children, index = 0, slide, className }: { children: ReactNode; index?: number; slide: SlideData; className?: string }) {
  const reduce = useReducedMotion();
  const elapsed = useContext(PlaybackContext);
  const at = index * revealInterval(slide);
  const fraction = Math.max(0, Math.min(1, (elapsed - at) / 600));
  const progress = reduce ? Number(elapsed >= at) : 1 - (1 - fraction) ** 3;
  const shown = elapsed >= at;
  return <motion.div className={className} aria-hidden={!shown}
    style={{ opacity: progress, visibility: shown ? 'visible' : 'hidden', pointerEvents: shown ? 'auto' : 'none', y: slide.animation === 'slide' ? (1 - progress) * 48 : 0, scale: slide.animation === 'scale' ? 0.75 + progress * 0.25 : 1 }}>{children}</motion.div>;
}
