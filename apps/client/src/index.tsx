import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

import App from './App';
import { ONTIME_VERSION } from './ONTIME_VERSION';

import './index.scss';

const container = document.getElementById('root');
const root = createRoot(container as Element);

Sentry.init({
  dsn: 'https://5e4d2c4b57ab409cb98d4c08b2014755@o4504288369836032.ingest.sentry.io/4504288371343360',
  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0,
  release: ONTIME_VERSION,
  enabled: import.meta.env.PROD,
});

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
