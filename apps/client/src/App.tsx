import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { ContextMenu } from './common/components/context-menu/ContextMenu';
import ErrorBoundary from './common/components/error-boundary/ErrorBoundary';
import { AppContextProvider } from './common/context/AppContext';
import useElectronEvent from './common/hooks/useElectronEvent';
import { ontimeQueryClient } from './common/queryClient';
import { socketClientName } from './common/stores/connectionName';
import { connectSocket } from './common/utils/socket';
import { TranslationProvider } from './translation/TranslationProvider';
import AppRouter from './AppRouter';

import { theme } from './theme/mantineTheme';

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
    <QueryClientProvider client={ontimeQueryClient}>
      <AppContextProvider>
        <BrowserRouter>
          <MantineProvider theme={theme} defaultColorScheme='dark'>
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
          </MantineProvider>
        </BrowserRouter>
      </AppContextProvider>
    </QueryClientProvider>
  );
}

export default App;
