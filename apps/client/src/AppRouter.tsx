import React, { Suspense } from 'react';
import { Navigate, Outlet, redirect as routerRedirect } from 'react-router-dom';
import * as Sentry from '@sentry/react';

import { useClientPath } from './common/hooks/useClientPath';
import Log from './features/log/Log';
import withPreset from './features/PresetWrapper'; // Re-adding for HOC-wrapped components
import withData from './features/viewers/ViewWrapper'; // Will be removed/refactored for data loading
// import ViewLoader from './views/ViewLoader'; // This might be replaceable with Suspense or loader data
import { ONTIME_VERSION } from './ONTIME_VERSION';
import { sentryDsn, sentryRecommendedIgnore } from './sentry.config';
import { ontimeQueryClient } from './common/queryClient';
import { URL_PRESETS } from './common/api/constants';
import { getUrlPresets } from './common/api/urlPresets';
import { getRouteFromPreset } from './common/utils/urlPresets';


// Lazy loaded components
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


const EditorFeatureWrapper = React.lazy(() => import('./features/EditorFeatureWrapper'));
const RundownPanel = React.lazy(() => import('./features/rundown/RundownExport'));
const TimerControl = React.lazy(() => import('./features/control/playback/TimerControlExport'));
const MessageControl = React.lazy(() => import('./features/control/message/MessageControlExport'));

// Sentry.init has been moved to App.tsx

const RootLayout = () => {
  useClientPath();
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Outlet />
    </Suspense>
  );
};

// Loader function for routes that used `withPreset`
const presetLoader = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const location = { pathname: url.pathname, search: url.search };

  // Fetch presets using queryClient - ensure queryClient is available here
  // It might be better to pass queryClient if this file doesn't have direct access in tests
  const presets = await ontimeQueryClient.fetchQuery({
    queryKey: URL_PRESETS,
    queryFn: getUrlPresets,
  });

  if (presets) {
    const destination = getRouteFromPreset(location, presets);
    if (destination) {
      return routerRedirect(destination);
    }
  }
  return null; // Or any data that needs to be passed from preset logic
};


// Component definitions (TimerView, MinimalTimerView etc. are lazy loaded at the top of the file)

// All HOCs are now removed from these direct const definitions.
// Loaders handle `withPreset` logic.
// Components themselves will handle `withData` logic (fetching own data) in SUBSEQUENT PRs.
// For this PR, components remain wrapped by their HOCs.

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


export const routes = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to='/timer' replace /> },
      {
        path: '/timer',
        loader: presetLoader,
        lazy: async () => ({ Component: STimer }),
      },
      {
        path: '/minimal',
        loader: presetLoader,
        lazy: async () => ({ Component: SMinimalTimer }),
      },
      {
        path: '/clock',
        loader: presetLoader,
        lazy: async () => ({ Component: SClock }),
      },
      {
        path: '/countdown',
        loader: presetLoader,
        lazy: async () => ({ Component: SCountdown }),
      },
      {
        path: '/backstage',
        loader: presetLoader,
        lazy: async () => ({ Component: SBackstage }),
      },
      {
        path: '/studio',
        loader: presetLoader,
        lazy: async () => ({ Component: SStudio }),
      },
      {
        path: '/lower',
        loader: presetLoader,
        lazy: async () => ({ Component: SLowerThird }),
      },
      {
        path: '/timeline',
        loader: presetLoader,
        lazy: async () => ({ Component: STimeline }),
      },
      {
        path: '/info',
        loader: presetLoader,
        lazy: async () => ({ Component: SProjectInfo }),
      },
      // Protected Routes
      {
        path: '/editor', // Editor was not wrapped in these HOCs
        lazy: async () => ({ Component: Editor }),
      },
      {
        path: '/cuesheet',
        loader: presetLoader,
        lazy: async () => ({ Component: PCuesheet }),
      },
      {
        path: '/op',
        loader: presetLoader,
        lazy: async () => ({ Component: POperator }),
      },
      {
        element: <Suspense fallback={<div>Loading Editor Features...</div>}><EditorFeatureWrapper /></Suspense>,
        children: [ // These components were not wrapped with withPreset/withData
          {
            path: '/rundown',
            lazy: async () => ({ Component: RundownPanel }),
          },
          {
            path: '/timercontrol',
            lazy: async () => ({ Component: TimerControl }),
          },
          {
            path: '/messagecontrol',
            lazy: async () => ({ Component: MessageControl }),
          },
          {
            path: '/log',
            lazy: async () => ({ Component: Log }),
          },
        ],
      },
      {
        path: '*',
        loader: presetLoader,
        lazy: async () => ({ Component: STimer }), // Fallback to STimer
      },
    ],
  },
];
