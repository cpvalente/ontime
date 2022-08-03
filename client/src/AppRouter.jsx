import React, { lazy, useEffect } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { ALIASES } from './common/api/apiConstants';
import { getAliases } from './common/api/ontimeApi';
import { useFetch } from './common/hooks/useFetch';
import withSocket from './features/viewers/ViewWrapper';

const Editor = lazy(() => import('features/editors/ProtectedEditor'));
const Table = lazy(() => import('features/table/ProtectedTable'));

const TimerView = lazy(() => import('features/viewers/timer/Timer'));
const MinimalTimerView = lazy(() => import('features/viewers/timer/MinimalTimer'));
const Countdown = lazy(() => import('features/viewers/countdown/Countdown'));

const StageManager = lazy(() => import('features/viewers/backstage/StageManager'));
const Public = lazy(() => import('features/viewers/foh/Public'));
const Lower = lazy(() => import('features/viewers/production/lower/LowerWrapper'));
const Pip = lazy(() => import('features/viewers/production/Pip'));
const StudioClock = lazy(() => import('features/viewers/studio/StudioClock'));

const STimer = withSocket(TimerView);
const SMinimalTimer = withSocket(MinimalTimerView);
const SCountdown = withSocket(Countdown);
const SStageManager = withSocket(StageManager);
const SPublic = withSocket(Public);
const SLowerThird = withSocket(Lower);
const SPip = withSocket(Pip);
const SStudio = withSocket(StudioClock);

const FeatureWrapper = lazy(() => import('features/FeatureWrapper'));
const EventList = lazy(() => import('features/editors/list/EventListExport'));
const TimerControl = lazy(() => import('features/control/playback/TimerControlExport'));
const MessageControl = lazy(() => import('features/control/message/MessageControlExport'));
const Info = lazy(() => import('features/info/InfoExport'));

export default function AppRouter() {
  const { data } = useFetch(ALIASES, getAliases);
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
      <Route path='/' element={<STimer />} />
      <Route path='/speaker' element={<STimer />} />
      <Route path='/presenter' element={<STimer />} />
      <Route path='/stage' element={<STimer />} />
      <Route path='/timer' element={<STimer />} />

      <Route path='/minimal' element={<SMinimalTimer />} />
      <Route path='/minimalTimer' element={<SMinimalTimer />} />
      <Route path='/simpleTimer' element={<SMinimalTimer />} />

      <Route path='/countdown' element={<SCountdown />} />

      <Route path='/sm' element={<SStageManager />} />
      <Route path='/backstage' element={<SStageManager />} />

      <Route path='/public' element={<SPublic />} />
      <Route path='/pip' element={<SPip />} />
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
        path='/eventlist'
        element={
          <FeatureWrapper>
            <EventList />
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
      <Route path='*' element={<STimer />} />
    </Routes>
  )
}
