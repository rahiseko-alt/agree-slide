import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import App from './App';
import i18n, { applyLocales } from './lib/i18n';
import { GuideProvider, defaultBundle } from './state';
import { readDraft } from './lib/storage';
import './styles.css';
async function start() {
  let draft = null; let storageWarning = false;
  try { draft = await readDraft(); } catch { storageWarning = true; }
  await applyLocales(draft ?? defaultBundle);
  ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><I18nextProvider i18n={i18n}><GuideProvider initial={draft}><App storageWarning={storageWarning} /></GuideProvider></I18nextProvider></React.StrictMode>);
}
void start();
