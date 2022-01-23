import { lazy, Suspense, useCallback, useEffect } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './App.scss';
import withSocket from 'features/viewers/ViewWrapper';
import ErrorBoundary from 'common/components/errorBoundary/ErrorBoundary';
import ProtectRoute from './common/components/protectRoute/ProtectRoute';
import { useFetch } from './app/hooks/useFetch';
import { ALIASES } from './app/api/apiConstants';
import { getAliases } from './app/api/ontimeApi';

const Editor = lazy(() => import('features/editors/Editor'));
const Table = lazy(() => import('features/table/TableWrapper'));

const TimerView = lazy(() => import('features/viewers/timer/Timer'));
const MinimalTimerView = lazy(() => import('features/viewers/timer/MinimalTimer'));

const StageManager = lazy(() => import('features/viewers/backstage/StageManager'));
const Public = lazy(() => import('features/viewers/foh/Public'));
const Lower = lazy(() => import('features/viewers/production/lower/LowerWrapper'));
const Pip = lazy(() => import('features/viewers/production/Pip'));
const StudioClock = lazy(() => import('features/viewers/studio/StudioClock'));

const STimer = withSocket(TimerView);
const SMinimalTimer = withSocket(MinimalTimerView);
const SStageManager = withSocket(StageManager);
const SPublic = withSocket(Public);
const SLowerThird = withSocket(Lower);
const SPip = withSocket(Pip);
const SStudio = withSocket(StudioClock);

const ProtectedEditor = () => (
  <ProtectRoute>
    <Editor />
  </ProtectRoute>
);

const ProtectedTable = () => (
  <ProtectRoute>
    <Table />
  </ProtectRoute>
);

function App() {
  const { data } = useFetch(ALIASES, getAliases);
  const location = useLocation();
  const navigate = useNavigate();

  // Handle keyboard shortcuts
  const handleKeyPress = useCallback((e) => {
    // handle held key
    if (e.repeat) return;
    // check if the alt key is pressed
    if (e.altKey) {
      if (e.key === 't' || e.key === 'T') {
        // if we are in electron
        if (window.process?.type === undefined) return;
        if (window.process.type === 'renderer') {
          // ask to see debug
          window.ipcRenderer.send('set-window', 'show-dev');
        }
      }
    }
  }, []);

  useEffect(() => {
    // attach the event listener
    document.addEventListener('keydown', handleKeyPress);

    // remove the event listener
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  // navigate if is alias route
  useEffect(() => {
    if (data == null) return;
    for (const d of data) {
      if (`/${d.alias}` === location.pathname && d.enabled) {
        navigate(`/${d.pathAndParams}`);
        break;
      }
    }
  }, [data, location, navigate]);

  return (
    <div className='App'>
      <ErrorBoundary>
        <Suspense fallback={null}>
          <Routes>
            <Route path='/' element={<STimer />} />
            <Route path='/speaker' element={<STimer />} />
            <Route path='/presenter' element={<STimer />} />
            <Route path='/stage' element={<STimer />} />
            <Route path='/timer' element={<STimer />} />

            <Route path='/minimal' element={<SMinimalTimer />} />
            <Route path='/minimalTimer' element={<SMinimalTimer />} />
            <Route path='/simpleTimer' element={<SMinimalTimer />} />

            <Route path='/sm' element={<SStageManager />} />
            <Route path='/backstage' element={<SStageManager />} />

            <Route path='/public' element={<SPublic />} />
            <Route path='/pip' element={<SPip />} />
            <Route path='/studio' element={<SStudio />} />
            {/*/!* Lower cannot have fallback *!/*/}
            <Route path='/lower' element={<SLowerThird />} />

            {/*/!* Protected Routes *!/*/}
            <Route path='/editor' element={<ProtectedEditor />} />
            <Route path='/table' element={<ProtectedTable />} />

            {/* Send to default if nothing found */}
            <Route path='*' element={<STimer />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

export default App;
