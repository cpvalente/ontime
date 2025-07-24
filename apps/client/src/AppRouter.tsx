import { ComponentType, lazy, Suspense, useMemo } from 'react';
import { Navigate, Route, useLocation } from 'react-router';
import { OntimeView, OntimeViewPresettable } from 'ontime-types';

import ViewNavigationMenu from './common/components/navigation-menu/ViewNavigationMenu';
import { useClientPath } from './common/hooks/useClientPath';
import useUrlPresets from './common/hooks-query/useUrlPresets';
import Log from './features/log/Log';
import Loader from './views/common/loader/Loader';
import NotFound from './views/common/not-found/NotFound';
import ViewLoader from './views/ViewLoader';
import { initializeSentry } from './sentry.config';

const Timer = lazy(() => import('./views/timer/Timer'));
const Countdown = lazy(() => import('./views/countdown/Countdown'));
const Backstage = lazy(() => import('./views/backstage/Backstage'));
const StudioClock = lazy(() => import('./views/studio/Studio'));
const Timeline = lazy(() => import('./views/timeline/TimelinePage'));
const ProjectInfo = lazy(() => import('./views/project-info/ProjectInfo'));

const Editor = lazy(() => import('./views/editor/ProtectedEditor'));
const Cuesheet = lazy(() => import('./views/cuesheet/ProtectedCuesheet'));
const Operator = lazy(() => import('./features/operator/OperatorExport'));

const EditorFeatureWrapper = lazy(() => import('./features/EditorFeatureWrapper'));
const RundownPanel = lazy(() => import('./features/rundown/RundownExport'));
const TimerControl = lazy(() => import('./features/control/playback/TimerControlExport'));
const MessageControl = lazy(() => import('./features/control/message/MessageControlExport'));

// Initialize Sentry with our configuration
const SentryRouter = initializeSentry();

export default function AppRouter() {
  // handle client path changes
  useClientPath();

  return (
    <Suspense fallback={<Loader />}>
      <SentryRouter>
        <Route path='/' element={<Navigate to='/timer' />} />
        <Route
          path='timer'
          element={
            <ViewLoader>
              <ViewNavigationMenu isLockable />
              <Timer />
            </ViewLoader>
          }
        />
        <Route
          path='countdown'
          element={
            <ViewLoader>
              <ViewNavigationMenu isLockable />
              <Countdown />
            </ViewLoader>
          }
        />
        <Route
          path='backstage'
          element={
            <ViewLoader>
              <ViewNavigationMenu isLockable />
              <Backstage />
            </ViewLoader>
          }
        />
        <Route
          path='studio'
          element={
            <ViewLoader>
              <ViewNavigationMenu isLockable />
              <StudioClock />
            </ViewLoader>
          }
        />
        <Route
          path='timeline'
          element={
            <ViewLoader>
              <Timeline />
            </ViewLoader>
          }
        />
        <Route
          path='info'
          element={
            <ViewLoader>
              <ProjectInfo />
            </ViewLoader>
          }
        />

        {/*/!* Protected Routes *!/*/}
        <Route path='editor' element={<Editor />} />
        <Route path='cuesheet' element={<Cuesheet />} />
        <Route
          path='op'
          element={
            <ViewLoader>
              <Operator />
            </ViewLoader>
          }
        />

        {/*/!* Protected Routes - Elements *!/*/}
        <Route
          path='rundown'
          element={
            <EditorFeatureWrapper>
              <RundownPanel />
            </EditorFeatureWrapper>
          }
        />
        <Route
          path='timercontrol'
          element={
            <EditorFeatureWrapper>
              <TimerControl />
            </EditorFeatureWrapper>
          }
        />
        <Route
          path='messagecontrol'
          element={
            <EditorFeatureWrapper>
              <MessageControl />
            </EditorFeatureWrapper>
          }
        />
        <Route
          path='log'
          element={
            <EditorFeatureWrapper>
              <Log />
            </EditorFeatureWrapper>
          }
        />
      </SentryRouter>
    </Suspense>
  );
}
