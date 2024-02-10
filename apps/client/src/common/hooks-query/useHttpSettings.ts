import { useMutation, useQuery } from '@tanstack/react-query';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { HTTP_SETTINGS } from '../api/apiConstants';
import { logAxiosError } from '../api/apiUtils';
import { getHTTP, postHTTP } from '../api/ontimeApi';
import { httpPlaceholder } from '../models/Http';
import { ontimeQueryClient } from '../queryClient';

export function useHttpSettings() {
  const { data, status, isFetching, isError, refetch } = useQuery({
    queryKey: HTTP_SETTINGS,
    queryFn: getHTTP,
    placeholderData: httpPlaceholder,
    retry: 5,
    retryDelay: (attempt: number) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });

  // we need to jump through some hoops because of the type op port
  return { data: data ?? httpPlaceholder, status, isFetching, isError, refetch };
}

export function usePostHttpSettings() {
  const { isPending, mutateAsync } = useMutation({
    mutationFn: postHTTP,
    onError: (error) => logAxiosError('Error saving HTTP settings', error),
    onSuccess: (res) => {
      console.log('will patch cache', res);
      ontimeQueryClient.setQueryData(HTTP_SETTINGS, res);
    },
    onSettled: () => ontimeQueryClient.invalidateQueries({ queryKey: HTTP_SETTINGS }),
  });
  return { isPending, mutateAsync };
}
