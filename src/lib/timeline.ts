import type { SlideData } from '../content/schema';

export const revealInterval = (slide: SlideData) => slide.playback?.revealEveryMs ?? 1200;
export function slideDuration(slide: SlideData) {
  const lastElement = slide.items.length + 3;
  // Leave reading time after the final element, even when an explicit duration is short.
  return Math.max(slide.playback?.durationMs ?? 10000, lastElement * revealInterval(slide) + 3000);
}
export function formatTime(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
