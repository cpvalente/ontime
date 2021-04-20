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
      <QueryClientProvider client={queryClient}>
        <div className='App'>
          <Switch>
            <Route exact path='/' component={SDefault} />
            <Route exact path='/sm' component={SStageManager} />
            <Route exact path='/speaker' component={SSpeaker} />
            <Route exact path='/speakersimple' component={SSpeakerSimple} />
            <Route exact path='/editor' component={Editor} />
          </Switch>
        </div>
      </QueryClientProvider>
    </SocketProvider>
  );
}

export default App;
