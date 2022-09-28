import { Suspense, useCallback, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import ErrorBoundary from 'common/components/errorBoundary/ErrorBoundary';

import { AppContextProvider } from './common/context/AppContext';
import SocketProvider from './common/context/socketContext';
import theme from './theme/theme';
import AppRouter from './AppRouter';

// Load Open Sans typeface
import('typeface-open-sans');
export const ontimeQueryClient = new QueryClient();

function App() {

  // Handle keyboard shortcuts
  const handleKeyPress = useCallback((e) => {
    // handle held key
    if (e.repeat) return;
    // check if the alt key is pressed
    if (e.altKey) {
      if (e.key === 't' || e.key === 'T') {
        // if we are in electron
        if (window.process?.type === 'renderer') {
          // ask to see debug
          window.ipcRenderer.send('set-window', 'show-dev');
        }
      }
    }
  }, []);

  useEffect(() => {
    // attach the event listener
    document.addEventListener('keydown', handleKeyPress);

    // remove the event listener
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
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
