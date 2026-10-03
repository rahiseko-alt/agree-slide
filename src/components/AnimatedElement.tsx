import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { SlideData } from '../content/schema';
export function AnimatedElement({ children, index = 0, slide, className }: { children: ReactNode; index?: number; slide: SlideData; className?: string }) {
  const reduce = useReducedMotion();
  const initial = reduce ? false : slide.animation === 'scale' ? { opacity: 0, scale: 0.92 } : slide.animation === 'fade' ? { opacity: 0 } : { opacity: 0, y: 20 };
  return <motion.div className={className} initial={initial} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: reduce ? 0 : 0.45, delay: reduce ? 0 : index * slide.staggerMs / 1000, ease: 'easeOut' }}>{children}</motion.div>;
}
