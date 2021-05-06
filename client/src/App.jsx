import { lazy, Suspense } from 'react';
import { Route, Switch } from 'react-router-dom';
import './App.css';
import { QueryClient, QueryClientProvider } from 'react-query';
import SocketProvider from './app/context/socketContext';
import withSocket from './features/viewers/ViewWrapper';
import { ReactQueryDevtools } from 'react-query/devtools';
import Empty from './common/state/Empty';

const Editor = lazy(() => import('./features/editors/Editor'));
const PresenterView = lazy(() =>
  import('./features/viewers/presenter/PresenterView')
);
const PresenterSimple = lazy(() =>
  import('./features/viewers/presenter/PresenterSimple')
);
const StageManager = lazy(() =>
  import('./features/viewers/backstage/StageManager')
);
const Public = lazy(() => import('./features/viewers/foh/Public'));
const Lower = lazy(() =>
  import('./features/viewers/production/lower/LowerWrapper')
);
const Pip = lazy(() => import('./features/viewers/production/Pip'));

const queryClient = new QueryClient();
// Seemed to cause issues
// broadcastQueryClient({
//   queryClient,
//   broadcastChannel: 'ontime',
// });

const SSpeaker = withSocket(PresenterView);
const SSpeakerSimple = withSocket(PresenterSimple);
const SStageManager = withSocket(StageManager);
const SPublic = withSocket(Public);
const SLowerThird = withSocket(Lower);
const SPip = withSocket(Pip);

function App() {
  return (
    <SocketProvider>
      <QueryClientProvider client={queryClient}>
        <div className='App'>
          <Suspense fallback={<Empty text='Loading' />}>
            <Switch>
              <Route exact path='/' component={SSpeaker} />
              <Route exact path='/sm' component={SStageManager} />
              <Route exact path='/speaker' component={SSpeaker} />
              <Route exact path='/speakersimple' component={SSpeakerSimple} />
              <Route exact path='/editor' component={Editor} />
              <Route exact path='/public' component={SPublic} />
              <Route exact path='/lower' component={SLowerThird} />
              <Route exact path='/pip' component={SPip} />
              {/* Send to default if nothing found */}
              <Route component={SSpeaker} />
            </Switch>
            <ReactQueryDevtools initialIsOpen={false} />
          </Suspense>
        </div>
      </QueryClientProvider>
    </SocketProvider>
  );
}

export default App;
