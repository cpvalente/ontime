import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { useClientPath } from './common/hooks/useClientPath';
import Log from './features/log/Log';
import withPreset from './features/PresetWrapper';
import withData from './features/viewers/ViewWrapper';

const Editor = lazy(() => import('./features/editors/ProtectedEditor'));
const Cuesheet = lazy(() => import('./features/cuesheet/ProtectedCuesheet'));
const Operator = lazy(() => import('./features/operator/OperatorExport'));

const TimerView = lazy(() => import('./features/viewers/timer/Timer'));
const MinimalTimerView = lazy(() => import('./features/viewers/minimal-timer/MinimalTimer'));
const ClockView = lazy(() => import('./features/viewers/clock/Clock'));
const Countdown = lazy(() => import('./features/viewers/countdown/Countdown'));

const Backstage = lazy(() => import('./features/viewers/backstage/Backstage'));
const Public = lazy(() => import('./features/viewers/public/Public'));
const Timeline = lazy(() => import('./features/timeline/TimelinePage'));
const Lower = lazy(() => import('./features/viewers/lower-thirds/LowerThird'));
const StudioClock = lazy(() => import('./features/viewers/studio/StudioClock'));

const STimer = withPreset(withData(TimerView));
const SMinimalTimer = withPreset(withData(MinimalTimerView));
const SClock = withPreset(withData(ClockView));
const SCountdown = withPreset(withData(Countdown));
const SBackstage = withPreset(withData(Backstage));
const SPublic = withPreset(withData(Public));
const STimeline = withPreset(withData(Timeline));
const SLowerThird = withPreset(withData(Lower));
const SStudio = withPreset(withData(StudioClock));

const EditorFeatureWrapper = lazy(() => import('./features/EditorFeatureWrapper'));
const RundownPanel = lazy(() => import('./features/rundown/RundownExport'));
const TimerControl = lazy(() => import('./features/control/playback/TimerControlExport'));
const MessageControl = lazy(() => import('./features/control/message/MessageControlExport'));

export default function AppRouter() {
  // handle client path changes
  useClientPath();

  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path='/' element={<Navigate to='/timer' />} />
        <Route path='/timer' element={<STimer />} />

        <Route path='/minimal' element={<SMinimalTimer />} />

        <Route path='/clock' element={<SClock />} />

        <Route path='/countdown' element={<SCountdown />} />

        <Route path='/backstage' element={<SBackstage />} />

        <Route path='/public' element={<SPublic />} />

        <Route path='/studio' element={<SStudio />} />

        <Route path='/lower' element={<SLowerThird />} />

        <Route path='/op' element={<Operator />} />

        <Route path='/timeline' element={<STimeline />} />

        {/*/!* Protected Routes *!/*/}
        <Route path='/editor' element={<Editor />} />
        <Route path='/cuesheet' element={<Cuesheet />} />

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
      </Routes>
    </Suspense>
  );
}
