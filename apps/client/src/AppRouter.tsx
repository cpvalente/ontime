import { ComponentType, lazy, Suspense, useEffect, useMemo } from 'react';
import { Navigate, Route, useLocation, useNavigate, useParams } from 'react-router';
import { OntimeView, OntimeViewPresettable, URLPreset } from 'ontime-types';

import ViewNavigationMenu from './common/components/navigation-menu/ViewNavigationMenu';
import { PresetContext } from './common/context/PresetContext';
import { useClientPath } from './common/hooks/useClientPath';
import useUrlPresets from './common/hooks-query/useUrlPresets';
import { getRouteFromPreset } from './common/utils/urlPresets';
import Log from './features/log/Log';
import Loader from './views/common/loader/Loader';
import NotFound from './views/common/not-found/NotFound';
import ViewLoader from './views/ViewLoader';
import { getIsViewLocked, sessionScope } from './externals';
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
              <ViewNavigationMenu isViewLocked={getIsViewLocked()} />
              <Timer />
            </ViewLoader>
          }
        />
        <Route
          path='countdown'
          element={
            <ViewLoader>
              <ViewNavigationMenu isViewLocked={getIsViewLocked()} />
              <Countdown />
            </ViewLoader>
          }
        />
        <Route
          path='backstage'
          element={
            <ViewLoader>
              <ViewNavigationMenu isViewLocked={getIsViewLocked()} />
              <Backstage />
            </ViewLoader>
          }
        />
        <Route
          path='studio'
          element={
            <ViewLoader>
              <ViewNavigationMenu isViewLocked={getIsViewLocked()} />
              <StudioClock />
            </ViewLoader>
          }
        />
        <Route
          path='timeline'
          element={
            <ViewLoader>
              <ViewNavigationMenu isViewLocked={getIsViewLocked()} />
              <Timeline />
            </ViewLoader>
          }
        />
        <Route
          path='info'
          element={
            <ViewLoader>
              <ViewNavigationMenu suppressSettings isViewLocked={getIsViewLocked()} />
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
        {/**
         * If the views are prefixed with the "preset" path, we are in a locked preset
         * Locked presets do not expose their parameters
         */}
        <Route path='preset/:alias' element={<PresetView />} />

        {/**
         * If we havent matched any views or presets, we may be in an unlocked preset
         * Unlocked presets are unwrapped to expose their target and parameters
         */}
        <Route path='*' element={<RedirectPreset />} />
      </SentryRouter>
    </Suspense>
  );
}

const PresetViewMap: Record<OntimeViewPresettable, ComponentType> = {
  [OntimeView.Cuesheet]: Cuesheet,
  [OntimeView.Operator]: Operator,
  [OntimeView.Timer]: Timer,
  [OntimeView.Backstage]: Backstage,
  [OntimeView.Timeline]: Timeline,
  [OntimeView.StudioClock]: StudioClock,
  [OntimeView.Countdown]: Countdown,
  [OntimeView.ProjectInfo]: ProjectInfo,
};

/**
 * This view will mask a configured canonical route
 * and inject the preset search parameters to context
 * User are not able to configure the parameters locked presets
 */
function PresetView() {
  const { data, status } = useUrlPresets();
  const { alias } = useParams();

  const preset: URLPreset | undefined = useMemo(() => {
    if (status === 'pending' || !alias) return;
    return data.find((p) => p.alias === alias && p.enabled);
  }, [data, status, alias]);

  if (status === 'pending') {
    return <Loader />;
  }

  /**
   * We need to check the session scope to determine if the user can navigate
   * If the user has a global scope, they can navigate freely
   * Otherwise, they are locked to the preset view
   */
  const showNav = sessionScope === 'rw';

  /**
   * If we are in a preset path but cannot find a preset, we will need to show a not found page
   * This can happen if the preset was deleted or disabled
   */
  if (!preset) {
    return (
      <>
        <ViewNavigationMenu isViewLocked={!showNav} suppressSettings />
        <NotFound />
      </>
    );
  }

  /**
   * Locked presets do not allow configuration changes
   * Whether the user can navigate is determined by the locked param
   */
  const Component = PresetViewMap[preset.target as OntimeViewPresettable];
  return (
    <PresetContext value={preset}>
      {preset.target !== OntimeView.Cuesheet && (
        <ViewNavigationMenu isViewLocked={getIsViewLocked()} suppressSettings />
      )}
      {Component ? <Component /> : <NotFound />}
    </PresetContext>
  );
}

function RedirectPreset() {
  const { data, status } = useUrlPresets();
  const navigate = useNavigate();
  const location = useLocation();

  // checks if we are in a preset path and resolves a destination URL
  const destination = useMemo(() => {
    if (status === 'pending') return null;
    return getRouteFromPreset(location, data);
  }, [data, location, status]);

  // if we have a destination, we will navigate to it
  useEffect(() => {
    if (destination) {
      navigate(`/${destination}`, { replace: true });
    }
  }, [destination, navigate]);

  if (status === 'pending') {
    return <Loader />;
  }

  return (
    <>
      <ViewNavigationMenu isViewLocked={getIsViewLocked()} suppressSettings />
      <NotFound />
    </>
  );
}
