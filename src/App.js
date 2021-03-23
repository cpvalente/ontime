import { Route } from 'react-router';
import './App.css';
import Editor from './features/editors/Editor';
import DefaultPresenter from './features/viewers/DefaultPresenter';

function App() {
  return (
    <div className='App'>
      <Route path='/' exact component={DefaultPresenter} />
      <Route path='/editor' exact component={Editor} />
    </div>
  );
}

export default App;
