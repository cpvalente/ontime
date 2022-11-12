import { Suspense, useCallback, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import ErrorBoundary from 'common/components/errorBoundary/ErrorBoundary';

import { AppContextProvider } from './common/context/AppContext';
import SocketProvider from './common/context/socketContext';
import useElectronEvent from './common/hooks/useElectronEvent';
import theme from './theme/theme';
import AppRouter from './AppRouter';

// Load Open Sans typeface
import('typeface-open-sans');
export const ontimeQueryClient = new QueryClient();

function App() {
  const { isElectron, sendToElectron } = useElectronEvent();

  const handleKeyPress = useCallback((event) => {
      // handle held key
      if (event.repeat) return;
      // check if the alt key is pressed
      if (event.altKey) {
        if (event.code === 'KeyT') {
          // ask to see debug
          sendToElectron('set-window', 'show-dev');
        }
      }
    },[]);

  useEffect(() => {
    if (isElectron) {
      document.addEventListener('keydown', handleKeyPress);
    }
    return () => {
      if (isElectron) {
        document.removeEventListener('keydown', handleKeyPress);
      }
    };
  }, [handleKeyPress]);

  return (
    <ChakraProvider resetCSS theme={theme}>
      <SocketProvider>
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
      </SocketProvider>
    </ChakraProvider>
  );
}

export default App;
