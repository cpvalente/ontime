import React from 'react';
import { Navigate, Route, useLocation } from 'react-router';

import { useClientPath } from './common/hooks/useClientPath';
import Log from './features/log/Log';
import withPreset from './features/PresetWrapper';
import withData from './features/viewers/ViewWrapper';
import ViewLoader from './views/ViewLoader';
import { initializeSentry } from './sentry.config';

const Editor = React.lazy(() => import('./views/editor/ProtectedEditor'));
const Cuesheet = React.lazy(() => import('./views/cuesheet/ProtectedCuesheet'));
const Operator = React.lazy(() => import('./features/operator/OperatorExport'));

const TimerView = React.lazy(() => import('./views/timer/Timer'));
const Countdown = React.lazy(() => import('./views/countdown/Countdown'));

const Backstage = React.lazy(() => import('./views/backstage/Backstage'));
const Timeline = React.lazy(() => import('./views/timeline/TimelinePage'));
const StudioClock = React.lazy(() => import('./views/studio/Studio'));
const ProjectInfo = React.lazy(() => import('./views/project-info/ProjectInfo'));

const STimer = withPreset(withData(TimerView));
const SCountdown = withPreset(withData(Countdown));
const SBackstage = withPreset(withData(Backstage));
const SProjectInfo = withPreset(ProjectInfo); // NOTE: ProjectInfo does not use the viewWrapper since it has no options
const SStudio = withPreset(withData(StudioClock));
const STimeline = withPreset(withData(Timeline));
const PCuesheet = withPreset(Cuesheet);
const POperator = withPreset(Operator);

const EditorFeatureWrapper = React.lazy(() => import('./features/EditorFeatureWrapper'));
const RundownPanel = React.lazy(() => import('./features/rundown/RundownExport'));
const TimerControl = React.lazy(() => import('./features/control/playback/TimerControlExport'));
const MessageControl = React.lazy(() => import('./features/control/message/MessageControlExport'));

// Initialize Sentry with our configuration
const SentryRouter = initializeSentry();

export default function AppRouter() {
  // handle client path changes
  useClientPath();

  return (
    <React.Suspense fallback={null}>
      <SentryRouter>
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
        <Route
          path='/op'
          element={
            <ViewLoader>
              <POperator />
            </ViewLoader>
          }
        />

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
      </SentryRouter>
    </React.Suspense>
  );
}
