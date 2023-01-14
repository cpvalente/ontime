import { QueryClient } from '@tanstack/react-query';

export const queryClientMock = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});
