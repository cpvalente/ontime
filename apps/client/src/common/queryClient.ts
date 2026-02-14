import { QueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { MILLIS_PER_MINUTE } from 'ontime-utils';

import { isOntimeCloud } from '../externals';

export const ontimeQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 10 * MILLIS_PER_MINUTE,
      // staleTime: MILLIS_PER_HOUR, //TODO: when all routes have implemented refetch signal from server, we can the assume that the data is not stale until we get the signal
      networkMode: isOntimeCloud ? 'online' : 'always',
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (axios.isCancel(error)) {
          return false;
        }
        return failureCount < 5;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    },
    mutations: {
      /**
       * React Query detects whether the client is online
       * However, web access is not required for the clients when deployed locally
       * - use 'always' for clients that may be online
       * - use 'online' for clients that are connected to the cloud
       */
      networkMode: isOntimeCloud ? 'online' : 'always',
      retry: 0,
    },
  },
});
