import React from 'react';
import { createRoutesFromChildren, matchRoutes, Routes, useLocation, useNavigationType } from 'react-router';
import * as Sentry from '@sentry/react';

import { ONTIME_VERSION } from './ONTIME_VERSION';

// https://docs.sentry.io/platforms/javascript/configuration/filtering/#decluttering-sentry
const sentryRecommendedIgnore = [
  // Random plugins/extensions
  'top.GLOBALS',
  // See: http://blog.errorception.com/2012/03/tale-of-unfindable-js-error.html
  'originalCreateNotification',
  'canvas.contentDocument',
  'MyApp_RemoveAllHighlights',
  'http://tt.epicplay.com',
  "Can't find variable: ZiteReader",
  'jigsaw is not defined',
  'ComboSearch is not defined',
  'http://loading.retry.widdit.com/',
  'atomicFindClose',
  // Facebook borked
  'fb_xd_fragment',
  // ISP "optimizing" proxy - `Cache-Control: no-transform` seems to
  // reduce this. (thanks @acdha)
  // See http://stackoverflow.com/questions/4113268
  'bmi_SafeAddOnload',
  'EBCallBackMessageReceived',
  // See http://toolbar.conduit.com/Developer/HtmlAndGadget/Methods/JSInjection.aspx
  'conduitPage',
];
const sentryDsn = 'https://5e4d2c4b57ab409cb98d4c08b2014755@o4504288369836032.ingest.sentry.io/4504288371343360';

Sentry.init({
  dsn: sentryDsn,
  integrations: [
    Sentry.reactRouterV7BrowserTracingIntegration({
      useEffect: React.useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
  ],
  tracesSampleRate: 0.3,
  release: ONTIME_VERSION,
  enabled: import.meta.env.PROD,
  ignoreErrors: [...sentryRecommendedIgnore, /Unable to preload CSS/i, /dynamically imported module/i],
  denyUrls: [/extensions\//i, /^chrome:\/\//i, /^chrome-extension:\/\//i],
});

export const SentryRoutes = Sentry.withSentryReactRouterV7Routing(Routes);
