import React, { createRoot } from 'react-dom/client';

import App from './App';

import './index.scss';

const container = document.getElementById('root');
// create a root
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
