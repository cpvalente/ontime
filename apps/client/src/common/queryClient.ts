import { QueryClient } from '@tanstack/react-query';

export const ontimeQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 10, // 10 min
    },
  },
});
