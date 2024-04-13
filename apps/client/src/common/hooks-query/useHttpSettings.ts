import { useMutation, useQuery } from '@tanstack/react-query';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { HTTP_SETTINGS } from '../api/constants';
import { getHTTP, postHTTP } from '../api/http';
import { logAxiosError } from '../api/utils';
import { httpPlaceholder } from '../models/Http';
import { ontimeQueryClient } from '../queryClient';

export function useHttpSettings() {
  const { data, status, isFetching, isError, refetch } = useQuery({
    queryKey: HTTP_SETTINGS,
    queryFn: getHTTP,
    placeholderData: (previousData, _previousQuery) => previousData,
    retry: 5,
    retryDelay: (attempt: number) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });

  return { data: data ?? httpPlaceholder, status, isFetching, isError, refetch };
}

export function usePostHttpSettings() {
  const { isPending, mutateAsync } = useMutation({
    mutationFn: postHTTP,
    onError: (error) => logAxiosError('Error saving HTTP settings', error),
    onSuccess: (res) => {
      ontimeQueryClient.setQueryData(HTTP_SETTINGS, res.data);
    },
    onSettled: () => ontimeQueryClient.invalidateQueries({ queryKey: HTTP_SETTINGS }),
  });
  return { isPending, mutateAsync };
}
