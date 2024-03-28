import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { ContextMenu } from './common/components/context-menu/ContextMenu';
import ErrorBoundary from './common/components/error-boundary/ErrorBoundary';
import { AppContextProvider } from './common/context/AppContext';
import useElectronEvent from './common/hooks/useElectronEvent';
import { ontimeQueryClient } from './common/queryClient';
import { socketClientName } from './common/stores/connectionName';
import { connectSocket } from './common/utils/socket';
import theme from './theme/theme';
import { TranslationProvider } from './translation/TranslationProvider';
import AppRouter from './AppRouter';

// Load Open Sans typeface
// @ts-expect-error no types from font import
import('typeface-open-sans');

const preferredClientName = socketClientName.getState().name;
connectSocket(preferredClientName);

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
    <ChakraProvider disableGlobalStyle resetCSS theme={theme}>
      <QueryClientProvider client={ontimeQueryClient}>
        <AppContextProvider>
          <BrowserRouter>
            <div className='App'>
              <ErrorBoundary>
                <TranslationProvider>
                  <ContextMenu>
                    <AppRouter />
                  </ContextMenu>
                </TranslationProvider>
              </ErrorBoundary>
              <ReactQueryDevtools initialIsOpen={false} />
            </div>
          </BrowserRouter>
        </AppContextProvider>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

export default App;
