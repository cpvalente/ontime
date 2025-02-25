import React from 'react';
import {
  createRoutesFromChildren,
  matchRoutes,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';
import * as Sentry from '@sentry/react';

import { useClientPath } from './common/hooks/useClientPath';
import Log from './features/log/Log';
import withPreset from './features/PresetWrapper';
import withData from './features/viewers/ViewWrapper';
import ViewLoader from './views/ViewLoader';
import { ONTIME_VERSION } from './ONTIME_VERSION';
import { sentryDsn, sentryRecommendedIgnore } from './sentry.config';

const Editor = React.lazy(() => import('./features/editors/ProtectedEditor'));
const Cuesheet = React.lazy(() => import('./views/cuesheet/ProtectedCuesheet'));
const Operator = React.lazy(() => import('./features/operator/OperatorExport'));

const TimerView = React.lazy(() => import('./views/timer/Timer'));
const MinimalTimerView = React.lazy(() => import('./features/viewers/minimal-timer/MinimalTimer'));
const ClockView = React.lazy(() => import('./features/viewers/clock/Clock'));
const Countdown = React.lazy(() => import('./features/viewers/countdown/Countdown'));

const Backstage = React.lazy(() => import('./views/backstage/Backstage'));
const Timeline = React.lazy(() => import('./views/timeline/TimelinePage'));
const Public = React.lazy(() => import('./views/public/Public'));
const Lower = React.lazy(() => import('./features/viewers/lower-thirds/LowerThird'));
const StudioClock = React.lazy(() => import('./features/viewers/studio/StudioClock'));
const ProjectInfo = React.lazy(() => import('./views/project-info/ProjectInfo'));

const STimer = withPreset(withData(TimerView));
const SMinimalTimer = withPreset(withData(MinimalTimerView));
const SClock = withPreset(withData(ClockView));
const SCountdown = withPreset(withData(Countdown));
const SBackstage = withPreset(withData(Backstage));
const SProjectInfo = withPreset(withData(ProjectInfo));
const SPublic = withPreset(withData(Public));
const SLowerThird = withPreset(withData(Lower));
const SStudio = withPreset(withData(StudioClock));
const STimeline = withPreset(withData(Timeline));
const PCuesheet = withPreset(Cuesheet);
const POperator = withPreset(Operator);

const EditorFeatureWrapper = React.lazy(() => import('./features/EditorFeatureWrapper'));
const RundownPanel = React.lazy(() => import('./features/rundown/RundownExport'));
const TimerControl = React.lazy(() => import('./features/control/playback/TimerControlExport'));
const MessageControl = React.lazy(() => import('./features/control/message/MessageControlExport'));

Sentry.init({
  dsn: sentryDsn,
  integrations: [
    Sentry.reactRouterV6BrowserTracingIntegration({
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

const SentryRoutes = Sentry.withSentryReactRouterV6Routing(Routes);

export default function AppRouter() {
  // handle client path changes
  useClientPath();

  return (
    <React.Suspense fallback={null}>
      <SentryRoutes>
        <Route path='/' element={<Navigate to='/timer' />} />
        <Route
          path='/timer'
          element={
            <ViewLoader>
              <STimer />
            </ViewLoader>
          }
        />
        <Route
          path='/public'
          element={
            <ViewLoader>
              <SPublic />
            </ViewLoader>
          }
        />
        <Route
          path='/minimal'
          element={
            <ViewLoader>
              <SMinimalTimer />
            </ViewLoader>
          }
        />
        <Route
          path='/clock'
          element={
            <ViewLoader>
              <SClock />
            </ViewLoader>
          }
        />
        <Route
          path='/countdown'
          element={
            <ViewLoader>
              <SCountdown />
            </ViewLoader>
          }
        />
        <Route
          path='/backstage'
          element={
            <ViewLoader>
              <SBackstage />
            </ViewLoader>
          }
        />
        <Route
          path='/studio'
          element={
            <ViewLoader>
              <SStudio />
            </ViewLoader>
          }
        />
        {/*/!* Lower third cannot have a loading screen *!/*/}
        <Route path='/lower' element={<SLowerThird />} />
        <Route
          path='/timeline'
          element={
            <ViewLoader>
              <STimeline />
            </ViewLoader>
          }
        />
        <Route
          path='/info'
          element={
            <ViewLoader>
              <SProjectInfo />
            </ViewLoader>
          }
        />

        {/*/!* Protected Routes *!/*/}
        <Route path='/editor' element={<Editor />} />
        <Route path='/cuesheet' element={<PCuesheet />} />
        <Route path='/op' element={<POperator />} />

        {/*/!* Protected Routes - Elements *!/*/}
        <Route
          path='/rundown'
          element={
            <EditorFeatureWrapper>
              <RundownPanel />
            </EditorFeatureWrapper>
          }
        />
        <Route
          path='/timercontrol'
          element={
            <EditorFeatureWrapper>
              <TimerControl />
            </EditorFeatureWrapper>
          }
        />
        <Route
          path='/messagecontrol'
          element={
            <EditorFeatureWrapper>
              <MessageControl />
            </EditorFeatureWrapper>
          }
        />
        <Route
          path='/log'
          element={
            <EditorFeatureWrapper>
              <Log />
            </EditorFeatureWrapper>
          }
        />
        {/*/!* Send to default if nothing found *!/*/}
        <Route path='*' element={<STimer />} />
      </SentryRoutes>
    </React.Suspense>
  );
}
