import { Suspense, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import ErrorBoundary from 'common/components/error-boundary/ErrorBoundary';
import { AppContextProvider } from 'common/context/AppContext';
import { LoggingProvider } from 'common/context/LoggingContext';

import useElectronEvent from './common/hooks/useElectronEvent';
import { ontimeQueryClient } from './common/queryClient';
import theme from './theme/theme';
import AppRouter from './AppRouter';

// Load Open Sans typeface
// @ts-expect-error no types from font import
import('typeface-open-sans');

function App() {
  const { isElectron, sendToElectron } = useElectronEvent();

  const handleKeyPress = (event:KeyboardEvent) => {
      // handle held key
      if (event.repeat) return;
      // check if the alt key is pressed
      if (event.altKey) {
        if (event.code === 'KeyT') {
          // ask to see debug
          sendToElectron('set-window', 'show-dev');
        }
      }
    };

  useEffect(() => {
    if (isElectron) {
      document.addEventListener('keydown', handleKeyPress);
    }
    return () => {
      if (isElectron) {
        document.removeEventListener('keydown', handleKeyPress);
      }
    };
  }, []);

  return (
    <ChakraProvider resetCSS theme={theme}>
      <LoggingProvider>
        <QueryClientProvider client={ontimeQueryClient}>
          <AppContextProvider>
            <BrowserRouter>
              <div className='App'>
                <ErrorBoundary>
                  <Suspense fallback={null}>
                    <AppRouter />
                  </Suspense>
                </ErrorBoundary>
                <ReactQueryDevtools initialIsOpen={false} />
              </div>
            </BrowserRouter>
          </AppContextProvider>
        </QueryClientProvider>
      </LoggingProvider>
    </ChakraProvider>
  );
}

export default App;
