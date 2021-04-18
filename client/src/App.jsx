import { Route, Switch } from 'react-router-dom';
import './App.css';
import Editor from './features/editors/Editor';
import DefaultPresenter from './features/viewers/DefaultPresenter';
import PresenterView from './features/viewers/presenter/PresenterView';
import { QueryClient, QueryClientProvider } from 'react-query';
import SocketProvider from './app/context/socketContext';
import PresenterSimple from './features/viewers/presenter/PresenterSimple';
import StageManager from './features/viewers/backstage/StageManager';
import withSocket from './features/viewers/ViewWrapper';

const queryClient = new QueryClient();

const SDefault = withSocket(DefaultPresenter);
const SSpeaker = withSocket(PresenterView);
const SSpeakerSimple = withSocket(PresenterSimple);
const SStageManager = withSocket(StageManager);

function App() {
  return (
    <SocketProvider>
      <div className='App'>
        <Switch>
          <Route exact path='/' component={SDefault} />
          <Route path='/sm' component={SStageManager} />
          <Route path='/speaker' component={SSpeaker} />
          <Route path='/speakersimple' component={SSpeakerSimple} />

          <QueryClientProvider client={queryClient}>
            <Route path='/editor' component={Editor} />
          </QueryClientProvider>
        </Switch>
      </div>
    </SocketProvider>
  );
}

export default App;
