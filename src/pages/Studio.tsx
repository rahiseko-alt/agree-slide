import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, Braces, Download, ArrowRight, RotateCcw, HardDrive, Layers3 } from 'lucide-react';
import { useGuide } from '../state';
import { importJson, importMedia, downloadBundle } from '../lib/import';
export function Studio() {
  const { bundle, isDraft, replace } = useGuide(); const { t } = useTranslation(); const navigate = useNavigate();
  const media = useRef<HTMLInputElement>(null); const json = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false); const [progress, setProgress] = useState({ done: 0, total: 0 }); const [error, setError] = useState('');
  const instruction = 'docs/AUTHORING.md の制作手順で、渡した原稿・資料からスライド動画を作ってください。決まったレイアウトとストックイラストを使い、落ち着いたビジネス向け音声を付けてください。自作SVGは禁止です。';
  const [copied, setCopied] = useState(false);
  const load = async (files: File[], kind: 'media' | 'json') => {
    if (!files.length || busy) return; setBusy(true); setError(''); setProgress({ done: 0, total: files.length });
    try { const value = kind === 'json' ? await importJson(files[0]) : await importMedia(files, (done, total) => setProgress({ done, total })); await replace(value); navigate(`/guide/${value.guide.slides[0].id}`); }
    catch (e) { setError(e instanceof Error ? e.message.slice(0, 600) : String(e)); }
    finally { setBusy(false); if (media.current) media.current.value = ''; if (json.current) json.current.value = ''; }
  };
  const reset = async () => { if (!window.confirm(t('ui.resetConfirm'))) return; setError(''); setBusy(true); try { await replace(null); } catch (e) { setError(String(e)); } finally { setBusy(false); } };
  return <main id="main" className="studio-page"><div className="eyebrow">CONTENT STUDIO</div><h1>{t('ui.studioTitle')}</h1><p className="page-description">{t('ui.studioBody')}</p>
    <section className="agent-entry"><div className="eyebrow">CLAUDE CODE · ANTIGRAVITY · CODEX</div><h2>{t('ui.agentTitle')}</h2><p>{t('ui.agentBody')}</p><textarea readOnly value={instruction} aria-label={t('ui.agentInstruction')} rows={3} onFocus={e => e.target.select()} /><button className="button secondary" onClick={() => { void navigator.clipboard.writeText(instruction).then(() => setCopied(true)).catch(() => setCopied(false)); }}>{t(copied ? 'ui.copied' : 'ui.copyInstruction')}</button></section>
    <div className="studio-import-grid"><section className="import-card"><div className="import-symbol"><Upload size={28} /></div><h2>{t('ui.importTitle')}</h2><p>{t('ui.importBody')}</p><button disabled={busy} className="button primary" onClick={() => media.current?.click()}>{t('ui.importButton')}<ArrowRight size={18} /></button><input ref={media} type="file" accept="application/pdf,image/png,image/jpeg,image/webp,.pdf,.png,.jpg,.jpeg,.webp" multiple className="sr-only" tabIndex={-1} aria-label={t('ui.importButton')} onChange={e => void load(Array.from(e.target.files ?? []), 'media')} /></section>
      <section className="import-card"><div className="import-symbol pale"><Braces size={28} /></div><h2>{t('ui.jsonTitle')}</h2><p>{t('ui.jsonBody')}</p><button disabled={busy} className="button secondary" onClick={() => json.current?.click()}>{t('ui.jsonButton')}<ArrowRight size={18} /></button><input ref={json} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-label={t('ui.jsonButton')} onChange={e => void load(Array.from(e.target.files ?? []), 'json')} /></section></div>
    {busy && <p className="notice" role="status">{t('ui.busy', progress)}</p>}{error && <div className="notice error" role="alert"><strong>{t('ui.importError')}</strong><pre>{error}</pre></div>}
    <div className="studio-note"><HardDrive size={22} /><div><h3>{t('ui.localDraft')}</h3><p>{t('ui.localDraftBody')}</p></div></div><p className="source-note">{t('ui.sourceNote')}</p>
    <section className="current-guide"><div className="current-info"><Layers3 size={27} /><div><div className="eyebrow">{t('ui.current')}</div><h2>{t(bundle.guide.titleKey)}</h2><p>{t('ui.slidesCount', { count: bundle.guide.slides.length })} · {t('ui.languagesCount', { count: Object.keys(bundle.locales).length })}</p></div><Link className="text-link" to={`/guide/${bundle.guide.slides[0].id}`}>{t('ui.guide')}<ArrowRight size={18} /></Link></div><div className="current-actions"><button disabled={busy} className="button secondary" onClick={() => downloadBundle(bundle)}><Download size={18} />{t('ui.export')}</button><button disabled={!isDraft || busy} className="text-button" onClick={() => void reset()}><RotateCcw size={16} />{t('ui.reset')}</button></div></section>
  </main>;
}
