import { useMutation, useQuery } from '@tanstack/react-query';
import { HTTPSettings } from 'ontime-types';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { HTTP_SETTINGS } from '../api/apiConstants';
import { logAxiosError } from '../api/apiUtils';
import { getHTTP, postHttpSubscriptions } from '../api/ontimeApi';
import { httpPlaceholder } from '../models/Http';
import { ontimeQueryClient } from '../queryClient';

export default function useHttpSettings() {
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
  return { data: data! as unknown as HTTPSettings, status, isFetching, isError, refetch };
}


export function usePostHttpSubscriptions() {
  const { isLoading, mutateAsync } = useMutation({
    mutationFn: postHttpSubscriptions,
    onError: (error) => logAxiosError('Error saving HTTP settings', error),
    onSettled: () => ontimeQueryClient.invalidateQueries({ queryKey: HTTP_SETTINGS }),
  });
  return { isLoading, mutateAsync };
}
