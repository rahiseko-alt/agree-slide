import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX } from 'lucide-react';

export function Narration({ src, elapsed, running, onDuration, onBuffering }: {
  src?: string; elapsed: number; running: boolean;
  onDuration: (duration: number) => void; onBuffering: (blocked: boolean) => void;
}) {
  const { t } = useTranslation(); const audio = useRef<HTMLAudioElement>(null);
  const [enabled, setEnabled] = useState(false); const [failed, setFailed] = useState(false);
  const [waiting, setWaiting] = useState(false); const pendingPlay = useRef(false);
  const time = useRef(elapsed); time.current = elapsed;
  const buffer = useRef(onBuffering); buffer.current = onBuffering;
  const callbacks = useRef(onDuration); callbacks.current = onDuration;
  useEffect(() => {
    setFailed(false); setWaiting(false);
    return () => { buffer.current(false); };
  }, [src]);
  useEffect(() => {
    const media = audio.current;
    if (!media || !src) return;
    if (!running || !enabled || failed) { media.pause(); setWaiting(false); onBuffering(false); return; }
    if (media.paused && !media.ended && !pendingPlay.current) {
      pendingPlay.current = true;
      void media.play().catch(() => { setEnabled(false); onBuffering(false); }).finally(() => { pendingPlay.current = false; });
    }
  }, [running, enabled, failed, src, onBuffering]);
  useEffect(() => {
    const media = audio.current;
    if (media?.readyState && !waiting && Math.abs(media.currentTime - elapsed / 1000) > 0.4) {
      media.currentTime = Math.min(elapsed / 1000, media.duration || 0);
    }
  }, [elapsed, waiting]);
  useEffect(() => {
    // A broken or stalled audio source must not trap the slideshow.
    onBuffering(waiting && enabled && running && !failed);
    if (!enabled || !src || !waiting || failed) return;
    const timeout = window.setTimeout(() => { setFailed(true); setWaiting(false); onBuffering(false); }, 8000);
    return () => window.clearTimeout(timeout);
  }, [enabled, src, running, waiting, failed, onBuffering]);
  const toggle = () => {
    const next = !enabled; setEnabled(next);
    if (next && audio.current && running) {
      audio.current.currentTime = Math.min(time.current / 1000, audio.current.duration || 0);
      void audio.current.play().catch(() => { setFailed(true); onBuffering(false); });
    }
  };
  return <><button className="icon-button narration-toggle" disabled={!src || failed} aria-label={t(failed ? 'ui.audioError' : !src ? 'ui.noAudio' : enabled ? 'ui.mute' : 'ui.unmute')} title={t(failed ? 'ui.audioError' : !src ? 'ui.noAudio' : enabled ? 'ui.mute' : 'ui.unmute')} aria-pressed={enabled} onClick={toggle}>{enabled && src && !failed ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
    {src && <audio ref={audio} src={src} preload="metadata"
      onLoadedMetadata={e => callbacks.current(e.currentTarget.duration * 1000)}
      onWaiting={() => { if (enabled) setWaiting(true); }}
      onPlaying={() => setWaiting(false)}
      onCanPlay={() => setWaiting(false)}
      onEnded={() => setWaiting(false)}
      onError={() => { setFailed(true); onBuffering(false); }} />}
  </>;
}
