import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';

import { AppContextProvider } from './app/context/AppContext';
import SocketProvider from './app/context/socketContext';
import theme from './theme/theme';
import App from './App';
import reportWebVitals from './reportWebVitals';

import './index.scss';

// Load Open Sans typeface
require('typeface-open-sans');
const queryClient = new QueryClient();

const container = document.getElementById('root');
// create a root
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ChakraProvider resetCSS theme={theme}>
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
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
