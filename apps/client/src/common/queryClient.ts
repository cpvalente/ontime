import { QueryClient } from '@tanstack/react-query';

import { isOntimeCloud } from '../externals';

export const ontimeQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 10, // 10 min
    },
    mutations: {
      /**
       * React Query detects whether the client is online
       * However, web access is not required for the clients when deployed locally
       * - use 'always' for clients that may be online
       * - use 'online' for clients that are connected to the cloud
       */
      networkMode: isOntimeCloud ? 'online' : 'always',
    },
  },
});
