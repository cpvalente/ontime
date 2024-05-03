import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { ContextMenu } from './common/components/context-menu/ContextMenu';
import ErrorBoundary from './common/components/error-boundary/ErrorBoundary';
import { AppContextProvider } from './common/context/AppContext';
import { ontimeQueryClient } from './common/queryClient';
import { connectSocket } from './common/utils/socket';
import theme from './theme/theme';
import { TranslationProvider } from './translation/TranslationProvider';
import AppRouter from './AppRouter';

connectSocket();

function App() {
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
