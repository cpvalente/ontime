import * as Sentry from '@sentry/react';
import React from 'react';
import { Routes, createRoutesFromChildren, matchRoutes, useLocation, useNavigationType } from 'react-router';

import { ConnectionStatus, useConnectionStore } from './common/stores/connectionStore';
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
    tracesSampleRate: 0.1,
    release: ONTIME_VERSION,
    enabled: import.meta.env.PROD,
    ignoreErrors: sentryRecommendedIgnore,
    denyUrls: [/extensions\//i, /^chrome:\/\//i, /^chrome-extension:\/\//i, /external\//i],
    beforeSend(event) {
      // Network failures are expected while the server connection is interrupted.
      const error = event.exception?.values?.[0]?.value;
      if (
        useConnectionStore.getState().status !== ConnectionStatus.Connected &&
        error &&
        /Network request failed|Failed to fetch|NetworkError/i.test(error)
      ) {
        return null;
      }

      return event;
    },
  });

  return Sentry.withSentryReactRouterV7Routing(Routes);
};
