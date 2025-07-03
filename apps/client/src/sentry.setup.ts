import React from 'react'; // useEffect is part of React
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { Router } from '@remix-run/router'; // For typing the router instance

import { ONTIME_VERSION } from './ONTIME_VERSION';
import { sentryDsn, sentryRecommendedIgnore } from './sentry.config';

export const initializeSentry = (router: Router) => {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      Sentry.reactRouterV7BrowserTracingIntegration({
        router: router,
        useEffect: React.useEffect,
        useLocation: useLocation,
        useNavigationType: useNavigationType,
        createRoutesFromChildren: createRoutesFromChildren,
        matchRoutes: matchRoutes,
      }),
    ],
    tracesSampleRate: 0.3,
    release: ONTIME_VERSION,
    enabled: import.meta.env.PROD,
    ignoreErrors: [...sentryRecommendedIgnore, /Unable to preload CSS/i, /dynamically imported module/i],
    denyUrls: [/extensions\//i, /^chrome:\/\//i, /^chrome-extension:\/\//i],
  });
};
