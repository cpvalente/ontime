import { Route } from 'react-router';
import './App.css';
import Editor from './features/editors/Editor';
import DefaultPresenter from './features/viewers/DefaultPresenter';
import { QueryClient, QueryClientProvider } from 'react-query';
import SocketProvider from './app/context/socketContext';

const queryClient = new QueryClient();

function App() {
  return (
    <SocketProvider>
      <div className='App'>
        <Route path='/' exact component={DefaultPresenter} />
        <QueryClientProvider client={queryClient}>
          <Route path='/editor' exact component={Editor} />
        </QueryClientProvider>
      </div>
    </SocketProvider>
  );
}

export default App;
