import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import withAlias from './features/AliasWrapper';
import withData from './features/viewers/ViewWrapper';

const Editor = lazy(() => import('./features/editors/ProtectedEditor'));
const Cuesheet = lazy(() => import('./features/cuesheet/ProtectedCuesheet'));
const Operator = lazy(() => import('./features/operator/Operator'));

const TimerView = lazy(() => import('./features/viewers/timer/Timer'));
const MinimalTimerView = lazy(() => import('./features/viewers/minimal-timer/MinimalTimer'));
const ClockView = lazy(() => import('./features/viewers/clock/Clock'));
const Countdown = lazy(() => import('./features/viewers/countdown/Countdown'));

const Backstage = lazy(() => import('./features/viewers/backstage/Backstage'));
const Public = lazy(() => import('./features/viewers/public/Public'));
const Lower = lazy(() => import('./features/viewers/lower-thirds/LowerWrapper'));
const StudioClock = lazy(() => import('./features/viewers/studio/StudioClock'));

const STimer = withAlias(withData(TimerView));
const SMinimalTimer = withAlias(withData(MinimalTimerView));
const SClock = withAlias(withData(ClockView));
const SCountdown = withAlias(withData(Countdown));
const SBackstage = withAlias(withData(Backstage));
const SPublic = withAlias(withData(Public));
const SLowerThird = withAlias(withData(Lower));
const SStudio = withAlias(withData(StudioClock));

const EditorFeatureWrapper = lazy(() => import('./features/EditorFeatureWrapper'));
const RundownPanel = lazy(() => import('./features/rundown/RundownExport'));
const TimerControl = lazy(() => import('./features/control/playback/TimerControlExport'));
const MessageControl = lazy(() => import('./features/control/message/MessageControlExport'));
const Info = lazy(() => import('./features/info/InfoExport'));

export default function AppRouter() {
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
        {/*/!* Lower cannot have fallback *!/*/}
        <Route path='/lower' element={<SLowerThird />} />

        <Route path='/op' element={<Operator />} />
        <Route path='/operator' element={<Operator />} />

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
          path='/info'
          element={
            <EditorFeatureWrapper>
              <Info />
            </EditorFeatureWrapper>
          }
        />
        {/*/!* Send to default if nothing found *!/*/}
        <Route path='*' element={<STimer />} />
      </Routes>
    </Suspense>
  );
}
