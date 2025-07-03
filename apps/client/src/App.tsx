import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import ErrorBoundary from './common/components/error-boundary/ErrorBoundary';
import IdentifyOverlay from './common/components/identify-overlay/IdentifyOverlay';
import { AppContextProvider } from './common/context/AppContext';
import { ontimeQueryClient } from './common/queryClient';
import { connectSocket } from './common/utils/socket';
import theme from './theme/theme';
import { TranslationProvider } from './translation/TranslationProvider';
import { routes } from './AppRouter';
import { baseURI } from './externals';
import { initializeSentry } from './sentry.setup';

connectSocket();

const router = createBrowserRouter(routes, { basename: baseURI });

initializeSentry(router);

function App() {
  return (
    <ChakraProvider disableGlobalStyle resetCSS theme={theme}>
      <QueryClientProvider client={ontimeQueryClient}>
        <AppContextProvider>
          {/* TranslationProvider wraps all components that need access to translations,
              including the routed components rendered by RouterProvider and IdentifyOverlay. */}
          <TranslationProvider>
            <div className='App'> {/* Main app container preserved */}
              <ErrorBoundary>
                <IdentifyOverlay /> {/* IdentifyOverlay preserved in its original location */}
                {/* RouterProvider takes the place of where AppRouter (as a component) used to be,
                    rendering the actual routes. */}
                <RouterProvider router={router} />
              </ErrorBoundary>
              <ReactQueryDevtools initialIsOpen={false} />
            </div>
            {/* This ErrorBoundary and portal div are outside the main .App div, as in original */}
            <ErrorBoundary>
              <div id='identify-portal' />
            </ErrorBoundary>
          </TranslationProvider>
        </AppContextProvider>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

export default App;
