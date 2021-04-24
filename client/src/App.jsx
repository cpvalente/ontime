import { Route } from 'react-router-dom';
import './App.css';
import Editor from './features/editors/Editor';
import DefaultPresenter from './features/viewers/DefaultPresenter';
import PresenterView from './features/viewers/presenter/PresenterView';
import { QueryClient, QueryClientProvider } from 'react-query';
import { broadcastQueryClient } from 'react-query/broadcastQueryClient-experimental';
import SocketProvider from './app/context/socketContext';
import PresenterSimple from './features/viewers/presenter/PresenterSimple';
import StageManager from './features/viewers/backstage/StageManager';
import withSocket from './features/viewers/ViewWrapper';
import Lower from './features/viewers/lower/Lower';

const queryClient = new QueryClient();
broadcastQueryClient({
  queryClient,
  broadcastChannel: 'ontime',
});

const SDefault = withSocket(DefaultPresenter);
const SSpeaker = withSocket(PresenterView);
const SSpeakerSimple = withSocket(PresenterSimple);
const SStageManager = withSocket(StageManager);
const SLowerThird = withSocket(Lower);

function App() {
  return (
    <SocketProvider>
      <QueryClientProvider client={queryClient}>
        <div className='App'>
          <Route exact path='/' component={PresenterView} />
          <Route exact path='/sm' component={SStageManager} />
          <Route exact path='/speaker' component={SSpeaker} />
          <Route exact path='/speakersimple' component={SSpeakerSimple} />
          <Route exact path='/editor' component={Editor} />
          <Route path='/lower' component={SLowerThird} />
        </div>
      </QueryClientProvider>
    </SocketProvider>
  );
}

export default App;
