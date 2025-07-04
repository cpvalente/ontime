import React from 'react';
import { Navigate, Route } from 'react-router';

import { useClientPath } from './common/hooks/useClientPath';
import Log from './features/log/Log';
import withPreset from './features/PresetWrapper';
import withData from './features/viewers/ViewWrapper';
import ViewLoader from './views/ViewLoader';
import { SentryRoutes } from './sentry.router';

const Editor = React.lazy(() => import('./views/editor/ProtectedEditor'));
const Cuesheet = React.lazy(() => import('./views/cuesheet/ProtectedCuesheet'));
const Operator = React.lazy(() => import('./features/operator/OperatorExport'));

const TimerView = React.lazy(() => import('./views/timer/Timer'));
const MinimalTimerView = React.lazy(() => import('./features/viewers/minimal-timer/MinimalTimer'));
const ClockView = React.lazy(() => import('./features/viewers/clock/Clock'));
const Countdown = React.lazy(() => import('./views/countdown/Countdown'));

const Backstage = React.lazy(() => import('./views/backstage/Backstage'));
const Timeline = React.lazy(() => import('./views/timeline/TimelinePage'));
const Lower = React.lazy(() => import('./features/viewers/lower-thirds/LowerThird'));
const StudioClock = React.lazy(() => import('./views/studio/Studio'));
const ProjectInfo = React.lazy(() => import('./views/project-info/ProjectInfo'));

const STimer = withPreset(withData(TimerView));
const SMinimalTimer = withPreset(withData(MinimalTimerView));
const SClock = withPreset(withData(ClockView));
const SCountdown = withPreset(withData(Countdown));
const SBackstage = withPreset(withData(Backstage));
const SProjectInfo = withPreset(withData(ProjectInfo));
const SLowerThird = withPreset(withData(Lower));
const SStudio = withPreset(withData(StudioClock));
const STimeline = withPreset(withData(Timeline));
const PCuesheet = withPreset(Cuesheet);
const POperator = withPreset(Operator);

const EditorFeatureWrapper = React.lazy(() => import('./features/EditorFeatureWrapper'));
const RundownPanel = React.lazy(() => import('./features/rundown/RundownExport'));
const TimerControl = React.lazy(() => import('./features/control/playback/TimerControlExport'));
const MessageControl = React.lazy(() => import('./features/control/message/MessageControlExport'));

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
      </SentryRoutes>
    </React.Suspense>
  );
}
