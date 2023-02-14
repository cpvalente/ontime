import { lazy, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import useAliases from './common/hooks-query/useAliases';
import withSocket from './features/viewers/ViewWrapper';

const Editor = lazy(() => import('./features/editors/ProtectedEditor'));
const Table = lazy(() => import('./features/table/ProtectedTable'));

const TimerView = lazy(() => import('./features/viewers/timer/Timer'));
const MinimalTimerView = lazy(() => import('./features/viewers/minimal-timer/MinimalTimer'));
const ClockView = lazy(() => import('./features/viewers/clock/Clock'));
const Countdown = lazy(() => import('./features/viewers/countdown/Countdown'));

const Backstage = lazy(() => import('./features/viewers/backstage/Backstage'));
const Public = lazy(() => import('./features/viewers/public/Public'));
const Lower = lazy(() => import('./features/viewers/lower-thirds/LowerWrapper'));
const StudioClock = lazy(() => import('./features/viewers/studio/StudioClock'));

const STimer = withSocket(TimerView);
const SMinimalTimer = withSocket(MinimalTimerView);
const SClock = withSocket(ClockView);
const SCountdown = withSocket(Countdown);
const SBackstage = withSocket(Backstage);
const SPublic = withSocket(Public);
const SLowerThird = withSocket(Lower);
const SStudio = withSocket(StudioClock);

const FeatureWrapper = lazy(() => import('./features/FeatureWrapper'));
const RundownPanel = lazy(() => import('./features/rundown/RundownExport'));
const TimerControl = lazy(() => import('./features/control/playback/TimerControlExport'));
const MessageControl = lazy(() => import('./features/control/message/MessageControlExport'));
const Info = lazy(() => import('./features/info/InfoExport'));

export default function AppRouter() {
  const { data } = useAliases();
  const location = useLocation();
  const navigate = useNavigate();

  // navigate if is alias route
  useEffect(() => {
    if (!data) return;
    for (const d of data) {
      if (`/${d.alias}` === location.pathname && d.enabled) {
        navigate(`/${d.pathAndParams}`);
        break;
      }
    }
  }, [data, location, navigate]);

  return(
    <Routes>
      <Route path='/' element={<Navigate to="/timer" /> } />
      <Route path='/speaker' element={<STimer />} />
      <Route path='/presenter' element={<STimer />} />
      <Route path='/stage' element={<STimer />} />
      <Route path='/timer' element={<STimer />} />

      <Route path='/minimal' element={<SMinimalTimer />} />
      <Route path='/minimalTimer' element={<SMinimalTimer />} />
      <Route path='/simpleTimer' element={<SMinimalTimer />} />

      <Route path='/clock' element={<SClock />} />

      <Route path='/countdown' element={<SCountdown />} />

      <Route path='/sm' element={<SBackstage />} />
      <Route path='/backstage' element={<SBackstage />} />

      <Route path='/public' element={<SPublic />} />
      <Route path='/studio' element={<SStudio />} />
      {/*/!* Lower cannot have fallback *!/*/}
      <Route path='/lower' element={<SLowerThird />} />

      {/*/!* Protected Routes *!/*/}
      <Route path='/editor' element={<Editor />} />
      <Route path='/cuesheet' element={<Table />} />
      <Route path='/cuelist' element={<Table />} />
      <Route path='/table' element={<Table />} />

      {/*/!* Protected Routes - Elements *!/*/}
      <Route
        path='/rundown'
        element={
          <FeatureWrapper>
            <RundownPanel />
          </FeatureWrapper>
        }
      />
      <Route
        path='/timercontrol'
        element={
          <FeatureWrapper>
            <TimerControl />
          </FeatureWrapper>
        }
      />
      <Route
        path='/messagecontrol'
        element={
          <FeatureWrapper>
            <MessageControl />
          </FeatureWrapper>
        }
      />
      <Route
        path='/info'
        element={
          <FeatureWrapper>
            <Info />
          </FeatureWrapper>
        }
      />
      {/* Send to default if nothing found */}
      <Route path='*' element={<Navigate to="/timer" /> } />
    </Routes>
  )
}
