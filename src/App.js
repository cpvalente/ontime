import { Route } from 'react-router';
import './App.css';
import { EventListProvider } from './app/context/eventListContext';
import Editor from './features/editors/Editor';
import DefaultPresenter from './features/viewers/DefaultPresenter';

function App() {
  return (
    <div className='App'>
      <Route path='/' exact component={DefaultPresenter} />
      <EventListProvider>
        <Route path='/editor' exact component={Editor} />
      </EventListProvider>
    </div>
  );
}

export default App;
