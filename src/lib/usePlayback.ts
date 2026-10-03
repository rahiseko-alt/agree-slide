import { useEffect, useRef, useState } from 'react';

export function usePlayback(key: string, duration: number, onEnd: () => void, blocked: boolean) {
  const [clock, setClock] = useState({ key, elapsed: 0 });
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(!document.hidden);
  const completed = useRef(false);
  const elapsed = clock.key === key ? Math.min(clock.elapsed, duration) : 0;
  useEffect(() => { setClock({ key, elapsed: 0 }); completed.current = false; }, [key]);
  useEffect(() => {
    const change = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', change);
    return () => document.removeEventListener('visibilitychange', change);
  }, []);
  useEffect(() => {
    if (!playing || blocked || !visible) return;
    let frame: number; let previous = performance.now();
    const tick = (now: number) => {
      const delta = now - previous; previous = now;
      setClock(value => ({ key, elapsed: Math.min(duration, (value.key === key ? value.elapsed : 0) + delta) }));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [key, duration, playing, blocked, visible]);
  useEffect(() => {
    if (elapsed < duration) { completed.current = false; return; }
    if (playing && !blocked && !completed.current) { completed.current = true; onEnd(); }
  }, [elapsed, duration, playing, blocked, onEnd]);
  const seek = (value: number) => setClock({ key, elapsed: Math.max(0, Math.min(value, duration)) });
  const restart = () => { completed.current = false; seek(0); setPlaying(true); };
  const toggle = () => { if (!playing && elapsed >= duration) seek(0); setPlaying(value => !value); };
  return { elapsed, playing, running: playing && !blocked && visible, setPlaying, seek, restart, toggle };
}
