import { QueryFunction, QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';

interface UseFetchState {
  data: unknown;
  status: "loading" | "error" | "success";
  isError: boolean;
  refetch: () => void;
}

export const useFetch = ( key: QueryKey, fn: QueryFunction, options?: UseQueryOptions): UseFetchState => {
  const { data, status, isError, refetch } = useQuery(key, fn, {
    refetchInterval: 10000,
    cacheTime: Infinity,
    ...options
  });

  return { data, status, isError, refetch };
};
