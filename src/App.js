import { Route } from 'react-router';
import './App.css';
import { EventProvider } from './app/context/eventContext';
import { EventListProvider } from './app/context/eventListContext';
import Editor from './features/editors/Editor';
import DefaultPresenter from './features/viewers/DefaultPresenter';

function App() {
  return (
    <EventProvider>
      <div className='App'>
        {/* <Route path='/' exact component={DefaultPresenter} /> */}
        <EventListProvider>
          <Route path='/editor' exact component={Editor} />
        </EventListProvider>
      </div>
    </EventProvider>
  );
}

export default App;
