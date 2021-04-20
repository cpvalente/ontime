import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';

// 1. import `ChakraProvider` component
import { ChakraProvider, CSSReset } from '@chakra-ui/react';

ReactDOM.render(
  <React.StrictMode>
    <ChakraProvider>
      <BrowserRouter>
        <CSSReset />
        <App />
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
