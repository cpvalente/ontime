import React from 'react';
import { Routes, createRoutesFromChildren, matchRoutes, useLocation, useNavigationType } from 'react-router';
import * as Sentry from '@sentry/react';

import { ONTIME_VERSION } from './ONTIME_VERSION';

// https://docs.sentry.io/platforms/javascript/configuration/filtering/#decluttering-sentry
export const sentryRecommendedIgnore = [
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
export const sentryDsn = 'https://5e4d2c4b57ab409cb98d4c08b2014755@o4504288369836032.ingest.sentry.io/4504288371343360';

export const initializeSentry = () => {
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
    ignoreErrors: [
      ...sentryRecommendedIgnore,
      // Dynamic imports and chunks
      /Unable to preload CSS/i,
      /dynamically imported module/i,
      /Failed to fetch dynamically imported module/i,
      /Loading chunk \d+ failed/i,
      /Loading CSS chunk \d+ failed/i,
      /ChunkLoadError/i,
      /Loading module .+ failed/i,
      // Data/offline related errors
      /Cannot read propert.* of undefined/i,
      /Cannot read propert.* of null/i,
      /Network request failed/i,
      /Failed to fetch/i,
      /NetworkError/i,
      /The operation couldn't be completed/i,
    ],
    denyUrls: [/extensions\//i, /^chrome:\/\//i, /^chrome-extension:\/\//i, /external\//i],
    beforeSend(event) {
      // Drop errors that happen during known data-unavailable states
      const error = event.exception?.values?.[0]?.value;
      if (
        error &&
        (error.includes('Cannot read property') ||
          error.includes('Cannot read properties') ||
          error.includes('Network request failed') ||
          error.includes('Failed to fetch'))
      ) {
        // Don't send these errors to Sentry since they're expected when data isn't available
        return null;
      }

      return event;
    },
  });

  return Sentry.withSentryReactRouterV6Routing(Routes);
};
