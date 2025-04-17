import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { MantineProvider } from '@mantine/core';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import ErrorBoundary from './common/components/error-boundary/ErrorBoundary';
import IdentifyOverlay from './common/components/identify-overlay/IdentifyOverlay';
import { AppContextProvider } from './common/context/AppContext';
import { ontimeQueryClient } from './common/queryClient';
import { connectSocket } from './common/utils/socket';
import theme, { mantineTheme } from './theme/theme';
import { TranslationProvider } from './translation/TranslationProvider';
import AppRouter from './AppRouter';
import { baseURI } from './externals';

import '@mantine/core/styles.css';

connectSocket();

function App() {
  return (
    <MantineProvider theme={mantineTheme} forceColorScheme='dark'>
      <ChakraProvider disableGlobalStyle resetCSS theme={theme}>
        <QueryClientProvider client={ontimeQueryClient}>
          <AppContextProvider>
            <BrowserRouter basename={baseURI}>
              <div className='App'>
                <ErrorBoundary>
                  <TranslationProvider>
                    <IdentifyOverlay />
                    <AppRouter />
                  </TranslationProvider>
                </ErrorBoundary>
                <ReactQueryDevtools initialIsOpen={false} />
              </div>
              <ErrorBoundary>
                <div id='identify-portal' />
              </ErrorBoundary>
            </BrowserRouter>
          </AppContextProvider>
        </QueryClientProvider>
      </ChakraProvider>
    </MantineProvider>
  );
}

export default App;
