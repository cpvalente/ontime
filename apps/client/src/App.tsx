import { Tooltip } from '@base-ui/react/tooltip';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router';

// apply global axios config defaults
import './common/api/axios.config';
import AppRouter from './AppRouter';
import ErrorBoundary from './common/components/error-boundary/ErrorBoundary';
import IdentifyOverlay from './common/components/identify-overlay/IdentifyOverlay';
import { AppContextProvider } from './common/context/AppContext';
import { ontimeQueryClient } from './common/queryClient';
import { connectSocket } from './common/utils/socket';
import { baseURI } from './externals';
import KeepAwake from './features/keep-awake/KeepAwake';
import { TranslationProvider } from './translation/TranslationProvider';

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
