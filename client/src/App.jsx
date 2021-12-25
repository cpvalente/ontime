import { lazy, Suspense, useCallback, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import './App.scss';
import { QueryClient, QueryClientProvider } from 'react-query';
import SocketProvider from 'app/context/socketContext';
import withSocket from 'features/viewers/ViewWrapper';
import ErrorBoundary from 'common/components/errorBoundary/ErrorBoundary';

const Editor = lazy(() => import('features/editors/Editor'));
const PresenterView = lazy(() =>
  import('features/viewers/presenter/PresenterView')
);
const PresenterSimple = lazy(() =>
  import('features/viewers/presenter/PresenterSimple')
);
const StageManager = lazy(() =>
  import('features/viewers/backstage/StageManager')
);
const Public = lazy(() => import('features/viewers/foh/Public'));
const Lower = lazy(() =>
  import('features/viewers/production/lower/LowerWrapper')
);
const Pip = lazy(() => import('features/viewers/production/Pip'));
const StudioClock = lazy(() => import('features/viewers/studio/StudioClock'));

const queryClient = new QueryClient();
// Seemed to cause issues
// broadcastQueryClient({
//   queryClient,
//   broadcastChannel: 'ontime',
// });

const SPresenter = withSocket(PresenterView);
const SPresenterSimple = withSocket(PresenterSimple);
const SStageManager = withSocket(StageManager);
const SPublic = withSocket(Public);
const SLowerThird = withSocket(Lower);
const SPip = withSocket(Pip);
const SStudio = withSocket(StudioClock);

function App() {
  // Handle keyboard shortcuts
  const handleKeyPress = useCallback((e) => {
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

  return (
    <SocketProvider>
      <QueryClientProvider client={queryClient}>
        <div className='App'>
          <ErrorBoundary>
            <Suspense fallback={null}>
              <Routes>
                <Route path='/' element={<SPresenter />}/>
                <Route path='/sm' element={<SStageManager />}/>
                <Route path='/speaker' element={<SPresenter />}/>
                <Route path='/presenter' element={<SPresenter />}/>
                <Route path='/stage' element={<SPresenter />}/>
                <Route path='/presentersimple' element={<SPresenterSimple />}/>
                <Route path='/editor' element={<Editor />}/>
                <Route path='/public' element={<SPublic />}/>
                <Route path='/pip' element={<SPip />}/>
                <Route path='/studio' element={<SStudio /> }/>
                {/*/!* Lower cannot have fallback *!/*/}
                <Route path='/lower' element={<SLowerThird /> }/>
                {/* Send to default if nothing found */}
                <Route path='*' element={<SPresenter />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </div>
      </QueryClientProvider>
    </SocketProvider>
  );
}

export default App;
