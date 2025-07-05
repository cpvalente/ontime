import { QueryClient } from '@tanstack/react-query';
import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE } from 'ontime-utils';

import { isOntimeCloud } from '../externals';

export const ontimeQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 10 * MILLIS_PER_MINUTE,
      staleTime: MILLIS_PER_HOUR,
      networkMode: 'always',
      refetchOnWindowFocus: false,
      retry: 5,
      retryDelay: (attempt) => attempt * 2500,
      initialDataUpdatedAt: -1,
    },
    mutations: {
      /**
       * React Query detects whether the client is online
       * However, web access is not required for the clients when deployed locally
       * - use 'always' for clients that may be local
       * - use 'online' for clients that are connected to the cloud
       */
      networkMode: isOntimeCloud ? 'online' : 'always',
    },
  },
});
