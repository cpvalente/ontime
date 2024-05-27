import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import ErrorBoundary from './common/components/error-boundary/ErrorBoundary';
import { AppContextProvider } from './common/context/AppContext';
import { ontimeQueryClient } from './common/queryClient';
import { socketClientName } from './common/stores/connectionName';
import { connectSocket } from './common/utils/socket';
import theme from './theme/theme';
import { TranslationProvider } from './translation/TranslationProvider';
import AppRouter from './AppRouter';

const preferredClientName = socketClientName.getState().name;
connectSocket(preferredClientName);

function App() {
  return (
    <ChakraProvider disableGlobalStyle resetCSS theme={theme}>
      <QueryClientProvider client={ontimeQueryClient}>
        <AppContextProvider>
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
        </AppContextProvider>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

export default App;
