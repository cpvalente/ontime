import { QueryClient } from '@tanstack/react-query';

export const ontimeQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 10, // 10 min
    },
  },
});
