import './App.css';
import Editor from './features/editors/Editor';
import DefaultPresenter from './features/viewers/DefaultPresenter';

function App() {
  return (
    <div className='App'>
      {/* <Editor /> */}
      <DefaultPresenter />
    </div>
  );
}

export default App;
