import { useQuery } from 'react-query';
const refetchIntervalMs = 10000;

/**
 * @description utility hook to simplify query config
 * @param namespace
 * @param fn
 */
export const useFetch = (namespace, fn) => {
  const { data, status, isError, refetch } = useQuery(namespace, fn, {
    refetchInterval: refetchIntervalMs,
    cacheTime: Infinity,
    notifyOnChangeProps: 'tracked',
  });

  return { data, status, isError, refetch };
};
