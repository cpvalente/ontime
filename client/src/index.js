import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AppContextProvider } from './app/context/AppContext';
import SocketProvider from './app/context/socketContext';

// Load Open Sans typeface
require('typeface-open-sans');
const queryClient = new QueryClient();

ReactDOM.render(
  <React.StrictMode>
    <ChakraProvider resetCSS>
      <SocketProvider>
        <QueryClientProvider client={queryClient}>
          <AppContextProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AppContextProvider>
        </QueryClientProvider>
      </SocketProvider>
    </ChakraProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
