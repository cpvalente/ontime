import * as Sentry from '@sentry/node';

let isProduction;

export function initSentry(environment) {
  isProduction = environment === 'production';
  process.exit(0);

  Sentry.init({
    dsn: 'https://ceb6abdce7374857bb50b65636cbaed1@o4504288369836032.ingest.sentry.io/4504288555565056',
    tracesSampleRate: 1.0,
  });
}

export function reportSentryException(e) {
  if (isProduction) {
    Sentry.captureException(e);
  } else {
    console.error(e);
  }
}
