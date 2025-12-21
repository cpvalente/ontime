import { BrowserRouter } from 'react-router';
import { Tooltip } from '@base-ui/react/tooltip';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import ErrorBoundary from './common/components/error-boundary/ErrorBoundary';
import IdentifyOverlay from './common/components/identify-overlay/IdentifyOverlay';
import { AppContextProvider } from './common/context/AppContext';
import { ontimeQueryClient } from './common/queryClient';
import { connectSocket } from './common/utils/socket';
import KeepAwake from './features/keep-awake/KeepAwake';
import { TranslationProvider } from './translation/TranslationProvider';
import AppRouter from './AppRouter';
import { baseURI } from './externals';

connectSocket();

function App() {
  return (
    <QueryClientProvider client={ontimeQueryClient}>
      <AppContextProvider>
        <Tooltip.Provider>
          <BrowserRouter basename={baseURI}>
            <div className='App'>
              <ErrorBoundary>
                <TranslationProvider>
                  <IdentifyOverlay />
                  <KeepAwake />
                  <AppRouter />
                </TranslationProvider>
              </ErrorBoundary>
              <ReactQueryDevtools initialIsOpen={false} />
            </div>
            <ErrorBoundary>
              <div id='identify-portal' />
            </ErrorBoundary>
          </BrowserRouter>
        </Tooltip.Provider>
      </AppContextProvider>
    </QueryClientProvider>
  );
}

export default App;
