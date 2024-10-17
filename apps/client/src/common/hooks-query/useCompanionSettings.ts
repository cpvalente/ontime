import { useMutation, useQuery } from '@tanstack/react-query';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { getCompanion, postCompanion } from '../api/companion';
import { COMPANION_SETTINGS } from '../api/constants';
import { logAxiosError } from '../api/utils';
import { ontimeQueryClient } from '../queryClient';

export default function useCompanionSettings() {
  const { data, status, isFetching, isError, refetch } = useQuery({
    queryKey: COMPANION_SETTINGS,
    queryFn: getCompanion,
    placeholderData: (previousData, _previousQuery) => previousData,
    retry: 5,
    retryDelay: (attempt: number) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });

  return {
    data: data ?? { enabledOut: false, targetIP: '127.0.0.1', portOut: 8000 },
    status,
    isFetching,
    isError,
    refetch,
  };
}

export function useOscSettingsMutation() {
  const { isPending, mutateAsync } = useMutation({
    mutationFn: postCompanion,
    onError: (error) => logAxiosError('Error saving OSC settings', error),
    onSuccess: (res) => {
      ontimeQueryClient.setQueryData(COMPANION_SETTINGS, res.data);
    },
    onSettled: () => ontimeQueryClient.invalidateQueries({ queryKey: COMPANION_SETTINGS }),
  });
  return { isPending, mutateAsync };
}
