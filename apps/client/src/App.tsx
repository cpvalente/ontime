import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import ErrorBoundary from './common/components/error-boundary/ErrorBoundary';
import { AppContextProvider } from './common/context/AppContext';
import { ContextMenuProvider } from './common/context/ContextMenuContext';
import useElectronEvent from './common/hooks/useElectronEvent';
import { ontimeQueryClient } from './common/queryClient';
import { connectSocket } from './common/utils/socket';
import theme from './theme/theme';
import { TranslationProvider } from './translation/TranslationProvider';
import AppRouter from './AppRouter';

// Load Open Sans typeface
// @ts-expect-error no types from font import
import('typeface-open-sans');

connectSocket();

function App() {
  const { isElectron, sendToElectron } = useElectronEvent();

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
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

    if (isElectron) {
      document.addEventListener('keydown', handleKeyPress);
    }
    return () => {
      if (isElectron) {
        document.removeEventListener('keydown', handleKeyPress);
      }
    };
  }, [isElectron, sendToElectron]);

  return (
    <ChakraProvider resetCSS theme={theme}>
      <QueryClientProvider client={ontimeQueryClient}>
        <AppContextProvider>
          <ContextMenuProvider>
            <BrowserRouter>
              <div className='App'>
                <ErrorBoundary>
                  <TranslationProvider>
                    <AppRouter />
                  </TranslationProvider>
                </ErrorBoundary>
                <ReactQueryDevtools initialIsOpen={false} />
              </div>
            </BrowserRouter>
          </ContextMenuProvider>
        </AppContextProvider>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

export default App;
